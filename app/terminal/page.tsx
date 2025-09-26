"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Types
interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: number;
  category: string;
  analysis: {
    marketImpact: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: 'high' | 'medium' | 'low';
    tradingSignals: string[];
    confidence: number;
  };
  tags: string[];
}

interface PredictionMarket {
  market: string;
  yesPrice: number;
  volume: number;
  change: number;
}

// Components
function MarketTicker({ data, title }: { data: MarketData[]; title: string }) {
  return (
    <div className="bg-black text-green-400 p-2 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className="flex space-x-6 overflow-x-auto">
        {data.map((item, i) => (
          <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
            <span className="text-white font-mono text-sm">{item.symbol}</span>
            <span className="text-green-400 font-mono text-sm">{item.price.toFixed(2)}</span>
            <span className={`font-mono text-xs ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsPanel({ news, title }: { news: NewsItem[]; title: string }) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black text-white p-4 border border-gray-700 h-96 overflow-y-auto">
      <div className="text-green-400 font-bold mb-3 border-b border-gray-700 pb-2">{title}</div>
      <div className="space-y-3">
        {news.slice(0, 10).map((item) => (
          <div key={item.id} className="border-l-2 border-gray-600 pl-3">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 border ${getImpactColor(item.analysis.marketImpact)}`}>
                  {item.analysis.marketImpact.toUpperCase()}
                </span>
                <span className={`text-xs ${getSentimentColor(item.analysis.sentiment)}`}>
                  {item.analysis.sentiment.toUpperCase()}
                </span>
                {item.analysis.urgency === 'high' && (
                  <span className="text-xs text-red-400 font-bold">URGENT</span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(item.publishedAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-white mb-1">{item.title}</div>
            <div className="text-xs text-gray-400 mb-2">Source: {item.source}</div>
            {item.analysis.tradingSignals.length > 0 && (
              <div className="text-xs text-blue-400">
                <strong>Signals:</strong> {item.analysis.tradingSignals.join(', ')}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PredictionPanel({ markets, title }: { markets: PredictionMarket[]; title: string }) {
  return (
    <div className="bg-black text-white p-4 border border-gray-700 h-96 overflow-y-auto">
      <div className="text-green-400 font-bold mb-3 border-b border-gray-700 pb-2">{title}</div>
      <div className="space-y-3">
        {markets.map((market, i) => (
          <div key={i} className="border border-gray-600 p-3">
            <div className="text-sm text-white mb-2">{market.market}</div>
            <div className="flex justify-between items-center">
              <div className="text-green-400 font-mono text-lg">
                {(market.yesPrice * 100).toFixed(1)}¢
              </div>
              <div className="text-right">
                <div className={`text-xs ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {market.change >= 0 ? '+' : ''}{(market.change * 100).toFixed(1)}¢
                </div>
                <div className="text-xs text-gray-400">
                  Vol: ${(market.volume / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBar({ connected, lastUpdate }: { connected: Record<string, boolean>; lastUpdate: string }) {
  return (
    <div className="bg-gray-900 text-white p-2 border-t border-gray-700">
      <div className="flex justify-between items-center text-xs">
        <div className="flex space-x-4">
          {Object.entries(connected).map(([source, status]) => (
            <span key={source} className={`${status ? 'text-green-400' : 'text-red-400'}`}>
              {source.toUpperCase()}: {status ? 'CONNECTED' : 'OFFLINE'}
            </span>
          ))}
        </div>
        <div className="text-gray-400">
          Last Update: {lastUpdate}
        </div>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [bloombergData, setBloombergData] = useState<any>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [connected, setConnected] = useState({
    bloomberg: false,
    rss: false,
    kalshi: false,
    polymarket: false
  });
  const [lastUpdate, setLastUpdate] = useState('');
  const timerRef = useRef<number | null>(null);

  async function fetchAllData() {
    try {
      const [bloombergRes, rssRes] = await Promise.allSettled([
        fetch("/api/bloomberg").then(r => r.json()),
        fetch("/api/rss?platform=all&limit=50").then(r => r.json())
      ]);

      if (bloombergRes.status === "fulfilled") {
        setBloombergData(bloombergRes.value);
        setConnected(prev => ({ ...prev, bloomberg: true }));
      }

      if (rssRes.status === "fulfilled") {
        // Flatten news from all platforms
        const allNews = Object.values(rssRes.value.items || {}).flat() as NewsItem[];
        setNewsData(allNews);
        setConnected(prev => ({ ...prev, rss: true }));
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  useEffect(() => {
    fetchAllData();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(fetchAllData, 30000); // 30 seconds
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const highImpactNews = useMemo(() => 
    newsData.filter(item => item.analysis.marketImpact === 'high')
      .sort((a, b) => b.publishedAt - a.publishedAt),
    [newsData]
  );

  const urgentNews = useMemo(() => 
    newsData.filter(item => item.analysis.urgency === 'high')
      .sort((a, b) => b.publishedAt - a.publishedAt),
    [newsData]
  );

  const recentNews = useMemo(() => 
    newsData.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, 20),
    [newsData]
  );

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dot Matrix Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #00ff00 1px, transparent 0),
            radial-gradient(circle at 1px 1px, #00ff00 1px, transparent 0)
          `,
          backgroundSize: '20px 20px, 20px 20px',
          backgroundPosition: '0 0, 10px 10px'
        }}></div>
        {/* Scanlines */}
        <div className="absolute inset-0 opacity-5" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)'
        }}></div>
      </div>
      <div className="relative z-10">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-green-400 font-mono">kBET TERMINAL</div>
            <div className="text-sm text-gray-400 font-mono">BLOOMBERG-STYLE MARKET INTELLIGENCE</div>
          </div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Market Tickers */}
      {bloombergData?.marketOverview && (
        <>
          <MarketTicker 
            data={bloombergData.marketOverview.indices} 
            title="MAJOR INDICES" 
          />
          <MarketTicker 
            data={bloombergData.marketOverview.commodities} 
            title="COMMODITIES" 
          />
          <MarketTicker 
            data={bloombergData.marketOverview.currencies} 
            title="CURRENCIES" 
          />
          <MarketTicker 
            data={bloombergData.marketOverview.bonds} 
            title="BONDS" 
          />
        </>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* High Impact News */}
        <NewsPanel 
          news={highImpactNews} 
          title="🔥 HIGH IMPACT NEWS" 
        />

        {/* Urgent News */}
        <NewsPanel 
          news={urgentNews} 
          title="⚡ URGENT ALERTS" 
        />

        {/* Prediction Markets */}
        {bloombergData?.predictionMarkets && (
          <div className="space-y-4">
            <PredictionPanel 
              markets={bloombergData.predictionMarkets.politics} 
              title="🗳️ POLITICS" 
            />
            <PredictionPanel 
              markets={bloombergData.predictionMarkets.economics} 
              title="💰 ECONOMICS" 
            />
            <PredictionPanel 
              markets={bloombergData.predictionMarkets.technology} 
              title="🤖 TECHNOLOGY" 
            />
          </div>
        )}
      </div>

      {/* Recent News Feed */}
      <div className="p-4">
        <NewsPanel 
          news={recentNews} 
          title="📰 ALL NEWS FEEDS" 
        />
      </div>

      {/* Status Bar */}
      <StatusBar connected={connected} lastUpdate={lastUpdate} />
      </div>
    </div>
  );
}
