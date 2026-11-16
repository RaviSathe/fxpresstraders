import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { chartPaths, prng } from '../../core/chart-utils';

const W = 560;
const H = 200;
/** Every real series is resampled to this many points, so CSS can morph between timeframes. */
const POINTS = 48;

/** Trading days in each real timeframe (daily data). */
const REAL_TF: Record<string, number> = { '1W': 5, '1M': 22, '3M': 66, '6M': 130, '1Y': 9999 };

/** Demo "live" speeds: how often a new point arrives and how jumpy it is. */
const DEMO_TF: Record<string, { tick: number; vol: number }> = {
  '1s': { tick: 450, vol: 0.0011 },
  '5s': { tick: 800, vol: 0.0016 },
  '15s': { tick: 1100, vol: 0.0022 },
  '1m': { tick: 1500, vol: 0.003 },
};

/** Visible points in the scrolling demo chart. */
const LIVE_N = 40;
const START_BALANCE = 10_000;

/**
 * Glass dashboard card with an area chart.
 *  - With `data` (real daily closes): a static chart that morphs between timeframes.
 *  - Without it: a simulated "live" practice balance that scrolls like a real
 *    feed. Drawn per frame straight to the SVG (no Angular change detection),
 *    and only while the card is on screen and the tab is visible.
 */
@Component({
  selector: 'app-area-chart',
  standalone: false,
  template: `
    <div class="dash" data-spot data-reveal #card>
      <div class="dash__head">
        <div>
          <p class="dash__label">{{ label() }}</p>
          @if (isReal()) {
            <p class="dash__value">{{ title() }}</p>
            @if (stats(); as s) {
              <p class="dash__stats mono">
                <span [class.is-up]="s.change >= 0" [class.is-down]="s.change < 0">{{ s.change >= 0 ? '+' : '' }}{{ s.change.toFixed(2) }}%</span>
                <span>H {{ s.hi }}</span><span>L {{ s.lo }}</span>
              </p>
            }
          } @else {
            <p class="dash__value dash__value--live mono">{{ balanceLabel() }}</p>
            <p class="dash__stats mono">
              <span [class.is-up]="balanceChange() >= 0" [class.is-down]="balanceChange() < 0">
                {{ balanceChange() >= 0 ? '▲ +' : '▼ ' }}{{ balanceChange().toFixed(2) }}%
              </span>
              <span>{{ title() }} · simulated</span>
            </p>
          }
        </div>
        @if (isReal()) {
          <span class="tag tag--live"><i class="live-dot"></i>{{ source() }}</span>
        } @else {
          <span class="tag tag--demo"><i class="live-dot live-dot--orange"></i>Demo · moving</span>
        }
      </div>

      @if (isReal()) {
        <svg class="area" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ff7a42" stop-opacity=".55" />
              <stop offset="1" stop-color="#ff7a42" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="area__fill" [attr.fill]="'url(#' + gradId + ')'" [attr.d]="chart().area" [style.d]="'path(&quot;' + chart().area + '&quot;)'" />
          <path class="area__line" [attr.d]="chart().line" [style.d]="'path(&quot;' + chart().line + '&quot;)'" />
        </svg>
      } @else {
        <div class="area-wrap">
        <svg class="area area--live" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ff7a42" stop-opacity=".55" />
              <stop offset="1" stop-color="#ff7a42" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line class="area__grid" x1="0" [attr.x2]="w" y1="50" y2="50" />
          <line class="area__grid" x1="0" [attr.x2]="w" y1="100" y2="100" />
          <line class="area__grid" x1="0" [attr.x2]="w" y1="150" y2="150" />
          <line #liveLevel class="area__level" x1="0" [attr.x2]="w" [attr.y1]="initial.dotY" [attr.y2]="initial.dotY" />
          <path #liveFill class="area__fill" [attr.fill]="'url(#' + gradId + ')'" [attr.d]="initial.area" />
          <path #liveLine class="area__line" [attr.d]="initial.line" />
        </svg>
        <span #liveDot class="area__dot" [style.top.%]="(initial.dotY / h) * 100"></span>
        </div>
      }

      <div class="dash__tf" role="group" aria-label="Chart timeframe">
        @for (tf of timeframes(); track tf) {
          <button type="button" [class.is-on]="timeframe() === tf" [attr.aria-pressed]="timeframe() === tf" (click)="setTimeframe(tf)">
            {{ tf }}
          </button>
        }
      </div>
    </div>
  `,
})
export class AreaChart {
  readonly label = input('Practice account');
  readonly title = input('Demo balance');
  readonly seed = input(50);
  /** Real daily closes, oldest first. */
  readonly data = input<number[] | null>(null);
  readonly source = input('Live data');
  /** Decimal places for the high/low readout. */
  readonly decimals = input(5);

