import { Component } from '@angular/core';

@Component({
  selector: 'app-risk',
  standalone: false,
  template: `
    <app-page-hero
      eyebrow="Legal"
      title="Risk"
      hot="disclosure."
      lede="Please read this before you trade. It applies to everything on this site and in the fxpressTraders community."
    />
    <section class="section section--flush">
      <div class="wrap">
        <article class="doc" data-reveal>
          @for (s of sections; track s.title) {
            <section>
              <h2>{{ s.title }}</h2>
              <p>{{ s.body }}</p>
            </section>
          }
          <p class="fine">
            This is a general disclosure, not legal advice. fxpressTraders should have it reviewed for the countries it
            serves.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class Risk {
  protected readonly sections = [
    {
      title: 'Trading is high risk',
      body: 'Trading foreign exchange (forex) and cryptocurrencies carries a high level of risk and may not be suitable for everyone. You can lose some or all of the money you trade with. Only trade with money you can afford to lose.',
    },
    {
      title: 'Leverage makes losses bigger',
      body: 'Many brokers and exchanges offer leverage. Leverage increases the size of both gains and losses, and can cause you to lose money very quickly. Beginners should avoid or strictly limit it.',
    },
    {
      title: 'Crypto-specific risks',
      body: 'Cryptocurrency prices can move sharply at any hour, including weekends. Exchanges can fail, be hacked or freeze withdrawals, and regulation differs between countries and may change. Protect your accounts and understand how your funds are held.',
    },
    {
      title: 'Education only',
      body: 'fxpressTraders provides trading education. Nothing on this website, in the course or in the community is financial, investment or tax advice, or a recommendation to buy or sell anything. We do not manage money or provide trading signals.',
    },
    {
      title: 'No guarantees',
      body: 'No one can guarantee profits. Past performance, including any example trade, does not indicate future results. Prices on this website come from free third-party sources, may be delayed or inaccurate, and are shown for education only. Charts labelled "Illustration" or "Demo" use simulated data.',
    },
    {
      title: 'Your responsibility',
      body: 'You are responsible for your own trading decisions. Consider your financial situation and, if needed, speak to an independent, licensed financial adviser before trading.',
    },
  ];
}
