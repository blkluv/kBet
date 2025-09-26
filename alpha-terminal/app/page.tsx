"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { MarketTick, NewsItem, AlphaSignal } from "@/lib/types";

function StatusIndicator({ connected, label }: { connected: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      connected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
    }`}>
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}></div>
      {label}
    </div>
  );
}

function MarketTicker({ market }: { market: MarketTick }) {
  const price = market.lastPrice || market.yesPrice;
  const priceDisplay = price ? `${(price * 100).toFixed(1)}¢` : "N/A";
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{market.title}</h4>
          {market.event && (
            <p className="text-xs text-gray-500 mt-1">{market.event}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          market.venue === "Kalshi" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
        }`}>
          {market.venue}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900">{priceDisplay}</div>
        <div className="text-right text-xs text-gray-500">
          {market.volume24h && (
            <div>Vol: ${(market.volume24h / 1000).toFixed(0)}K</div>
          )}
          {market.liquidity && (
            <div>Liq: ${(market.liquidity / 1000).toFixed(0)}K</div>
          )}
        </div>
      </div>
      
      {market.url && (
        <a 
          href={market.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
        >
          View Market →
        </a>
      )}
    </div>
  );
}

function NewsCard({ news }: { news: NewsItem }) {
  const timeAgo = Math.floor((Date.now() - news.publishedAt) / 60000); // minutes ago
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          news.source === "Kalshi" ? "bg-blue-100 text-blue-800" :
          news.source === "Polymarket" ? "bg-purple-100 text-purple-800" :
          news.source === "DraftKings" ? "bg-green-100 text-green-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {news.source}
        </span>
        <span className="text-xs text-gray-500">{timeAgo}m ago</span>
      </div>
      
      <h4 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2">{news.title}</h4>
      
      {news.tags && news.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {news.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <a 
        href={news.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        Read More →
      </a>
    </div>
  );
}

function AlphaSignalCard({ signal }: { signal: AlphaSignal }) {
  const iconMap = {
    mover: "📈",
    liquidity: "💧", 
    headline: "📰"
  };
  
  const colorMap = {
    mover: "border-green-200 bg-green-50",
    liquidity: "border-blue-200 bg-blue-50",
    headline: "border-orange-200 bg-orange-50"
  };
  
  return (
    <div className={`rounded-lg p-4 border ${colorMap[signal.kind]} shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{iconMap[signal.kind]}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 mb-1">{signal.text}</div>
          <div className="text-xs text-gray-500">
            {Math.floor((Date.now() - signal.ts) / 60000)}m ago • Score: {signal.score}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [markets, setMarkets] = useState<MarketTick[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [connected, setConnected] = useState({ kalshi: false, polymarket: false, news: false });
  const [refreshRate, setRefreshRate] = useState(30000); // 30 seconds
  const timerRef = useRef<number | null>(null);

  async function fetchData() {
    try {
      const [kalshiRes, polyRes, newsRes] = await Promise.allSettled([
        fetch("/api/markets/kalshi").then(r => r.json()),
        fetch("/api/markets/polymarket").then(r => r.json()),
        fetch("/api/news").then(r => r.json())
      ]);

      const kalshiMarkets = kalshiRes.status === "fulfilled" ? kalshiRes.value : [];
      const polyMarkets = polyRes.status === "fulfilled" ? polyRes.value : [];
      const newsData = newsRes.status === "fulfilled" ? newsRes.value : [];

      setMarkets([...kalshiMarkets, ...polyMarkets]);
      setNews(newsData);
      setConnected({
        kalshi: kalshiRes.status === "fulfilled" && kalshiMarkets.length > 0,
        polymarket: polyRes.status === "fulfilled" && polyMarkets.length > 0,
        news: newsRes.status === "fulfilled" && newsData.length > 0
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  useEffect(() => {
    fetchData();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(fetchData, refreshRate);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshRate]);

  const alphaSignals = useMemo(() => {
    const signals: AlphaSignal[] = [];
    
    // Generate signals based on market data
    markets.forEach(market => {
      if (market.volume24h && market.volume24h > 100000) {
        signals.push({
          kind: "liquidity",
          text: `High volume detected: ${market.title} (${market.venue})`,
          refId: market.id,
          score: Math.min(100, market.volume24h / 10000),
          ts: market.updatedAt
        });
      }
      
      if (market.lastPrice && (market.lastPrice > 0.8 || market.lastPrice < 0.2)) {
        signals.push({
          kind: "mover",
          text: `Extreme price: ${market.title} at ${(market.lastPrice * 100).toFixed(1)}¢`,
          refId: market.id,
          score: Math.abs(market.lastPrice - 0.5) * 200,
          ts: market.updatedAt
        });
      }
    });

    // Add news-based signals
    news.slice(0, 3).forEach(item => {
      signals.push({
        kind: "headline",
        text: `Breaking: ${item.title}`,
        refId: item.id,
        score: 50,
        ts: item.publishedAt
      });
    });

    return signals.sort((a, b) => b.score - a.score).slice(0, 6);
  }, [markets, news]);

  const topMovers = useMemo(() => {
    return markets
      .filter(m => m.lastPrice !== null)
      .sort((a, b) => Math.abs((a.lastPrice || 0.5) - 0.5) - Math.abs((b.lastPrice || 0.5) - 0.5))
      .slice(0, 8);
  }, [markets]);

  const highVolume = useMemo(() => {
    return markets
      .filter(m => m.volume24h && m.volume24h > 50000)
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 8);
  }, [markets]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">α</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Alpha Terminal</h1>
                  <p className="text-sm text-gray-500">Live Market Intelligence</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <StatusIndicator connected={connected.kalshi} label="Kalshi" />
                <StatusIndicator connected={connected.polymarket} label="Polymarket" />
                <StatusIndicator connected={connected.news} label="News" />
              </div>
              
              <select 
                value={refreshRate} 
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value={15000}>15s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alpha Signals */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🚨 Alpha Signals</h2>
              <div className="space-y-3">
                {alphaSignals.length > 0 ? (
                  alphaSignals.map((signal, i) => (
                    <AlphaSignalCard key={`${signal.refId}-${i}`} signal={signal} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <div>Scanning for signals...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Market Data */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Movers */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Top Movers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topMovers.length > 0 ? (
                  topMovers.map((market) => (
                    <MarketTicker key={market.id} market={market} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div>Loading market data...</div>
                  </div>
                )}
              </div>
            </section>

            {/* High Volume */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">💧 High Volume</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highVolume.length > 0 ? (
                  highVolume.map((market) => (
                    <MarketTicker key={market.id} market={market} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">💧</div>
                    <div>No high volume markets detected</div>
                  </div>
                )}
              </div>
            </section>

            {/* News Feed */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📰 Market News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.length > 0 ? (
                  news.map((item) => (
                    <NewsCard key={item.id} news={item} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📰</div>
                    <div>Loading news feed...</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
