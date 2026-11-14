import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { MarketData } from '../../core/market-data';

interface FxPair {
  symbol: string;
  /** Fallback price when live rates aren't loaded yet. */
  fallback: number;
}

const FX_PAIRS: FxPair[] = [
  { symbol: 'EUR/USD', fallback: 1.1 },
  { symbol: 'GBP/USD', fallback: 1.3 },
  { symbol: 'AUD/USD', fallback: 0.66 },
  { symbol: 'USD/JPY', fallback: 155 },
  { symbol: 'USD/CHF', fallback: 0.85 },
  { symbol: 'USD/CAD', fallback: 1.4 },
];

const CRYPTO_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

@Component({
  selector: 'app-resources',
  templateUrl: './resources.html',
  standalone: false,
})
export class Resources {
  private readonly market = inject(MarketData);

  protected readonly fxPairs = FX_PAIRS;
  protected readonly cryptoPairs = CRYPTO_PAIRS;

  /* ---------- Forex position size ---------- */
  protected readonly fxBalance = signal(1000);
  protected readonly fxRisk = signal(1);
  protected readonly fxStop = signal(20);
  protected readonly fxPair = signal('EUR/USD');

  protected readonly fxPrice = computed(() => {
    const live = this.market.forex()[this.fxPair()]?.price;
    return live ?? FX_PAIRS.find((p) => p.symbol === this.fxPair())!.fallback;
  });
  protected readonly fxLive = computed(() => !!this.market.forex()[this.fxPair()]);

  /** Value of one pip for one standard lot (100,000 units), in USD. */
  protected readonly pipValue = computed(() => {
    const pair = this.fxPair();
    const price = this.fxPrice();
    if (pair.endsWith('/USD')) return 10; // EUR/USD, GBP/USD, AUD/USD
    if (pair === 'USD/JPY') return 1000 / price; // pip = 0.01
    return 10 / price; // USD/CHF, USD/CAD
  });

  protected readonly fx = computed(() => {
    const riskUsd = (num(this.fxBalance()) * num(this.fxRisk())) / 100;
    const stop = num(this.fxStop());
    const lots = stop > 0 ? riskUsd / (stop * this.pipValue()) : 0;
    return {
      riskUsd,
      lots,
      mini: lots * 10,
      micro: lots * 100,
      units: Math.round(lots * 100_000),
      perPip: lots * this.pipValue(),
    };
  });

  /* ---------- Crypto position size ---------- */
  protected readonly cBalance = signal(1000);
  protected readonly cRisk = signal(1);
  protected readonly cPair = signal('BTC/USDT');
  protected readonly cEntry = signal<number | null>(null);
  protected readonly cStopPct = signal(3);

  protected readonly cLivePrice = computed(() => this.market.crypto()[this.cPair()]?.price ?? null);
  /** Uses the typed entry, or the live price until the visitor types one. */
  protected readonly cEntryUsed = computed(() => this.cEntry() ?? this.cLivePrice() ?? 0);

  protected readonly crypto = computed(() => {
    const riskUsd = (num(this.cBalance()) * num(this.cRisk())) / 100;
    const entry = num(this.cEntryUsed());
    const stopDist = (entry * num(this.cStopPct())) / 100;
    const qty = stopDist > 0 ? riskUsd / stopDist : 0;
    const value = qty * entry;
    return {
      riskUsd,
      qty,
      value,
      stopPrice: entry - stopDist,
      leverage: num(this.cBalance()) > 0 ? value / num(this.cBalance()) : 0,
    };
  });

  /* ---------- Risk / reward ---------- */
  protected readonly rrEntry = signal(100);
  protected readonly rrStop = signal(98);
  protected readonly rrTarget = signal(106);

  protected readonly rr = computed(() => {
    const entry = num(this.rrEntry());
    const risk = Math.abs(entry - num(this.rrStop()));
    const reward = Math.abs(num(this.rrTarget()) - entry);
    const ratio = risk > 0 ? reward / risk : 0;
    const direction =
      num(this.rrTarget()) > entry && num(this.rrStop()) < entry
        ? 'Long (buy)'
        : num(this.rrTarget()) < entry && num(this.rrStop()) > entry
          ? 'Short (sell)'
          : 'Check your levels';
    return {
      risk,
      reward,
      ratio,
      breakeven: ratio > 0 ? 100 / (1 + ratio) : 0,
      direction,
      valid: direction !== 'Check your levels',
      riskPct: ratio > 0 ? (1 / (1 + ratio)) * 100 : 50,
    };
  });

  protected readonly links = [
    {
      title: 'TradingView',
      body: 'Free charts for forex and crypto. Practise marking structure and levels.',
      url: 'https://www.tradingview.com/',
      tag: 'Charts',
    },
    {
      title: 'Forex Factory calendar',
      body: 'Economic news calendar. Check it before every forex session.',
      url: 'https://www.forexfactory.com/calendar',
      tag: 'Calendar',
    },
    {
      title: 'Babypips School',
      body: 'A free, structured forex course for complete beginners.',
      url: 'https://www.babypips.com/learn/forex',
      tag: 'Reading',
    },
    {
      title: 'Frankfurter (ECB rates)',
      body: 'Official daily reference exchange rates, used on this site.',
      url: 'https://frankfurter.dev/',
      tag: 'Data',
    },
  ];

  constructor() {
    afterNextRender(() => this.market.start());
  }

  protected set(sig: { set: (v: number) => void }, e: Event): void {
    sig.set(num((e.target as HTMLInputElement).value));
  }

  protected setEntry(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.cEntry.set(v === '' ? null : num(v));
  }

  protected setCPair(e: Event): void {
    this.cPair.set((e.target as HTMLSelectElement).value);
    this.cEntry.set(null); // follow the new pair's live price
  }

  protected fmt(v: number, dp = 2): string {
    return v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  /** Builds a trade-journal CSV in the browser and downloads it. */
  protected downloadJournal(): void {
    const header = [
      'Date',
      'Market',
      'Pair',
      'Direction',
      'Entry',
      'Stop loss',
      'Take profit',
      'Position size',
      'Risk ($)',
      'Result ($)',
      'R multiple',
      'Setup / reason',
      'Followed plan? (Y/N)',
      'Emotions',
      'Lesson',
    ];
    const example = [
      new Date().toISOString().slice(0, 10),
      'Forex',
      'EUR/USD',
      'Long',
      '1.10500',
      '1.10300',
      '1.10900',
      '0.05 lots',
      '10',
      '',
      '',
      'Retest of support on 1H',
      'Y',
      'Calm',
      'Example row: delete me',
    ];
    const csv = [header, example].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fxpressTraders-trade-journal.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