  protected readonly w = W;
  protected readonly h = H;
  protected readonly timeframe = signal('1M');

  protected readonly isReal = computed(() => (this.data()?.length ?? 0) > 5);
  protected readonly timeframes = computed(() => Object.keys(this.isReal() ? REAL_TF : DEMO_TF));

  protected get gradId(): string {
    return `fx-area-${this.seed()}`;
  }

  /* ---------------- Real data ---------------- */

  private readonly window = computed(() => {
    const d = this.data();
    if (!d || !this.isReal()) return null;
    return d.slice(-(REAL_TF[this.timeframe()] ?? d.length));
  });

  protected readonly stats = computed(() => {
    const win = this.window();
    if (!win || win.length < 2) return null;
    const dp = this.decimals();
    return {
      change: ((win[win.length - 1] - win[0]) / win[0]) * 100,
      hi: Math.max(...win).toFixed(dp),
      lo: Math.min(...win).toFixed(dp),
    };
  });

  protected readonly chart = computed(() => {
    const win = this.window();
    return win ? chartPaths(normalise(resample(win, POINTS)), W, H) : { line: '', area: '' };
  });

  /* ---------------- Live demo ---------------- */

  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly liveLine = viewChild<ElementRef<SVGPathElement>>('liveLine');
  private readonly liveFill = viewChild<ElementRef<SVGPathElement>>('liveFill');
  private readonly liveLevel = viewChild<ElementRef<SVGLineElement>>('liveLevel');
  private readonly liveDot = viewChild<ElementRef<HTMLElement>>('liveDot');

  /** Buffer of LIVE_N + 1 values; the last one scrolls in from the right edge. */
  private buffer: number[] = [];
  private rand = prng(1);
  private momentum = 0;
  private lastTick = 0;
  private lo = 0;
  private hi = 0;

