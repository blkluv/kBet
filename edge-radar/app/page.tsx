"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Quote } from "@/lib/types";
import { groupBy, toFixedPct, impliedProb, findTwoWayArb } from "@/lib/utils";

function SourcePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${ok ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
      {label} {ok ? "✓" : "•"}
    </span>
  );
}

function EdgeCard({ title, subtitle, profitPct, steps }: { title: string; subtitle: string; profitPct: number; steps: string[]; }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm border border-gray-200 bg-white flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600">{toFixedPct(profitPct)}</div>
          <div className="text-xs text-gray-500">Potential Profit</div>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
        <div className="font-medium mb-1">How to do it (example $100):</div>
        <ol className="list-decimal ml-5 space-y-1">
          {steps.map((s, i) => (<li key={i}>{s}</li>))}
        </ol>
      </div>
      <div className="text-xs text-gray-500">
        We do not place bets. This is information only. Consider fees and limits.
      </div>
    </div>
  );
}

// --- Demo data if APIs not ready ---
const DEMO_QUOTES: Quote[] = [
  { eventId: "nba-123", sport: "basketball", league: "NBA", startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), home: "Lakers", away: "Heat", marketType: "h2h", outcome: "home", book: "BookA", decimal: 2.2 },
  { eventId: "nba-123", sport: "basketball", league: "NBA", startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), home: "Lakers", away: "Heat", marketType: "h2h", outcome: "away", book: "BookB", decimal: 2.2 },
  { eventId: "nfl-999", sport: "american-football", league: "NFL", startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), home: "Jets", away: "Bills", marketType: "h2h", outcome: "home", book: "BookC", decimal: 2.05 },
  { eventId: "nfl-999", sport: "american-football", league: "NFL", startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), home: "Jets", away: "Bills", marketType: "h2h", outcome: "away", book: "BookD", decimal: 1.9 },
];

const DEMO_YESNO: Quote[] = [
  { eventId: "nba-123-yes", sport: "basketball", marketType: "yesno", outcome: "yes", book: "Kalshi", decimal: 1 / 0.48 },
  { eventId: "nba-123-yes", sport: "basketball", marketType: "yesno", outcome: "no",  book: "Polymarket", decimal: 1 / 0.55 },
];

