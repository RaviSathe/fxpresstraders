import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { MarketData, Quote, formatChange, formatPrice, sparkPath } from '../../core/market-data';
import { COMPARISON, CRYPTO_ASSETS, FOREX_PAIRS, GLOSSARY, Pair } from '../../core/site-data';

/** Which live pair each crypto card shows. */
const CRYPTO_LIVE_PAIR: Record<string, string> = {
  BTC: 'BTC/USDT',
  ETH: 'ETH/USDT',
  'USDT · USDC': 'USDC/USDT',
};

interface LiveCard extends Pair {
  price: string | null;
  change: string;
  up: boolean;
  d: string;
  livePair: string;
}

function toCard(p: Pair, livePair: string, q: Quote | undefined): LiveCard {
  return {
    ...p,
    livePair,
    price: q ? formatPrice(livePair, q.price) : null,
    change: q ? formatChange(q.changePct) : '',
    up: q ? q.changePct >= 0 : true,
    d: q ? sparkPath(q.spark) : '',
  };
}

@Component({
  selector: 'app-markets',
  templateUrl: './markets.html',
  standalone: false,
})
export class Markets {
  private readonly market = inject(MarketData);

  protected readonly comparison = COMPARISON;
  protected readonly glossary = GLOSSARY;
  protected readonly highlight = signal<'forex' | 'crypto'>('forex');

  protected readonly forex = computed(() => {
    const q = this.market.forex();
    return FOREX_PAIRS.map((p) => toCard(p, p.symbol, q[p.symbol]));
  });

  protected readonly crypto = computed(() => {
    const q = this.market.crypto();
    return CRYPTO_ASSETS.map((p) => toCard(p, CRYPTO_LIVE_PAIR[p.symbol], q[CRYPTO_LIVE_PAIR[p.symbol]]));
  });

  protected readonly forexDate = this.market.forexDate;
  protected readonly cryptoSource = this.market.cryptoSource;

  protected readonly eurusd = computed(() => this.market.forexHistory()['EUR/USD'] ?? null);
  protected readonly eurusdTitle = computed(() => {
    const q = this.market.forex()['EUR/USD'];
    return q ? formatPrice('EUR/USD', q.price) : 'Practice chart';
  });

  constructor() {
    afterNextRender(() => this.market.start());
  }
}
