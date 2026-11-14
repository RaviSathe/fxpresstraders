import { Component, input } from '@angular/core';

/** The header block at the top of every inner page. Extra content (buttons, chips) goes in via ng-content. */
@Component({
  selector: 'app-page-hero',
  standalone: false,
  template: `
    <section class="page-hero">
      <div class="wrap page-hero__inner">
        <p class="eyebrow" data-reveal>{{ eyebrow() }}</p>
        <h1 class="page-hero__title" data-reveal style="--d: 80ms">
          {{ title() }}
          @if (hot()) {
            <span class="text-hot">{{ hot() }}</span>
          }
        </h1>
        <p class="page-hero__lede" data-reveal style="--d: 180ms">{{ lede() }}</p>
        <div class="page-hero__extra" data-reveal style="--d: 260ms"><ng-content /></div>
      </div>
    </section>
  `,
})
export class PageHero {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly hot = input<string>('');
  readonly lede = input.required<string>();
}
