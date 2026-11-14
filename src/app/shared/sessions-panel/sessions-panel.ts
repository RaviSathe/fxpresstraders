import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { SESSIONS, Session } from '../../core/site-data';

interface SessionState extends Session {
  isOpen: boolean;
}

/** Live forex session board, based on the visitor's clock in UTC. */
@Component({
  selector: 'app-sessions-panel',
  standalone: false,
  template: `
    <div class="sessions" data-spot>
      <div class="sessions__head">
        <span>Forex sessions</span>
        <span class="mono">@if (ready()) { {{ clock() }} UTC }</span>
      </div>
      <ul>
        @for (s of sessions(); track s.city) {
          <li [class.is-open]="s.isOpen">
            <span class="lamp" aria-hidden="true"></span>
            <span class="sessions__city">{{ s.city }}</span>
            <span class="mono sessions__hours">{{ pad(s.open) }}–{{ pad(s.close) }}</span>
            <span class="sessions__state">{{ s.isOpen ? 'Open' : 'Closed' }}</span>
          </li>
        }
      </ul>
      <p class="fine">
        @if (weekend()) { Forex is closed for the weekend. Crypto never closes. }
        @else { Hours are approximate and shift with daylight saving. }
      </p>
    </div>
  `,
})
export class SessionsPanel {
  protected readonly sessions = signal<SessionState[]>(SESSIONS.map((s) => ({ ...s, isOpen: false })));
  protected readonly weekend = signal(false);
  protected readonly clock = signal('--:--');
  protected readonly ready = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.tick();
      const id = window.setInterval(() => this.tick(), 20_000);
      destroyRef.onDestroy(() => window.clearInterval(id));
    });
  }

  protected pad(n: number): string {
    return `${String(n).padStart(2, '0')}:00`;
  }

  private tick(): void {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    // Forex closes Friday 22:00 UTC and reopens Sunday 22:00 UTC.
    const weekend = day === 6 || (day === 0 && hour < 22) || (day === 5 && hour >= 22);
    this.weekend.set(weekend);
    this.sessions.set(
      SESSIONS.map((s) => ({
        ...s,
        isOpen:
          !weekend && (s.open < s.close ? hour >= s.open && hour < s.close : hour >= s.open || hour < s.close),
      })),
    );
    this.clock.set(`${String(hour).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`);
    this.ready.set(true);
  }
}
