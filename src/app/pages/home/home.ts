import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Candle, seedCandles } from '../../core/chart-utils';
import { HERO_PAIR, MarketData, formatChange, formatPrice, sparkPath } from '../../core/market-data';
import { MODULES, STEPS, TELEGRAM_URL, TICKER } from '../../core/site-data';

const HERO_LIST = [
  { pair: 'BTC/USDT', glyph: '₿', coin: 'btc', kind: 'Crypto · 24/7' },
  { pair: 'ETH/USDT', glyph: 'Ξ', coin: 'eth', kind: 'Crypto · 24/7' },
  { pair: 'GBP/USD', glyph: '£', coin: '', kind: 'Forex · Major' },
  { pair: 'USD/JPY', glyph: '¥', coin: '', kind: 'Forex · Major' },
];

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  standalone: false,
})
export class Home {
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly modules = MODULES;
  protected readonly steps = STEPS.slice(0, 3);

  private readonly market = inject(MarketData);
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');

  /* ---------- Ticker: live quotes mapped onto the ticker list ---------- */
  protected readonly ticker = computed(() => {
    const quotes = this.market.quotes();
    return TICKER.map((t) => {
      const q = quotes[t.pair];
      return {
        pair: t.pair,
        kind: t.kind,
        price: q ? formatPrice(t.pair, q.price) : null,
        change: q ? formatChange(q.changePct) : '',
        up: q ? q.changePct >= 0 : true,
        d: q ? sparkPath(q.spark) : '',
      };
    });
  });

  /* ---------- Hero device: live BTC/USDT 1m candles, simulated fallback ---------- */
  private readonly simCandles = signal<Candle[]>(seedCandles(7, 30));
  protected readonly live = computed(() => this.market.candles() !== null);
  protected readonly heroPair = computed(() => (this.live() ? HERO_PAIR : 'EUR/USD'));
  private readonly shown = computed(() => this.market.candles() ?? this.simCandles());

  protected readonly candleView = computed(() => {
    const cs = this.shown();
    let min = Infinity;
    let max = -Infinity;
    for (const c of cs) {
      min = Math.min(min, c.l);
      max = Math.max(max, c.h);
    }
    const pad = (max - min) * 0.12 || 1e-6;
    min -= pad;
    max += pad;
    const W = 320;
    const H = 150;
    const step = W / cs.length;
    const bw = step * 0.56;
    const y = (v: number) => +(H - ((v - min) / (max - min)) * H).toFixed(1);
    const bars = cs.map((c, i) => ({
      x: +(i * step + step / 2).toFixed(1),
      bx: +(i * step + (step - bw) / 2).toFixed(1),
      bw: +bw.toFixed(1),
      top: y(Math.max(c.o, c.c)),
      h: Math.max(1, +Math.abs(y(c.o) - y(c.c)).toFixed(1)),
      hi: y(c.h),
      lo: y(c.l),
      up: c.c >= c.o,
    }));
    return { bars, last: y(cs[cs.length - 1].c) };
  });

  protected readonly price = computed(() => {
    const cs = this.shown();
    const c = cs[cs.length - 1].c;
    return this.live() ? formatPrice(HERO_PAIR, c) : c.toFixed(5);
  });

  /** Live: Binance 24h change. Simulated: change across the visible candles. */
  protected readonly change = computed(() => {
    if (this.live()) return this.market.crypto()[HERO_PAIR]?.changePct ?? 0;
    const cs = this.simCandles();
    return ((cs[cs.length - 1].c - cs[0].o) / cs[0].o) * 100;
  });
  protected readonly changeLabel = computed(() => {
    const v = this.change();
    return `${v >= 0 ? '▲ +' : '▼ '}${v.toFixed(2)}%${this.live() ? ' · 24h' : ''}`;
  });

  protected readonly heroList = computed(() => {
    const quotes = this.market.quotes();
    return HERO_LIST.map((h) => {
      const q = quotes[h.pair];
      return {
        ...h,
        price: q ? formatPrice(h.pair, q.price) : null,
        change: q ? formatChange(q.changePct) : '',
        up: q ? q.changePct >= 0 : true,
      };
    });
  });

  private heroVisible = true;
  private tickCount = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.market.start();

      const stage = this.stage()?.nativeElement;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const offs: Array<() => void> = [];

      // Pause the hero (CSS animations + simulated feed) while it is off screen.
      if (stage && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(([e]) => {
          this.heroVisible = e.isIntersecting;
          stage.classList.toggle('is-off', !e.isIntersecting);
        });
        io.observe(stage);
        offs.push(() => io.disconnect());
      }

      // Simulated feed only runs while live data is unavailable.
      if (!reduce) {
        const feed = window.setInterval(() => {
          if (!this.live() && this.heroVisible && !document.hidden) this.tickSim();
        }, 700);
        offs.push(() => window.clearInterval(feed));
      }

      if (stage) offs.push(tiltStage(stage, reduce));
      destroyRef.onDestroy(() => offs.forEach((f) => f()));
    });
  }

  private tickSim(): void {
    this.simCandles.update((cs) => {
      const next = cs.slice();
      const last = { ...next[next.length - 1] };
      last.c = +(last.c + (Math.random() - 0.48) * 0.00035).toFixed(5);
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
      next[next.length - 1] = last;
      if (++this.tickCount % 5 === 0) {
        next.shift();
        next.push({ o: last.c, h: last.c, l: last.c, c: last.c });
      }
      return next;
    });
  }
}

/** Eased pointer position written to the hero stage only, for the tablet tilt and coin parallax. */
function tiltStage(stage: HTMLElement, reduce: boolean): () => void {
  let tx = 0.5;
  let ty = 0.4;
  let x = tx;
  let y = ty;
  let frame = 0;
  const write = () => {
    stage.style.setProperty('--mx', x.toFixed(3));
    stage.style.setProperty('--my', y.toFixed(3));
  };
  const step = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    write();
    frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(step) : 0;
  };
  const onMove = (e: PointerEvent) => {
    if (stage.classList.contains('is-off')) return;
    tx = e.clientX / innerWidth;
    ty = e.clientY / innerHeight;
    if (reduce) {
      x = tx;
      y = ty;
      write();
    } else if (!frame) frame = requestAnimationFrame(step);
  };
  addEventListener('pointermove', onMove, { passive: true });
  return () => {
    removeEventListener('pointermove', onMove);
    cancelAnimationFrame(frame);
  };
}
