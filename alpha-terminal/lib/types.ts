export type MarketTick = {
  id: string;              // market id/slug
  venue: "Kalshi"|"Polymarket";
  title: string;
  event?: string;
  yesPrice?: number|null;  // [0,1] if available
  noPrice?: number|null;   // [0,1] if available
  lastPrice?: number|null; // [0,1]
  liquidity?: number|null; // rough proxy if available
  volume24h?: number|null;
  updatedAt: number;       // epoch ms
  url?: string;
};

export type NewsItem = {
  id: string;
  source: string;          // Reuters|Forbes|DraftKings|Kalshi|Polymarket|Web3
  title: string;
  link: string;
  publishedAt: number;     // epoch ms
  tags?: string[];
};

export type AlphaSignal = {
  kind: "mover"|"liquidity"|"headline";
  text: string;            // normie-friendly message
  refId?: string;          // market/news id
  score: number;           // rank for display
  ts: number;
};