export default function Page() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [yesno, setYesno] = useState<Quote[]>([]);
  const [connected, setConnected] = useState({ odds: false, kalshi: false, poly: false });
  const [pollMs, setPollMs] = useState(15000);
  const timerRef = useRef<number | null>(null);

  async function pull() {
    try {
      const [o, k, p] = await Promise.allSettled([
        fetch("/api/odds").then((r) => r.json()),
        fetch("/api/kalshi").then((r) => r.json()),
        fetch("/api/polymarket").then((r) => r.json()),
      ]);
      let q: Quote[] = [];
      let y: Quote[] = [];
      const status = { odds: false, kalshi: false, poly: false };
      if (o.status === "fulfilled" && Array.isArray(o.value)) { q = o.value; status.odds = true; }
      if (k.status === "fulfilled" && Array.isArray(k.value)) { y = y.concat(k.value); status.kalshi = true; }
      if (p.status === "fulfilled" && Array.isArray(p.value)) { y = y.concat(p.value); status.poly = true; }
      if (q.length === 0) q = DEMO_QUOTES;
      if (y.length === 0) y = DEMO_YESNO;
      setQuotes(q); setYesno(y); setConnected(status);
    } catch {
      setQuotes(DEMO_QUOTES); setYesno(DEMO_YESNO); setConnected({ odds: false, kalshi: false, poly: false });
    }
  }

  useEffect(() => {
    pull();
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(pull, pollMs);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [pollMs]);

  const bestEdges = useMemo(() => {
    const events = groupBy(quotes.filter((q: Quote) => q.marketType === "h2h"), (q: Quote) => q.eventId);
    const out: { eventId: string; best: any }[] = [];
    for (const [eventId, qs] of Object.entries(events)) {
      const home = (qs as Quote[]).filter((q: Quote) => q.outcome === "home");
      const away = (qs as Quote[]).filter((q: Quote) => q.outcome === "away");
      const best = findTwoWayArb(home, away, 0, 0);
      if (best) out.push({ eventId, best });
    }
    out.sort((a, b) => b.best.profitPct - a.best.profitPct);
    return out.slice(0, 5);
  }, [quotes]);

  const crossIdeas = useMemo(() => {
    const grouped = groupBy(quotes.filter((q: Quote) => q.marketType === "h2h"), (q: Quote) => q.sport);
    const sportAvgProb: Record<string, number> = {};
    for (const [sport, qs] of Object.entries(grouped)) {
      const probs = (qs as Quote[]).map((q: Quote) => impliedProb(q.decimal));
      sportAvgProb[sport] = probs.reduce((a, b) => a + b, 0) / probs.length;
    }
    const ideas: { sport: string; pSport: number; pPred: number; diff: number }[] = [];
    const bySport = groupBy(yesno, (q: Quote) => q.sport || "");
    for (const [sport, qs] of Object.entries(bySport)) {
      const probs = (qs as Quote[]).map((q: Quote) => impliedProb(q.decimal));
      const pPred = probs.reduce((a, b) => a + b, 0) / probs.length;
      const pSport = sportAvgProb[sport] ?? NaN;
      if (isFinite(pSport) && isFinite(pPred)) ideas.push({ sport, pSport, pPred, diff: Math.abs(pSport - pPred) });
    }
    ideas.sort((a, b) => b.diff - a.diff);
    return ideas.slice(0, 3);
  }, [quotes, yesno]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="p-5 sticky top-0 bg-slate-50/80 backdrop-blur border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-bold text-xl">Edge Radar (Prototype)</div>
          <div className="text-sm text-slate-500">Live odds + simple arbitrage finder</div>
        </div>
        <div className="flex items-center gap-2">
          <SourcePill ok={connected.odds} label="Sportsbooks" />
          <SourcePill ok={connected.kalshi} label="Kalshi" />
          <SourcePill ok={connected.poly} label="Polymarket" />
          <select className="ml-3 border rounded-xl px-3 py-1 text-sm" value={pollMs} onChange={(e) => setPollMs(Number(e.target.value))}>
            <option value={15000}>Refresh: 15s</option>
            <option value={30000}>Refresh: 30s</option>
            <option value={60000}>Refresh: 60s</option>
          </select>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-5 space-y-6">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Today's Best Risk-Free Edges</h2>
          {bestEdges.length === 0 ? (
            <div className="text-sm text-slate-600">No surebets detected right now. We'll keep watching.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {bestEdges.map(({ eventId, best }: { eventId: string; best: any }) => {
                const title = `${best.h.home ?? "Home"} vs ${best.h.away ?? "Away"}`;
                const subtitle = `${best.h.book} vs ${best.a.book}`;
                const steps = [
                  `Bet $${best.s1.toFixed(2)} on ${best.h.home ?? "Home"} at ${best.h.book} (odds ${best.h.decimal.toFixed(2)})`,
                  `Bet $${best.s2.toFixed(2)} on ${best.a.away ?? "Away"} at ${best.a.book} (odds ${best.a.decimal.toFixed(2)})`,
                  `You lock in about ${toFixedPct(best.profitPct)} profit no matter who wins.`,
                ];
                return (<EdgeCard key={eventId} title={title} subtitle={subtitle} profitPct={best.profitPct} steps={steps} />);
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Prediction Markets vs Sportsbooks</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {crossIdeas.map((x: { sport: string; pSport: number; pPred: number; diff: number }, i: number) => (
              <div key={i} className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500">{x.sport}</div>
                <div className="mt-1 text-sm">Sportsbooks avg prob: <b>{(x.pSport * 100).toFixed(1)}%</b></div>
                <div className="text-sm">Prediction markets avg prob: <b>{(x.pPred * 100).toFixed(1)}%</b></div>
                <div className="mt-2 text-emerald-700 text-lg font-semibold">Gap: {toFixedPct(x.diff)}</div>
                <div className="mt-2 text-xs text-slate-500">Idea: consider backing the cheaper side; hedge on the other venue. We don't trade—this is info only.</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Explain It Like I'm 5</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl p-4 bg-white border border-slate-200">
              <div className="font-medium mb-1">What's a risk-free bet?</div>
              Place bets on opposite sides at different places where prices are off. Your payouts cover your costs no matter who wins.
            </div>
            <div className="rounded-2xl p-4 bg-white border border-slate-200">
              <div className="font-medium mb-1">What do I click?</div>
              Look for green cards above. We show exact dollar amounts for $100. Adjust to your bankroll.
            </div>
            <div className="rounded-2xl p-4 bg-white border border-slate-200">
              <div className="font-medium mb-1">What about fees?</div>
              Some places charge fees. Our math includes fees when we know them. Always double-check before you bet.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
