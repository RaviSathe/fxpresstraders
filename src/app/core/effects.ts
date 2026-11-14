/** Site-wide browser effects, started once by the app shell (browser only). */

/**
 * Returns a getter for an element that re-queries if the cached node was replaced
 * (e.g. by hydration or a hot reload), so effects never write to detached nodes.
 */
function liveEl(selector: string): () => HTMLElement | null {
  let el: HTMLElement | null = null;
  return () => (el?.isConnected ? el : (el = document.querySelector<HTMLElement>(selector)));
}

/** Eased cursor glow plus the nav's scrolled state. Writes only to the glow element, never :root. */
export function cursorAndNav(root: HTMLElement, reduceMotion: boolean): () => void {
  const glow = liveEl('.cursor-glow');
  let tx = innerWidth / 2;
  let ty = innerHeight / 3;
  let x = tx;
  let y = ty;
  let frame = 0;
  const write = () => {
    const g = glow();
    if (g) g.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  };
  const step = () => {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    write();
    frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(step) : 0;
  };
  const onPointer = (e: PointerEvent) => {
    tx = e.clientX;
    ty = e.clientY;
    if (reduceMotion) {
      x = tx;
      y = ty;
      write();
    } else if (!frame) frame = requestAnimationFrame(step);
  };

  let scrolled: boolean | null = null;
  const onScroll = () => {
    const s = scrollY > 24;
    if (s !== scrolled) {
      scrolled = s;
      root.classList.toggle('fx-scrolled', s);
    }
  };

  write();
  onScroll();
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  return () => {
    removeEventListener('pointermove', onPointer);
    removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
  };
}

const INTERACTIVE = 'a, button, summary, [role="button"], label, [data-mag]';

/**
 * Replaces the mouse pointer with a green candlestick bar.
 * Mouse/pen only: touch devices keep their normal behaviour.
 * The bar sits exactly on the pointer (no easing) so clicking stays precise;
 * its centre is the hotspot, which is also where the click lines start.
 */
export function greenBarCursor(root: HTMLElement): () => void {
  const getBar = liveEl('.cursor-bar');
  if (!getBar() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};

  root.classList.add('fx-cursor');
  let pressTimer = 0;

  const onMove = (e: PointerEvent) => {
    const bar = getBar();
    if (!bar || e.pointerType === 'touch') return;
    bar.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    bar.classList.add('is-visible');
  };
  const onOver = (e: PointerEvent) => {
    const hit = (e.target as Element | null)?.closest?.(INTERACTIVE);
    getBar()?.classList.toggle('is-hover', !!hit);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    getBar()?.classList.add('is-down');
    window.clearTimeout(pressTimer);
  };
  const onUp = () => {
    pressTimer = window.setTimeout(() => getBar()?.classList.remove('is-down'), 140);
  };
  const onLeave = () => getBar()?.classList.remove('is-visible');

  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerover', onOver, { passive: true });
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', onUp, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    root.classList.remove('fx-cursor');
    removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerover', onOver);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    window.clearTimeout(pressTimer);
  };
}

/** Writes the pointer position inside [data-spot] cards so CSS can draw a glow that follows it. */
export function spotlight(): () => void {
  const onMove = (e: PointerEvent) => {
    const card = (e.target as Element | null)?.closest?.<HTMLElement>('[data-spot]');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--sx', `${e.clientX - r.left}px`);
    card.style.setProperty('--sy-local', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  return () => document.removeEventListener('pointermove', onMove);
}