  protected readonly balance = signal(START_BALANCE);
  protected readonly balanceLabel = computed(
    () => `$${this.balance().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  );
  protected readonly balanceChange = computed(() => ((this.balance() - START_BALANCE) / START_BALANCE) * 100);

  /** First frame, rendered on the server too, so the chart is never empty. */
  protected initial = { line: '', area: '', dotY: H / 2 };

  constructor() {
    // Keep the selected timeframe valid when switching between demo and real data.
    effect(() => {
      const tfs = this.timeframes();
      if (!tfs.includes(this.timeframe())) this.timeframe.set(this.isReal() ? '1M' : '5s');
    });

    this.reseed();
    const first = this.shape(0);
    this.initial = { line: first.line, area: first.area, dotY: first.dotY };

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let visible = false;
      let frame = 0;

      const loop = (now: number) => {
        frame = 0;
        if (!visible || document.hidden || this.isReal()) return;
        this.frame(now);
        frame = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (!frame && visible && !document.hidden && !this.isReal()) {
          this.lastTick = performance.now();
          frame = requestAnimationFrame(loop);
        }
      };

      if (reduce) return; // keep the static first frame
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        kick();
      });
      const host = this.card()?.nativeElement;
      if (host) io.observe(host);
      document.addEventListener('visibilitychange', kick);
      destroyRef.onDestroy(() => {
        io.disconnect();
        document.removeEventListener('visibilitychange', kick);
        cancelAnimationFrame(frame);
      });
    });
  }

  protected setTimeframe(tf: string): void {
    this.timeframe.set(tf);
    if (!this.isReal()) {
      this.momentum = 0;
      this.lastTick = performance.now();
    }
  }

  private reseed(): void {
    this.rand = prng(this.seed() * 7 + 3);
    const vol = DEMO_TF['5s'].vol;
    let v = START_BALANCE * 0.985;
    this.buffer = [];
    for (let i = 0; i <= LIVE_N; i++) {
      v = this.nextValue(v, vol);
      this.buffer.push(v);
    }
    this.balance.set(+this.buffer[LIVE_N - 1].toFixed(2));
    const [lo, hi] = this.range();
    this.lo = lo;
    this.hi = hi;
  }

  /** A random walk with momentum and a gentle pull back toward the start, so it trends and reverses like price. */
  private nextValue(prev: number, vol: number): number {
    const shock = (this.rand() + this.rand() + this.rand() - 1.5) * 2; // roughly normal
    this.momentum = this.momentum * 0.82 + shock * 0.35;
    const pull = ((START_BALANCE - prev) / START_BALANCE) * 0.04;
    return prev * (1 + (shock * 0.6 + this.momentum) * vol + pull + 0.00008);
  }

  private range(): [number, number] {
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of this.buffer) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    const pad = (hi - lo) * 0.18 || 1;
    return [lo - pad, hi + pad];
  }

  private frame(now: number): void {
    const cfg = DEMO_TF[this.timeframe()] ?? DEMO_TF['5s'];
    let p = (now - this.lastTick) / cfg.tick;

    // A new point arrives: drop the oldest, append the next.
    if (p >= 1) {
      const steps = Math.min(4, Math.floor(p));
      for (let s = 0; s < steps; s++) {
        this.buffer.shift();
        this.buffer.push(this.nextValue(this.buffer[this.buffer.length - 1], cfg.vol));
      }
      this.lastTick = now - (p - steps) * cfg.tick;
      p -= steps;
      this.balance.set(+this.buffer[LIVE_N - 1].toFixed(2));
    }

    // Ease the vertical scale toward the visible range so the chart never jumps.
    const [lo, hi] = this.range();
    this.lo += (lo - this.lo) * 0.06;
    this.hi += (hi - this.hi) * 0.06;

    const s = this.shape(p);
    this.liveLine()?.nativeElement.setAttribute('d', s.line);
    this.liveFill()?.nativeElement.setAttribute('d', s.area);
    const level = this.liveLevel()?.nativeElement;
    if (level) {
      level.setAttribute('y1', s.dotY.toFixed(1));
      level.setAttribute('y2', s.dotY.toFixed(1));
    }
    const dot = this.liveDot()?.nativeElement;
    if (dot) {
      dot.style.top = `${((s.dotY / H) * 100).toFixed(2)}%`;
      dot.classList.toggle('is-down', s.falling);
    }
  }

  /** Builds the line/area for a scroll offset p (0..1 of one step). */
  private shape(p: number): { line: string; area: string; dotY: number; falling: boolean } {
    const step = W / (LIVE_N - 1);
    const span = this.hi - this.lo || 1;
    const y = (v: number) => 14 + (1 - (v - this.lo) / span) * (H - 28);
    const pts: Array<[number, number]> = this.buffer.map((v, i) => [(i - p) * step, y(v)]);

    const f = (n: number) => n.toFixed(1);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(
        p2[1] - (p3[1] - p1[1]) / 6,
      )} ${f(p2[0])},${f(p2[1])}`;
    }
    const last = pts[pts.length - 1];

    // Live dot sits on the right edge, between the last visible point and the incoming one.
    const a = this.buffer[LIVE_N - 1];
    const b = this.buffer[LIVE_N];
    const dotY = y(a + (b - a) * p);
    return { line: d, area: `${d} L${f(last[0])},${H} L${f(pts[0][0])},${H} Z`, dotY, falling: b < a };
  }
}

function resample(values: number[], n: number): number[] {
  if (values.length === n) return values;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (values.length - 1);
    const a = Math.floor(t);
    const b = Math.min(values.length - 1, a + 1);
    out.push(values[a] + (values[b] - values[a]) * (t - a));
  }
  return out;
}

function normalise(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v) => (v - min) / span);
}
