import { NextResponse } from "next/server";
import { safeJson, now } from "@/lib/helpers";
import type { NewsItem } from "@/lib/types";

export async function GET() {
  // Demo news data - in production, integrate with RSS feeds
  const demoNews: NewsItem[] = [
    {
      id: "news-1",
      source: "Kalshi",
      title: "Kalshi Launches New Election Markets for 2024",
      link: "https://kalshi.com/blog/election-markets-2024",
      publishedAt: now() - 3600000, // 1 hour ago
      tags: ["elections", "politics", "markets"]
    },
    {
      id: "news-2", 
      source: "Polymarket",
      title: "Polymarket Sees Record Volume in AI Regulation Markets",
      link: "https://polymarket.com/news/ai-regulation-volume",
      publishedAt: now() - 7200000, // 2 hours ago
      tags: ["AI", "regulation", "volume"]
    },
    {
      id: "news-3",
      source: "DraftKings",
      title: "DraftKings Expands Sports Betting to New Markets",
      link: "https://draftkings.com/news/market-expansion",
      publishedAt: now() - 10800000, // 3 hours ago
      tags: ["sports", "expansion", "betting"]
    },
    {
      id: "news-4",
      source: "Reuters",
      title: "Federal Reserve Signals Potential Rate Cuts Ahead",
      link: "https://reuters.com/business/fed-rate-cuts",
      publishedAt: now() - 14400000, // 4 hours ago
      tags: ["fed", "rates", "economics"]
    },
    {
      id: "news-5",
      source: "Forbes",
      title: "Prediction Markets Gaining Mainstream Adoption",
      link: "https://forbes.com/prediction-markets-adoption",
      publishedAt: now() - 18000000, // 5 hours ago
      tags: ["prediction-markets", "adoption", "mainstream"]
    }
  ];

  return NextResponse.json(demoNews);
}
