import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <section class="not-found">
      <p class="not-found__code" data-reveal>404</p>
      <h1 class="h2" data-reveal style="--d: 80ms">This page went <span class="text-down">short.</span></h1>
      <p class="lede" data-reveal style="--d: 160ms">We couldn't find what you were looking for.</p>
      <div class="cta-row cta-row--center" data-reveal style="--d: 240ms">
        <a class="btn btn--primary" data-mag routerLink="/">Back to home</a>
        <a class="btn btn--ghost" data-mag routerLink="/course">See the course</a>
      </div>
    </section>
  `,
})
export class NotFound {}
