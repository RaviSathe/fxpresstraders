import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Candle } from './chart-utils';

/**
 * Live market data from free, keyless public APIs (browser only).
 *
 *  - Crypto: Binance public REST + WebSocket (live). Falls back to CoinGecko
 *    (polled every 60s) where Binance is unreachable.
 *  - Forex:  Frankfurter (European Central Bank reference rates). These update
 *    once per working day, so they are labelled "daily", never "live".
 *
 * Socket messages are buffered and flushed to signals at most once a second,
 * and the socket is closed while the tab is hidden.
 */

export interface Quote {
  price: number;
  changePct: number;
  /** Recent closes, oldest first, for sparklines. */
  spark: number[];
}

export type CryptoSource = 'binance' | 'coingecko' | null;

/** Binance's public market-data mirror first (often reachable where the main API is blocked), then the main API. */
const BINANCE_HOSTS = ['https://data-api.binance.vision/api/v3', 'https://api.binance.com/api/v3'];
const BINANCE_WS = 'wss://stream.binance.com:9443/stream?streams=';
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price';
const FRANKFURTER = ['https://api.frankfurter.dev/v1', 'https://api.frankfurter.app'];

export const HERO_PAIR = 'BTC/USDT';
const HERO_SYMBOL = 'BTCUSDT';

const CRYPTO = [
  { pair: 'BTC/USDT', symbol: 'BTCUSDT', gecko: 'bitcoin' },
  { pair: 'ETH/USDT', symbol: 'ETHUSDT', gecko: 'ethereum' },
  { pair: 'SOL/USDT', symbol: 'SOLUSDT', gecko: 'solana' },
  { pair: 'USDC/USDT', symbol: 'USDCUSDT', gecko: 'usd-coin' },
];

/** Frankfurter quotes everything against USD; "invert" turns USD→EUR into EUR/USD. */
const FOREX = [
  { pair: 'EUR/USD', ccy: 'EUR', invert: true },
  { pair: 'GBP/USD', ccy: 'GBP', invert: true },
  { pair: 'USD/JPY', ccy: 'JPY', invert: false },
  { pair: 'USD/CHF', ccy: 'CHF', invert: false },
  { pair: 'AUD/USD', ccy: 'AUD', invert: true },
  { pair: 'USD/CAD', ccy: 'CAD', invert: false },
];

interface MiniTicker {
  e: '24hrMiniTicker';
  s: string;
  c: string;
  o: string;
}

interface KlineEvent {
  e: 'kline';
  k: { t: number; o: string; h: string; l: string; c: string };
}

type BinanceKline = [number, string, string, string, string, ...unknown[]];

@Injectable({ providedIn: 'root' })
export class MarketData {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly crypto = signal<Record<string, Quote>>({});
  readonly forex = signal<Record<string, Quote>>({});
  /** Up to a year of daily closes per forex pair, oldest first. */
  readonly forexHistory = signal<Record<string, number[]>>({});
  /** Date of the latest ECB reference rate (YYYY-MM-DD). */
  readonly forexDate = signal<string | null>(null);
  readonly cryptoSource = signal<CryptoSource>(null);
  /** Live 1-minute candles for the hero pair, or null when unavailable. */
  readonly candles = signal<Candle[] | null>(null);
  readonly quotes = computed(() => ({ ...this.forex(), ...this.crypto() }));

  private started = false;
  private ws: WebSocket | null = null;
  private backoff = 1000;
  private retryTimer = 0;
  private flushTimer = 0;
  private geckoTimer = 0;
  private hiddenAt = 0;
  private lastCandleOpen = 0;
  private readonly pendingTicks = new Map<string, MiniTicker>();
  private pendingKline: KlineEvent['k'] | null = null;

  /** Safe to call many times; only the first call in the browser does anything. */
  start(): void {
    if (!this.browser || this.started) return;
    this.started = true;
    void this.loadForex();
    void this.loadCrypto();
    document.addEventListener('visibilitychange', () => this.onVisibility());
  }

  /* ---------------- Crypto ---------------- */

  /** Binance host that answered last; tried first next time. */
  private binance = BINANCE_HOSTS[0];

