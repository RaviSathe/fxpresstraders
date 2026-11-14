import { Directive, ElementRef, afterNextRender, inject, DestroyRef } from '@angular/core';

let sharedObserver: IntersectionObserver | null = null;

function observer(): IntersectionObserver {
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          sharedObserver?.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  return sharedObserver;
}

/** Any element with data-reveal fades and lifts in when it scrolls into view. */
@Directive({
  selector: '[data-reveal]',
  standalone: false,
})
export class RevealDirective {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) {
        el.classList.add('is-in');
        return;
      }
      observer().observe(el);
    });
    inject(DestroyRef).onDestroy(() => sharedObserver?.unobserve(el));
  }
}

/** Any element with data-mag leans gently toward the pointer. */
@Directive({
  selector: '[data-mag]',
  standalone: false,
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
  },
})
export class MagneticDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected move(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || document.documentElement.classList.contains('fx-reduce')) return;
    const r = this.el.getBoundingClientRect();
    this.el.style.setProperty('--mag-x', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
    this.el.style.setProperty('--mag-y', `${((e.clientY - (r.top + r.height / 2)) * 0.32).toFixed(1)}px`);
  }

  protected reset(): void {
    this.el.style.setProperty('--mag-x', '0px');
    this.el.style.setProperty('--mag-y', '0px');
  }
}
