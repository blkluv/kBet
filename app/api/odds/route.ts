import { NextResponse } from "next/server";
import { z } from "zod";
import { americanToDecimal } from "@/lib/utils";
import type { Quote } from "@/lib/types";

const OddsZ = z.array(z.object({
  id: z.string(),
  sport_key: z.string(),
  commence_time: z.string().nullable().optional(),
  home_team: z.string().optional(),
  away_team: z.string().optional(),
  bookmakers: z.array(z.object({
    key: z.string(),
    markets: z.array(z.object({
      key: z.enum(["h2h","spreads","totals"]),
      outcomes: z.array(z.object({
        name: z.string(),
        price: z.number().nullable().optional(),  // American odds
        point: z.number().nullable().optional()
      }))
    }))
  }))
}));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportKey = searchParams.get("sport") || "basketball_nba"; // change in client if needed
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?regions=us&oddsFormat=american&markets=h2h,spreads,totals&apiKey=${process.env.THEODDS_API_KEY}`;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("odds fetch failed");
    const raw = await r.json();
    const data = OddsZ.parse(raw);
    const out: Quote[] = [];
    for (const e of data) {
      for (const b of e.bookmakers) {
        for (const m of b.markets) {
          for (const o of m.outcomes) {
            const dec = americanToDecimal(o.price as number);
            if (!dec) continue;
            out.push({
              eventId: e.id,
              sport: e.sport_key,
              league: undefined,
              startsAt: e.commence_time || undefined,
              home: (e as any).home_team,
              away: (e as any).away_team,
              marketType: m.key,
              outcome: outcomeNameToKey(o.name),
              book: b.key,
              decimal: dec,
              point: o.point ?? null,
              feePct: 0, // assume 0 for retail books; adjust here if needed
            });
          }
        }
      }
    }
    return NextResponse.json(out);
  } catch {
    return NextResponse.json([]);
  }
}

function outcomeNameToKey(name: string) {
  const n = name.toLowerCase();
  if (n.includes("home")) return "home";
  if (n.includes("away")) return "away";
  if (n.includes("draw") || n.includes("tie")) return "draw";
  if (n.includes("over")) return "over";
  if (n.includes("under")) return "under";
  return name; // fallback (some books use team names directly)
}
