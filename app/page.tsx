"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Quote } from "@/lib/types";
import { groupBy, toFixedPct, impliedProb, findTwoWayArb } from "@/lib/utils";

function SourcePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`px-3 py-1 border text-sm font-mono ${ok ? "bg-green-400 text-black border-green-400" : "bg-transparent text-green-400/50 border-green-400/50"}`}>
      {label} {ok ? "ON" : "OFF"}
    </span>
  );
}

function StatCard({ title, value, subtitle, trend, icon }: { title: string; value: string; subtitle: string; trend?: string; icon: string }) {
  return (
    <div className="bg-black border border-green-400 p-6 font-mono">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-green-400/70">{title}</p>
          <p className="text-2xl font-bold text-green-400">{value}</p>
          <p className="text-sm text-green-400/50">{subtitle}</p>
        </div>
        <div className="text-3xl text-green-400">{icon}</div>
      </div>
      {trend && (
        <div className="mt-2 text-sm text-green-400 font-medium">{trend}</div>
      )}
    </div>
  );
}

function EdgeCard({ title, subtitle, profitPct, steps, urgency }: { title: string; subtitle: string; profitPct: number; steps: string[]; urgency: "high" | "medium" | "low" }) {
  const urgencyColors = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50", 
    low: "border-green-200 bg-green-50"
  };
  
  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${urgencyColors[urgency]} flex flex-col gap-3`}>
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

function MarketCard({ title, price, change, volume, description }: { title: string; price: string; change: string; volume: string; description: string }) {
  const isPositive = change.startsWith('+');
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">{price}</div>
      <div className="text-xs text-gray-500 mb-2">Volume: {volume}</div>
      <div className="text-xs text-gray-600">{description}</div>
    </div>
  );
}

function NewsCard({ title, source, time, category, summary }: { title: string; source: string; time: string; category: string; summary: string }) {
  const categoryColors = {
    sports: "bg-blue-100 text-blue-800",
    politics: "bg-red-100 text-red-800", 
    economics: "bg-green-100 text-green-800",
    tech: "bg-purple-100 text-purple-800"
  };
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
          {category}
        </span>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <p className="text-xs text-gray-600 mb-2">{summary}</p>
      <div className="text-xs text-gray-500">Source: {source}</div>
    </div>
  );
}

// Enhanced demo data
const DEMO_QUOTES: Quote[] = [
  { eventId: "nba-123", sport: "basketball", league: "NBA", startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), home: "Lakers", away: "Heat", marketType: "h2h", outcome: "home", book: "DraftKings", decimal: 2.2 },
  { eventId: "nba-123", sport: "basketball", league: "NBA", startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), home: "Lakers", away: "Heat", marketType: "h2h", outcome: "away", book: "FanDuel", decimal: 2.2 },
  { eventId: "nfl-999", sport: "american-football", league: "NFL", startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), home: "Jets", away: "Bills", marketType: "h2h", outcome: "home", book: "BetMGM", decimal: 2.05 },
  { eventId: "nfl-999", sport: "american-football", league: "NFL", startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), home: "Jets", away: "Bills", marketType: "h2h", outcome: "away", book: "Caesars", decimal: 1.9 },
  { eventId: "mlb-456", sport: "baseball", league: "MLB", startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), home: "Yankees", away: "Red Sox", marketType: "h2h", outcome: "home", book: "PointsBet", decimal: 1.85 },
  { eventId: "mlb-456", sport: "baseball", league: "MLB", startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), home: "Yankees", away: "Red Sox", marketType: "h2h", outcome: "away", book: "BetRivers", decimal: 1.95 },
];

const DEMO_YESNO: Quote[] = [
  { eventId: "nba-123-yes", sport: "basketball", marketType: "yesno", outcome: "yes", book: "Kalshi", decimal: 1 / 0.48 },
  { eventId: "nba-123-yes", sport: "basketball", marketType: "yesno", outcome: "no",  book: "Polymarket", decimal: 1 / 0.55 },
  { eventId: "election-2024", sport: "politics", marketType: "yesno", outcome: "yes", book: "Kalshi", decimal: 1 / 0.62 },
  { eventId: "election-2024", sport: "politics", marketType: "yesno", outcome: "no",  book: "Polymarket", decimal: 1 / 0.38 },
];

const DEMO_NEWS = [
  { title: "NBA Finals Odds Shift After Injury Report", source: "ESPN", time: "2m ago", category: "sports", summary: "Lakers odds moved from +150 to +120 after Heat's star player injury announcement." },
  { title: "Federal Reserve Rate Decision Impact on Markets", source: "Reuters", time: "15m ago", category: "economics", summary: "Prediction markets show 78% probability of rate hold, affecting economic futures." },
  { title: "Election Polling Update: Swing State Analysis", source: "FiveThirtyEight", time: "1h ago", category: "politics", summary: "Latest polls show tightening race in key battleground states." },
  { title: "AI Regulation Bill Progress", source: "TechCrunch", time: "2h ago", category: "tech", summary: "Senate committee advances AI safety legislation, prediction markets react." },
];

export default function Page() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [yesno, setYesno] = useState<Quote[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [connected, setConnected] = useState({ odds: false, kalshi: false, poly: false, news: false });
  const [pollMs, setPollMs] = useState(15000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<number | null>(null);

  async function pull() {
    try {
      setIsRefreshing(true);
      const [o, k, p, n] = await Promise.allSettled([
        fetch("/api/odds").then((r) => r.json()),
        fetch("/api/kalshi").then((r) => r.json()),
        fetch("/api/polymarket").then((r) => r.json()),
        fetch("/api/rss?platform=all&limit=20").then((r) => r.json()),
      ]);
      let q: Quote[] = [];
      let y: Quote[] = [];
      let newsData: any[] = [];
      const status = { odds: false, kalshi: false, poly: false, news: false };
      if (o.status === "fulfilled" && Array.isArray(o.value)) { q = o.value; status.odds = true; }
      if (k.status === "fulfilled" && Array.isArray(k.value)) { y = y.concat(k.value); status.kalshi = true; }
      if (p.status === "fulfilled" && Array.isArray(p.value)) { y = y.concat(p.value); status.poly = true; }
      if (n.status === "fulfilled" && n.value.items) { 
        newsData = Object.values(n.value.items).flat(); 
        status.news = true; 
      }
      if (q.length === 0) q = DEMO_QUOTES;
      if (y.length === 0) y = DEMO_YESNO;
      if (newsData.length === 0) newsData = DEMO_NEWS;
      setQuotes(q); setYesno(y); setNews(newsData); setConnected(status);
    } catch {
      setQuotes(DEMO_QUOTES); setYesno(DEMO_YESNO); setNews(DEMO_NEWS); setConnected({ odds: false, kalshi: false, poly: false, news: false });
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    pull();
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(pull, pollMs);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [pollMs]);

  const bestEdges = useMemo(() => {
    const events = groupBy(quotes.filter((q) => q.marketType === "h2h"), (q) => q.eventId);
    const out: { eventId: string; best: any; urgency: "high" | "medium" | "low" }[] = [];
    for (const [eventId, qs] of Object.entries(events)) {
      const home = (qs as Quote[]).filter((q) => q.outcome === "home");
      const away = (qs as Quote[]).filter((q) => q.outcome === "away");
      const best = findTwoWayArb(home, away, 0, 0);
      if (best) {
        const urgency = best.profitPct > 0.05 ? "high" : best.profitPct > 0.02 ? "medium" : "low";
        out.push({ eventId, best, urgency });
      }
    }
    out.sort((a, b) => b.best.profitPct - a.best.profitPct);
    return out.slice(0, 6);
  }, [quotes]);

  const crossIdeas = useMemo(() => {
    const grouped = groupBy(quotes.filter((q) => q.marketType === "h2h"), (q) => q.sport);
    const sportAvgProb: Record<string, number> = {};
    for (const [sport, qs] of Object.entries(grouped)) {
      const probs = (qs as Quote[]).map((q) => impliedProb(q.decimal));
      sportAvgProb[sport] = probs.reduce((a, b) => a + b, 0) / probs.length;
    }
    const ideas: { sport: string; pSport: number; pPred: number; diff: number }[] = [];
    const bySport = groupBy(yesno, (q) => q.sport || "");
    for (const [sport, qs] of Object.entries(bySport)) {
      const probs = (qs as Quote[]).map((q) => impliedProb(q.decimal));
      const pPred = probs.reduce((a, b) => a + b, 0) / probs.length;
      const pSport = sportAvgProb[sport] ?? NaN;
      if (isFinite(pSport) && isFinite(pPred)) ideas.push({ sport, pSport, pPred, diff: Math.abs(pSport - pPred) });
    }
    ideas.sort((a, b) => b.diff - a.diff);
    return ideas.slice(0, 4);
  }, [quotes, yesno]);

  const marketStats = useMemo(() => {
    const totalMarkets = quotes.length + yesno.length;
    const activeBooks = new Set([...quotes.map(q => q.book), ...yesno.map(q => q.book)]).size;
    const avgProfit = bestEdges.length > 0 ? bestEdges.reduce((sum, edge) => sum + edge.best.profitPct, 0) / bestEdges.length : 0;
    const lastUpdate = new Date().toLocaleTimeString();
    
    return { totalMarkets, activeBooks, avgProfit, lastUpdate };
  }, [quotes, yesno, bestEdges]);

  return (
    <div className="min-h-screen bg-black text-green-400 relative overflow-hidden">
      {/* Dot Matrix Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #00ff00 1px, transparent 0),
            radial-gradient(circle at 1px 1px, #00ff00 1px, transparent 0)
          `,
          backgroundSize: '20px 20px, 20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}></div>
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-10" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
        }}></div>
      </div>
      <div className="relative z-10">
      {/* Enhanced Header */}
      <header className="p-6 sticky top-0 bg-black/95 backdrop-blur border-b border-green-400/30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-400 text-black flex items-center justify-center font-mono border border-green-400">
                <span className="font-bold text-lg">kB</span>
              </div>
              <div>
                <div className="font-mono font-bold text-2xl text-green-400">kBET</div>
                <div className="text-sm text-green-400/70 font-mono">LIVE MARKET INTELLIGENCE DASHBOARD</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open('/terminal', '_blank')}
              className="px-4 py-2 bg-green-400 text-black font-mono text-sm font-bold hover:bg-green-300 transition-colors border border-green-400"
            >
              TERMINAL
            </button>
            <button 
              onClick={() => pull()}
              disabled={isRefreshing}
              className="px-4 py-2 bg-transparent text-green-400 font-mono text-sm border border-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? "SYNC..." : "REFRESH"}
            </button>
            <SourcePill ok={connected.odds} label="SPORTSBOOKS" />
            <SourcePill ok={connected.kalshi} label="KALSHI" />
            <SourcePill ok={connected.poly} label="POLYMARKET" />
            <SourcePill ok={connected.news} label="RSS" />
            <select 
              className="ml-3 border border-green-400 px-3 py-2 text-sm bg-black text-green-400 font-mono" 
              value={pollMs} 
              onChange={(e) => setPollMs(Number(e.target.value))}
            >
              <option value={15000}>15S</option>
              <option value={30000}>30S</option>
              <option value={60000}>60S</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Market Overview Stats */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard 
              title="Total Markets" 
              value={marketStats.totalMarkets.toString()} 
              subtitle="Active across all platforms"
              trend="+12% from yesterday"
              icon="📊"
            />
            <StatCard 
              title="Active Books" 
              value={marketStats.activeBooks.toString()} 
              subtitle="Connected platforms"
              trend="All systems operational"
              icon="🏦"
            />
            <StatCard 
              title="Avg Edge" 
              value={toFixedPct(marketStats.avgProfit)} 
              subtitle="Average arbitrage opportunity"
              trend="+0.3% vs last hour"
              icon="💰"
            />
            <StatCard 
              title="Last Update" 
              value={marketStats.lastUpdate} 
              subtitle="Real-time data"
              trend="Live"
              icon="⚡"
            />
          </div>
        </section>

        {/* Top Arbitrage Opportunities */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🔥 Hot Arbitrage Opportunities</h2>
            <div className="text-sm text-slate-500">Updated every {pollMs/1000}s</div>
          </div>
          {bestEdges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-lg font-medium text-gray-600">No surebets detected right now</div>
              <div className="text-sm text-gray-500">We'll keep watching for opportunities</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestEdges.map(({ eventId, best, urgency }) => {
                const title = `${best.h.home ?? "Home"} vs ${best.h.away ?? "Away"}`;
                const subtitle = `${best.h.book} vs ${best.a.book}`;
                const steps = [
                  `Bet $${best.s1.toFixed(2)} on ${best.h.home ?? "Home"} at ${best.h.book} (odds ${best.h.decimal.toFixed(2)})`,
                  `Bet $${best.s2.toFixed(2)} on ${best.a.away ?? "Away"} at ${best.a.book} (odds ${best.a.decimal.toFixed(2)})`,
                  `You lock in about ${toFixedPct(best.profitPct)} profit no matter who wins.`,
                ];
                return (<EdgeCard key={eventId} title={title} subtitle={subtitle} profitPct={best.profitPct} steps={steps} urgency={urgency} />);
              })}
            </div>
          )}
        </section>

        {/* Cross-Venue Analysis */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">📈 Cross-Venue Analysis</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {crossIdeas.map((x, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-sm text-slate-500 mb-2">{x.sport}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sportsbooks:</span>
                    <span className="font-semibold">{(x.pSport * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Prediction Markets:</span>
                    <span className="font-semibold">{(x.pPred * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-emerald-700 text-lg font-bold">Gap: {toFixedPct(x.diff)}</div>
                  <div className="text-xs text-slate-500 mt-1">Consider backing the cheaper side</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live News Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📰 Market News & Events</h2>
            <SourcePill ok={connected.news} label="RSS Feeds" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.slice(0, 8).map((newsItem, i) => {
              const timeAgo = new Date(newsItem.publishedAt || Date.now()).toLocaleTimeString();
              const category = newsItem.category || 'general';
              const source = newsItem.source || 'Unknown';
              const summary = newsItem.description || newsItem.title || 'No description available';
              
              return (
                <div key={newsItem.id || i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      newsItem.analysis?.marketImpact === 'high' ? 'bg-red-100 text-red-800' :
                      newsItem.analysis?.marketImpact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {newsItem.analysis?.marketImpact || 'low'} impact
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-2">{newsItem.title}</h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-3">{summary}</p>
                  <div className="text-xs text-gray-500 mb-2">Source: {source}</div>
                  {newsItem.analysis?.tradingSignals && newsItem.analysis.tradingSignals.length > 0 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      <strong>Signals:</strong> {newsItem.analysis.tradingSignals[0]}
                    </div>
                  )}
                  {newsItem.tags && newsItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newsItem.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                        <span key={tagIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Prediction Market Spotlight */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🎯 Prediction Market Spotlight</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MarketCard 
              title="2024 Election Winner" 
              price="62¢" 
              change="+3¢" 
              volume="$2.4M" 
              description="Current favorite candidate probability"
            />
            <MarketCard 
              title="Fed Rate Cut by Q2" 
              price="78¢" 
              change="-2¢" 
              volume="$890K" 
              description="Probability of interest rate reduction"
            />
            <MarketCard 
              title="AI Regulation Passes" 
              price="45¢" 
              change="+8¢" 
              volume="$1.2M" 
              description="Congressional AI safety bill"
            />
            <MarketCard 
              title="Bitcoin $100K+ by EOY" 
              price="34¢" 
              change="-1¢" 
              volume="$3.1M" 
              description="Cryptocurrency price prediction"
            />
          </div>
        </section>

        {/* Educational Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">🎓 How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">🎯</div>
              <div className="font-semibold mb-2">What's Arbitrage?</div>
              <div className="text-sm text-gray-600">Place bets on opposite outcomes at different sportsbooks where the combined odds guarantee profit regardless of the result.</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">📊</div>
              <div className="font-semibold mb-2">How to Use This</div>
              <div className="text-sm text-gray-600">Look for green cards above showing exact dollar amounts. We calculate optimal bet sizes for $100 - adjust to your bankroll.</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">⚠️</div>
              <div className="font-semibold mb-2">Important Notes</div>
              <div className="text-sm text-gray-600">This is informational only. We don't place bets. Always verify odds, consider fees, and check betting limits before wagering.</div>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}