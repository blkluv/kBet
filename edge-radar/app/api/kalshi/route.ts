import { NextResponse } from "next/server";
import type { Quote } from "@/lib/types";

// Public discovery endpoint; detailed order books may require auth. For prototype we map last prices if present.
export async function GET() {
  try {
    const r = await fetch("https://api.kalshi.com/v1/markets", { cache: "no-store" });
    if (!r.ok) throw new Error("kalshi fetch failed");
    const data = await r.json();
    // Expect shape: { markets: [{ id, ticker, status, yes_ask, yes_bid, ... }] } (shape can vary; we guard safely)
    const markets = Array.isArray((data as any).markets) ? (data as any).markets : Array.isArray(data) ? data : [];
    const out: Quote[] = [];
    for (const m of markets) {
      if (!m?.status || String(m.status).toLowerCase() !== "open") continue;
      const eventId = String(m.id ?? m.ticker ?? Math.random());
      const yesPrice = coercePrice(m.last_price ?? m.yes_price ?? m.yes_bid ?? m.best_yes ?? null);
      const noPrice  = coercePrice(m.no_price ?? m.no_bid ?? (typeof yesPrice==="number" ? (1 - yesPrice) : null));
      if (typeof yesPrice === "number") {
        out.push({ eventId, sport: guessSport(m), marketType: "yesno", outcome: "yes", book: "Kalshi", decimal: 1 / clampProb(yesPrice), feePct: 0.02 });
      }
      if (typeof noPrice === "number") {
        out.push({ eventId, sport: guessSport(m), marketType: "yesno", outcome: "no", book: "Kalshi", decimal: 1 / clampProb(noPrice), feePct: 0.02 });
      }
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json([]);
  }
}

function coercePrice(x: any): number | null { 
  const v = Number(x); 
  return Number.isFinite(v) ? Math.max(0.001, Math.min(0.999, v)) : null; 
}

function clampProb(p: number){ 
  return Math.max(0.001, Math.min(0.999, p)); 
}

function guessSport(m: any): string {
  const t = (m?.title || m?.ticker || "").toLowerCase();
  if (t.includes("nba") || t.includes("basketball")) return "basketball";
  if (t.includes("nfl") || t.includes("football")) return "american-football";
  if (t.includes("mlb") || t.includes("baseball")) return "baseball";
  return "other";
}
