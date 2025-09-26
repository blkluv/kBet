import { NextResponse } from "next/server";
import type { Quote } from "@/lib/types";

// Gamma public API: read-only markets list; we coerce to yes/no when possible.
export async function GET() {
  try {
    const r = await fetch("https://gamma-api.polymarket.com/markets?limit=500&active=true", { cache: "no-store" });
    if (!r.ok) throw new Error("poly fetch failed");
    const data = await r.json();
    const markets = Array.isArray(data?.markets) ? data.markets : Array.isArray(data) ? data : [];
    const out: Quote[] = [];
    for (const m of markets) {
      if (String(m?.status || "").toLowerCase() !== "active") continue;
      const eventId = String(m?.id || m?.slug || Math.random());
      // Prices may be nested; try typical fields: yesPrice/noPrice or bestBid/bestAsk
      const yesPrice = num(m?.yesPrice ?? m?.bestBid ?? m?.lastPrice ?? null);
      const noPrice  = num(m?.noPrice ?? m?.bestAsk ?? (typeof yesPrice === "number" ? 1 - yesPrice : null));
      if (typeof yesPrice === "number") out.push({ eventId, sport: inferSport(m), marketType: "yesno", outcome: "yes", book: "Polymarket", decimal: 1 / clamp(yesPrice), feePct: 0.02 });
      if (typeof noPrice === "number")  out.push({ eventId, sport: inferSport(m), marketType: "yesno", outcome: "no",  book: "Polymarket", decimal: 1 / clamp(noPrice),  feePct: 0.02 });
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json([]);
  }
}

function num(x: any): number | null { 
  const v = Number(x); 
  return Number.isFinite(v) ? v : null; 
}

function clamp(p: number){ 
  return Math.max(0.001, Math.min(0.999, p)); 
}

function inferSport(m: any): string {
  const t = (m?.question || m?.slug || "").toLowerCase();
  if (t.includes("nba") || t.includes("basketball")) return "basketball";
  if (t.includes("nfl") || t.includes("football")) return "american-football";
  if (t.includes("mlb") || t.includes("baseball")) return "baseball";
  return "other";
}
