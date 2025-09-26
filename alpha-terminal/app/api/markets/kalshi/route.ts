import { NextResponse } from "next/server";
import { safeJson, now } from "@/lib/helpers";
import type { MarketTick } from "@/lib/types";

export async function GET() {
  // Public market data per Kalshi docs: series/events/markets/orderbooks are accessible without auth.
  const base = process.env.KALSHI_BASE || "https://api.kalshi.com/v1";
  // Simplest: fetch markets list; structure differs, so guard.
  const data = await safeJson<any>(`${base}/markets`);
  if (!data) return NextResponse.json([]);
  const markets = Array.isArray(data?.markets) ? data.markets : Array.isArray(data) ? data : [];
  const out: MarketTick[] = markets.slice(0, 300).map((m: any) => {
    const yes = num(m?.last_price ?? m?.yes_price ?? m?.best_yes ?? null);
    const no  = num(m?.no_price ?? m?.best_no ?? (typeof yes==="number"? 1-yes : null));
    return {
      id: String(m?.id ?? m?.ticker ?? cryptoRandom()),
      venue: "Kalshi",
      title: String(m?.title ?? m?.name ?? m?.ticker ?? "Kalshi Market"),
      event: String(m?.series_ticker ?? m?.event_ticker ?? ""),
      yesPrice: yes, noPrice: no, lastPrice: num(m?.last_price ?? yes ?? null),
      liquidity: num(m?.order_book_liquidity ?? m?.liquidity ?? null),
      volume24h: num(m?.volume_24h ?? null),
      updatedAt: now(),
      url: m?.url || (m?.ticker ? `https://kalshi.com/markets/${m.ticker}` : undefined),
    };
  });
  return NextResponse.json(out);
}

function num(x:any){ 
  const v = Number(x); 
  return Number.isFinite(v) ? v : null; 
}

function cryptoRandom(){ 
  return Math.random().toString(36).slice(2); 
}
