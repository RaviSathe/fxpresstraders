/** Seeded chart data, so server and browser render identical markup. */

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random walk normalised to 0..1. */
export function walk(seed: number, n: number, drift: number): number[] {
  const r = prng(seed);
  const out: number[] = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += r() - 0.5 + (drift - 0.5) * 0.4;
    out.push(v);
  }
  const min = Math.min(...out);
  const max = Math.max(...out);
  return out.map((x) => (max === min ? 0.5 : (x - min) / (max - min)));
}

/** A small sparkline path in a 60x22 box. */
export function sparkline(seed: number): { d: string; up: boolean } {
  const pts = walk(seed, 14, 0.5);
  const d = pts.map((v, j) => `${j ? 'L' : 'M'}${(j * (60 / 13)).toFixed(1)} ${(20 - v * 18).toFixed(1)}`).join('');
  return { d, up: pts[pts.length - 1] >= pts[0] };
}

export function seedCandles(seed: number, n: number): Candle[] {
  const r = prng(seed);
  const out: Candle[] = [];
  let price = 1.0842;
  for (let i = 0; i < n; i++) {
    const o = price;
    const c = o + (r() - 0.46) * 0.0014;
    const h = Math.max(o, c) + r() * 0.0005;
    const l = Math.min(o, c) - r() * 0.0005;
    out.push({ o: +o.toFixed(5), h: +h.toFixed(5), l: +l.toFixed(5), c: +c.toFixed(5) });
    price = c;
  }
  return out;
}

/**
 * Smooth Catmull-Rom curve through normalised points. Every series has the same
 * command list, so CSS can morph between them.
 */
export function chartPaths(values: number[], w: number, h: number): { line: string; area: string } {
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, 24 + (1 - v) * (h - 48)]);
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
  return { line: d, area: `${d} L${w},${h} L0,${h} Z` };
}
