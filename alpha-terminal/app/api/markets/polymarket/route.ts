import { NextResponse } from "next/server";
import { safeJson, now } from "@/lib/helpers";
import type { MarketTick } from "@/lib/types";

export async function GET() {
  const base = process.env.POLY_GAMMA || "https://gamma-api.polymarket.com";
  const data = await safeJson<any>(`${base}/markets?limit=500&active=true`);
  if (!data) return NextResponse.json([]);
  const markets = Array.isArray(data?.markets) ? data.markets : Array.isArray(data) ? data : [];
  const out: MarketTick[] = markets.map((m:any) => {
    const yes = n(m?.yesPrice ?? m?.bestBid ?? m?.lastPrice ?? null);
    const no  = n(m?.noPrice ?? m?.bestAsk ?? (typeof yes==="number"? 1-yes : null));
    return {
      id: String(m?.id ?? m?.slug ?? rnd()),
      venue: "Polymarket",
      title: String(m?.question ?? m?.title ?? "Polymarket"),
      event: String(m?.eventTitle ?? m?.eventId ?? ""),
      yesPrice: yes, noPrice: no, lastPrice: n(m?.lastPrice ?? yes ?? null),
      liquidity: n(m?.liquidity ?? m?.scalarLiquidity ?? null),
      volume24h: n(m?.volume24h ?? m?.volume ?? null),
      updatedAt: now(),
      url: m?.url || (m?.slug ? `https://polymarket.com/event/${m.slug}` : undefined),
    };
  });
  return NextResponse.json(out);
}

function n(x:any){ 
  const v = Number(x); 
  return Number.isFinite(v) ? v : null; 
}

function rnd(){ 
  return Math.random().toString(36).slice(2); 
}
