import { Component, DestroyRef, ElementRef, PLATFORM_ID, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { NAV_LINKS, PHONE_DISPLAY, PHONE_URL, TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

/** Simple line icons for the sidebar links. */
const ICONS: Record<string, string> = {
  '/': 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  '/course': 'M4 6l8-3 8 3-8 3zM7 8v5c0 1.5 2.2 3 5 3s5-1.5 5-3V8M20 6v6',
  '/markets': 'M4 19h16M6 16l4-5 3 3 5-7',
  '/how-it-works': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01',
  '/resources': 'M4 5h6v14H4zM14 5h6v14h-6zM7 9h.01M17 9h.01',
  '/about': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  '/contact': 'M4 6h16v12H4zM4 7l8 6 8-6',
};

@Component({
  selector: 'app-site-nav',
  templateUrl: './site-nav.html',
  standalone: false,
  host: {
    '(document:keydown.escape)': 'close()',
    '(document:keydown)': 'trapFocus($event)',
  },
})
export class SiteNav {
  protected readonly links = NAV_LINKS.map((l) => ({ ...l, icon: ICONS[l.path] ?? ICONS['/'] }));
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;
  protected readonly phone = PHONE_DISPLAY;
  protected readonly phoneUrl = PHONE_URL;
  protected readonly open = signal(false);

  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private readonly toggleBtn = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');

  constructor() {
    const sub = inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.close(false);
    });
    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      this.setPageInert(false);
    });
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  private show(): void {
    this.open.set(true);
    this.setPageInert(true);
    // Move focus into the sidebar once it is visible.
    if (this.browser) requestAnimationFrame(() => this.closeBtn()?.nativeElement.focus());
  }

  protected close(returnFocus = true): void {
    if (!this.open()) return;
    this.open.set(false);
    this.setPageInert(false);
    if (returnFocus && this.browser) this.toggleBtn()?.nativeElement.focus();
  }

  /** While the sidebar is open, the page behind it can't be scrolled, tapped or tabbed into. */
  private setPageInert(on: boolean): void {
    if (!this.browser) return;
    document.documentElement.classList.toggle('fx-menu', on);
    for (const el of document.querySelectorAll<HTMLElement>('main, app-site-footer, .nav__brand-link, .nav__links')) {
      el.inert = on;
    }
  }

  /** Keeps Tab / Shift+Tab inside the sidebar while it is open. */
  protected trapFocus(e: KeyboardEvent): void {
    if (!this.open() || e.key !== 'Tab') return;
    const root = this.drawer()?.nativeElement;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
