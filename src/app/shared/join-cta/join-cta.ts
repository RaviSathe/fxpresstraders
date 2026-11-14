import { Component, input } from '@angular/core';
import { TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

/** The closing "join the community" band used at the bottom of each page. */
@Component({
  selector: 'app-join-cta',
  standalone: false,
  template: `
    <section class="section section--tight">
      <div class="wrap">
        <div class="cta" data-spot data-reveal>
          <div class="cta__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="cta__copy">
            <h2 class="h3">{{ title() }}</h2>
            <p>{{ body() }}</p>
          </div>
          <div class="cta__actions">
            <a class="btn btn--primary" data-mag [href]="telegramUrl" target="_blank" rel="noopener">
              Join on Telegram
              <svg class="ico ico--arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a class="btn btn--ghost" data-mag [href]="whatsappUrl" target="_blank" rel="noopener">Join on WhatsApp</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class JoinCta {
  readonly title = input('Ready to take your trading to the next level?');
  readonly body = input("It's free to join. Ask questions, follow the lessons and learn alongside other beginners.");
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;
}
