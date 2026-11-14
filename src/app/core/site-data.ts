/**
 * Site content in one place. Anything marked placeholder is waiting for real
 * details from fxpressTraders; do not replace it with invented numbers.
 */

/** Contact number, India (+91). Used for WhatsApp, Telegram and phone links. */
export const PHONE_E164 = '918788995468';
export const PHONE_DISPLAY = '+91 87889 95468';

const GREETING = "Hi fxpressTraders, I'd like to join the trading course and community.";

/** Opens a WhatsApp chat with the number directly, with a greeting typed in. */
export const WHATSAPP_URL = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(GREETING)}`;
/**
 * Opens a Telegram chat with the number directly. This only works if the
 * Telegram account allows "Find me by my number: Everybody" in its privacy
 * settings. If you create a Telegram username or channel, put its t.me link here.
 */
export const TELEGRAM_URL = `https://t.me/+${PHONE_E164}`;
export const PHONE_URL = `tel:+${PHONE_E164}`;
/** Contact email. Placeholder: replace with the real address. */
export const CONTACT_EMAIL = 'your-email@example.com';

export const MENTOR = {
  name: 'Prajwal More',
  role: 'Founder & mentor, fxpressTraders',
};

export interface NavLink {
  path: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { path: '/', label: 'Home' },
  { path: '/course', label: 'Course' },
  { path: '/markets', label: 'Markets' },
  { path: '/how-it-works', label: 'How it works' },
  { path: '/resources', label: 'Resources' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

export interface CourseModule {
  title: string;
  body: string;
  icon: string;
  lessons: string[];
  outcome: string;
}

export const MODULES: CourseModule[] = [
  {
    title: 'Market foundations',
    body: 'How forex and crypto markets work, who moves price, and when each market is open.',
    icon: 'M3 12h4l3-8 4 16 3-8h4',
    lessons: [
      'What forex and crypto actually are',
      'Who moves price: banks, funds and retail traders',
      'Brokers, exchanges and the spread',
      'When each market is open',
    ],
    outcome: 'Explain what moves a price and when each market trades.',
  },
  {
    title: 'Reading the chart',
    body: 'Candles, market structure, support and resistance. Clean charts, no indicator clutter.',
    icon: 'M6 4v16M6 8h-2v8h2M12 3v18M12 6h-2v6h2M18 6v14M18 10h-2v6h2',
    lessons: [
      'Candlesticks and timeframes',
      'Market structure: highs and lows',
      'Support and resistance',
      'Trending markets vs ranging markets',
    ],
    outcome: 'Mark up a clean chart without leaning on indicators.',
  },
  {
    title: 'Risk first',
    body: 'Position sizing, stop losses, and why staying in the game matters more than any single win.',
    icon: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zM9 12l2 2 4-4',
    lessons: [
      'Position sizing from your account balance',
      'Where to place a stop loss, and why',
      'Risk-to-reward in plain numbers',
      'Leverage and margin, and how they hurt beginners',
    ],
    outcome: 'Size every trade so that one loss never does real damage.',
  },
  {
    title: 'Sessions & pairs',
    body: 'Sydney to New York: how each session behaves and which currency pairs move when.',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    lessons: [
      'Sydney, Tokyo, London and New York sessions',
      'Session overlaps and why they matter',
      'Major, minor and exotic pairs',
      'Reading the economic calendar',
    ],
    outcome: 'Pick the right pairs for the hours you can actually trade.',
  },
  {
    title: 'Crypto markets',
    body: 'Spot and futures, volatility, wallets, and keeping your funds safe on an exchange.',
    icon: 'M9 6h5a3 3 0 0 1 0 6H9zM9 12h6a3 3 0 0 1 0 6H9zM9 6v12M11 4v2M11 18v2',
    lessons: [
      'Spot vs futures',
      'Volatility and a market that never closes',
      'Wallets, exchanges and custody',
      'Stablecoins and moving between trades',
    ],
    outcome: 'Trade crypto with the same rules, and keep your funds safe.',
  },
  {
    title: 'Psychology & journal',
    body: 'Building a routine, keeping a trade journal, and learning from every mistake.',
    icon: 'M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h3',
    lessons: [
      'Building a daily trading routine',
      'Keeping a trade journal',
      'Handling losing streaks',
      'Reviewing your week',
    ],
    outcome: 'Learn from every trade, win or lose, with a written record.',
  },
];

export const NOT_INCLUDED = [
  { title: 'No signals', body: "We don't send trades to copy. You learn to read the market yourself." },
  { title: 'No managed money', body: 'We never ask for or handle your funds. Your account stays yours.' },
  { title: 'No profit promises', body: 'Nobody can promise returns. We teach a skill, not a shortcut.' },
];

export interface Step {
  verb: string;
  body: string;
}

export const STEPS: Step[] = [
  { verb: 'Join', body: 'Join the free Telegram or WhatsApp community. Say hello and ask anything.' },
  { verb: 'Learn', body: 'Work through the modules in order, with lessons and chart breakdowns shared in the group.' },
  { verb: 'Practise', body: "Trade a demo account first. Real money comes later, if and when you're ready." },
  { verb: 'Review', body: 'Keep a journal, review your week, and bring your questions back to the group.' },
];

export const COMMUNITY_PERKS = [
  { title: 'Lessons in order', body: 'Each module is shared step by step, so you always know what comes next.' },
  { title: 'Chart breakdowns', body: 'Real charts marked up and explained, so you can see the method in action.' },
  { title: 'Ask anything', body: 'No question is too basic. Beginners are who this community is for.' },
  { title: 'Learn together', body: 'Learn alongside other people starting out, and share what works.' },
];

export interface Faq {
  q: string;
  a: string;
  placeholder?: boolean;
}

export const FAQS: Faq[] = [
  { q: 'Do I need any trading experience?', a: 'No. The course starts from zero and builds one module at a time.' },
  { q: 'Is the community free to join?', a: 'Yes. Joining the Telegram or WhatsApp community is free.' },
  {
    q: 'How much does the course cost?',
    a: 'Pricing details will be shared by fxpressTraders.',
    placeholder: true,
  },
  { q: 'Do you give trading signals?', a: 'No. We teach you to read the market and make your own decisions.' },
  {
    q: 'Do I need money to start?',
    a: 'No. You practise on a free demo account first. Real money comes later, only if you choose.',
  },
  {
    q: 'Can I lose money trading?',
    a: 'Yes. Trading forex and crypto is risky and you can lose some or all of your money. Never trade money you cannot afford to lose.',
  },
  { q: 'Can I learn on my phone?', a: 'Yes. Lessons are shared in Telegram and WhatsApp, so a phone is enough.' },
  { q: 'Is this financial advice?', a: 'No. fxpressTraders provides education only.' },
];

export interface Pair {
  symbol: string;
  name: string;
  note: string;
}

export const FOREX_PAIRS: Pair[] = [
  { symbol: 'EUR/USD', name: 'Euro / US dollar', note: 'The most traded currency pair in the world.' },
  { symbol: 'GBP/USD', name: 'British pound / US dollar', note: 'Nicknamed "Cable". Busy during London hours.' },
  { symbol: 'USD/JPY', name: 'US dollar / Japanese yen', note: 'Active in the Tokyo and New York sessions.' },
  { symbol: 'USD/CHF', name: 'US dollar / Swiss franc', note: 'The franc is often seen as a safe haven.' },
  { symbol: 'AUD/USD', name: 'Australian dollar / US dollar', note: 'Often moves with commodity prices.' },
  { symbol: 'USD/CAD', name: 'US dollar / Canadian dollar', note: 'Often moves with the price of oil.' },
];

export const CRYPTO_ASSETS: Pair[] = [
  { symbol: 'BTC', name: 'Bitcoin', note: 'The first and largest cryptocurrency.' },
  { symbol: 'ETH', name: 'Ethereum', note: 'A platform for smart contracts and tokens.' },
  { symbol: 'USDT · USDC', name: 'Stablecoins', note: 'Tokens designed to track the US dollar.' },
];

export const COMPARISON = [
  { label: 'Trading hours', forex: '24 hours, Monday to Friday', crypto: '24 hours, 7 days a week' },
  { label: 'Day-to-day swings', forex: 'Usually smaller', crypto: 'Often much larger' },
  { label: 'Where you trade', forex: 'Through a broker', crypto: 'On an exchange' },
  { label: 'Regulation', forex: 'Brokers are often regulated', crypto: 'Varies a lot by country' },
  { label: 'Leverage', forex: 'Widely offered, and risky', crypto: 'On futures, and very risky' },
];

export const GLOSSARY = [
  { term: 'Pip', def: 'The smallest standard price move in a currency pair, usually the 4th decimal place.' },
  { term: 'Lot', def: 'A standard trade size. Smaller mini and micro lots let beginners risk less.' },
  { term: 'Spread', def: 'The gap between the buy and sell price. It is a cost on every trade.' },
  { term: 'Leverage', def: 'Borrowed exposure. It makes wins and losses bigger. Beginners should keep it low.' },
  { term: 'Stop loss', def: 'An order that closes a losing trade at a price you set in advance.' },
  { term: 'Take profit', def: 'An order that closes a winning trade at a target price.' },
  { term: 'Volatility', def: 'How much and how fast price moves. More volatility means more risk.' },
  { term: 'Liquidity', def: 'How easily you can buy or sell without moving the price.' },
];

export const PRINCIPLES = [
  { title: "Teach, don't hype", body: 'The page sells learning, never returns. No lambos, no screenshots of wins.' },
  { title: 'Honest by default', body: 'Every number we show is real, or clearly marked as a placeholder or demo.' },
  { title: 'Risk first', body: 'Protecting your account comes before any trade idea, every time.' },
  { title: 'Community first', body: 'Everything starts in the group, where you can ask questions and learn together.' },
];

export const RULES = [
  'Be respectful. Everyone here is learning.',
  'No spam, links or promotions.',
  'No selling signals or "account management".',
  'Share what you learn, not what others should buy.',
];

export interface Session {
  city: string;
  /** Approximate opening hour, UTC. */
  open: number;
  /** Approximate closing hour, UTC. */
  close: number;
}

export const SESSIONS: Session[] = [
  { city: 'Sydney', open: 22, close: 7 },
  { city: 'Tokyo', open: 0, close: 9 },
  { city: 'London', open: 8, close: 17 },
  { city: 'New York', open: 13, close: 22 },
];

export const TICKER = [
  { pair: 'EUR/USD', kind: 'Forex · Major' },
  { pair: 'BTC/USDT', kind: 'Crypto · 24/7' },
  { pair: 'GBP/USD', kind: 'Forex · Major' },
  { pair: 'ETH/USDT', kind: 'Crypto · 24/7' },
  { pair: 'USD/JPY', kind: 'Forex · Major' },
  { pair: 'USD/CAD', kind: 'Forex · Major' },
  { pair: 'AUD/USD', kind: 'Forex · Major' },
  { pair: 'SOL/USDT', kind: 'Crypto · 24/7' },
];