  private async binanceGet<T>(path: string): Promise<T> {
    const hosts = [this.binance, ...BINANCE_HOSTS.filter((h) => h !== this.binance)];
    let lastErr: unknown;
    for (const host of hosts) {
      try {
        const res = await getJson<T>(host + path, 5000);
        this.binance = host;
        return res;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }

  private async loadCrypto(): Promise<void> {
    try {
      const symbols = encodeURIComponent(JSON.stringify(CRYPTO.map((c) => c.symbol)));
      const [tickers, heroKlines, ...sparks] = await Promise.all([
        this.binanceGet<Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>>(
          `/ticker/24hr?symbols=${symbols}`,
        ),
        this.binanceGet<BinanceKline[]>(`/klines?symbol=${HERO_SYMBOL}&interval=1m&limit=30`),
        ...CRYPTO.map((c) => this.binanceGet<BinanceKline[]>(`/klines?symbol=${c.symbol}&interval=1h&limit=24`)),
      ]);

      const out: Record<string, Quote> = {};
      CRYPTO.forEach((c, i) => {
        const t = tickers.find((x) => x.symbol === c.symbol);
        if (!t) return;
        out[c.pair] = {
          price: +t.lastPrice,
          changePct: +t.priceChangePercent,
          spark: sparks[i].map((k) => +k[4]),
        };
      });
      this.crypto.set(out);
      this.candles.set(heroKlines.map((k) => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4] })));
      this.lastCandleOpen = heroKlines[heroKlines.length - 1]?.[0] ?? 0;
      this.cryptoSource.set('binance');
      this.connect();
    } catch {
      // Binance can be blocked by region or network: fall back to CoinGecko.
      if (this.cryptoSource() !== 'binance') await this.loadGecko();
    }
  }

  private connect(): void {
    if (this.ws || document.hidden) return;
    const streams = [
      ...CRYPTO.map((c) => `${c.symbol.toLowerCase()}@miniTicker`),
      `${HERO_SYMBOL.toLowerCase()}@kline_1m`,
    ].join('/');

    const ws = new WebSocket(BINANCE_WS + streams);
    this.ws = ws;
    ws.onopen = () => (this.backoff = 1000);
    ws.onmessage = (ev) => {
      const data = (JSON.parse(ev.data as string) as { data: MiniTicker | KlineEvent }).data;
      if (data.e === '24hrMiniTicker') this.pendingTicks.set(data.s, data);
      else if (data.e === 'kline') this.pendingKline = data.k;
    };
    ws.onclose = () => {
      if (this.ws === ws) this.ws = null;
      if (!document.hidden) {
        window.clearTimeout(this.retryTimer);
        this.retryTimer = window.setTimeout(() => this.connect(), this.backoff);
        this.backoff = Math.min(30_000, this.backoff * 2);
      }
    };
    if (!this.flushTimer) this.flushTimer = window.setInterval(() => this.flush(), 1000);
  }

  /** Applies buffered socket messages to the signals, at most once per second. */
  private flush(): void {
    if (this.pendingTicks.size) {
      const ticks = [...this.pendingTicks.values()];
      this.pendingTicks.clear();
      this.crypto.update((map) => {
        const next = { ...map };
        for (const t of ticks) {
          const meta = CRYPTO.find((c) => c.symbol === t.s);
          if (!meta) continue;
          const price = +t.c;
          const open = +t.o;
          const prev = next[meta.pair];
          const spark = prev?.spark.length ? [...prev.spark.slice(0, -1), price] : [price];
          next[meta.pair] = { price, changePct: open ? ((price - open) / open) * 100 : 0, spark };
        }
        return next;
      });
    }

    const k = this.pendingKline;
    if (k) {
      this.pendingKline = null;
      const candle: Candle = { o: +k.o, h: +k.h, l: +k.l, c: +k.c };
      this.candles.update((cs) => {
        if (!cs) return cs;
        const next = cs.slice();
        if (k.t === this.lastCandleOpen) next[next.length - 1] = candle;
        else if (k.t > this.lastCandleOpen) {
          next.push(candle);
          if (next.length > 30) next.shift();
          this.lastCandleOpen = k.t;
        }
        return next;
      });
    }
  }

  private async loadGecko(): Promise<void> {
    const fetchGecko = async () => {
      if (document.hidden) return;
      try {
        const ids = CRYPTO.map((c) => c.gecko).join(',');
        const j = await getJson<Record<string, { usd: number; usd_24h_change: number }>>(
          `${COINGECKO}?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        );
        const out: Record<string, Quote> = {};
        for (const c of CRYPTO) {
          const q = j[c.gecko];
          if (q) out[c.pair] = { price: q.usd, changePct: q.usd_24h_change ?? 0, spark: [] };
        }
        this.crypto.set(out);
        this.cryptoSource.set('coingecko');
      } catch {
        /* keep whatever we had; the UI shows dashes when empty */
      }
    };
    await fetchGecko();
    if (!this.geckoTimer) this.geckoTimer = window.setInterval(fetchGecko, 60_000);
  }

  private onVisibility(): void {
    if (document.hidden) {
      this.hiddenAt = Date.now();
      window.clearTimeout(this.retryTimer);
      this.ws?.close();
      this.ws = null;
      return;
    }
    if (this.cryptoSource() === 'binance') {
      // Back after a while: refetch so the candles have no gap, then reconnect.
      if (Date.now() - this.hiddenAt > 60_000) void this.loadCrypto();
      else this.connect();
    }
  }

  /* ---------------- Forex ---------------- */

  private async loadForex(): Promise<void> {
    const from = new Date(Date.now() - 370 * 86_400_000).toISOString().slice(0, 10);
    const symbols = FOREX.map((f) => f.ccy).join(',');
    let json: { rates: Record<string, Record<string, number>> } | null = null;
    for (const base of FRANKFURTER) {
      try {
        json = await getJson(`${base}/${from}..?base=USD&symbols=${symbols}`);
        break;
      } catch {
        /* try the next mirror */
      }
    }
    if (!json) return;

    const dates = Object.keys(json.rates).sort();
    if (dates.length < 2) return;
    const history: Record<string, number[]> = {};
    const quotes: Record<string, Quote> = {};
    for (const f of FOREX) {
      const series = dates
        .map((d) => json!.rates[d]?.[f.ccy])
        .filter((v): v is number => typeof v === 'number' && v > 0)
        .map((v) => (f.invert ? 1 / v : v));
      if (series.length < 2) continue;
      const last = series[series.length - 1];
      const prev = series[series.length - 2];
      history[f.pair] = series;
      quotes[f.pair] = { price: last, changePct: ((last - prev) / prev) * 100, spark: series.slice(-30) };
    }
    this.forexHistory.set(history);
    this.forex.set(quotes);
    this.forexDate.set(dates[dates.length - 1]);
  }
}

async function getJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------- Formatting ---------------- */

export function formatPrice(pair: string, v: number): string {
  if (pair.includes('JPY')) return v.toFixed(3);
  if (pair.endsWith('USDT')) {
    const d = v >= 1000 ? 2 : v >= 10 ? 2 : 4;
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  return v.toFixed(5);
}

export function formatChange(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** Sparkline path for real values in a w×h box. */
export function sparkPath(values: number[], w = 60, h = 22): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join('');
}
