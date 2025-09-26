export type Quote = {
  eventId: string;
  sport: string;
  league?: string;
  startsAt?: string;
  home?: string;
  away?: string;
  marketType: "h2h" | "spreads" | "totals" | "yesno";
  outcome: string;           // home|away|draw|yes|no|over|under|+3.5|-3.5
  book: string;              // sportsbook or exchange name
  decimal: number;           // normalized decimal odds
  point?: number | null;     // spread/total line
  feePct?: number;           // assumed venue fee
};
