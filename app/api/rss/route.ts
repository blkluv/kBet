import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

// RSS feed configuration by platform/category
const RSS_FEEDS = {
  bloomberg: [
    "https://feeds.bloomberg.com/markets/news.rss",
    "https://feeds.bloomberg.com/politics/news.rss",
    "https://feeds.bloomberg.com/technology/news.rss"
  ],
  reuters: [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://feeds.reuters.com/Reuters/PoliticsNews",
    "https://feeds.reuters.com/reuters/technologyNews",
    "https://feeds.reuters.com/reuters/worldNews",
    "https://feeds.reuters.com/reuters/companyNews",
    "https://feeds.reuters.com/reuters/marketsNews",
    "https://feeds.reuters.com/reuters/breakingviews"
  ],
  ap: [
    "https://feeds.apnews.com/rss/apf-topnews",
    "https://feeds.apnews.com/rss/apf-business",
    "https://feeds.apnews.com/rss/apf-politics",
    "https://feeds.apnews.com/rss/apf-technology"
  ],
  bbc: [
    "http://feeds.bbci.co.uk/news/business/rss.xml",
    "http://feeds.bbci.co.uk/news/politics/rss.xml",
    "http://feeds.bbci.co.uk/news/technology/rss.xml",
    "http://feeds.bbci.co.uk/news/world/rss.xml"
  ],
  cnn: [
    "http://rss.cnn.com/rss/money_latest.rss",
    "http://rss.cnn.com/rss/edition_politics.rss",
    "http://rss.cnn.com/rss/edition_technology.rss",
    "http://rss.cnn.com/rss/edition_world.rss"
  ],
  financial: [
    "https://feeds.finance.yahoo.com/rss/2.0/headline",
    "https://feeds.marketwatch.com/marketwatch/topstories/",
    "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
    "https://www.ft.com/rss/home",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,^IXIC&region=US&lang=en-US",
    "https://feeds.marketwatch.com/marketwatch/marketpulse/",
    "https://feeds.marketwatch.com/marketwatch/realtimeheadlines/"
  ],
  predictionMarkets: [
    "https://blog.polymarket.com/rss.xml",
    "https://kalshi.com/blog/rss.xml"
  ],
  crypto: [
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://coindesk.com/arc/outboundfeeds/rss/?outputType=xml"
  ],
  general: [
    "https://feeds.npr.org/1001/rss.xml",
    "https://feeds.npr.org/1006/rss.xml",
    "https://feeds.npr.org/1007/rss.xml"
  ]
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    const feedsToFetch = platform === 'all' 
      ? Object.values(RSS_FEEDS).flat()
      : RSS_FEEDS[platform as keyof typeof RSS_FEEDS] || [];

    const allItems = [];

    // Fetch RSS feeds in parallel with CORS proxy
    const feedPromises = feedsToFetch.map(async (feedUrl) => {
      try {
        // Use CORS proxy for feeds that might block direct access
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
        const feed = await parser.parseURL(proxyUrl);
        return feed.items.map(item => {
          const title = item.title || 'No title';
          const description = item.contentSnippet || item.content || '';
          const tags = extractTags(title, description);
          const analysis = analyzeNewsImpact(title, description, tags);
          
          return {
            id: `${feedUrl}-${item.guid || item.link || Math.random()}`,
            title,
            link: item.link || '',
            description,
            publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
            source: feed.title || new URL(feedUrl).hostname,
            platform: getPlatformFromUrl(feedUrl),
            category: getCategoryFromUrl(feedUrl),
            tags,
            analysis: {
              marketImpact: analysis.marketImpact,
              sentiment: analysis.sentiment,
              urgency: analysis.urgency,
              tradingSignals: analysis.tradingSignals,
              confidence: analysis.confidence
            }
          };
        });
      } catch (error) {
        console.error(`Failed to fetch RSS feed ${feedUrl}:`, error);
        return [];
      }
    });

    const feedResults = await Promise.allSettled(feedPromises);
    
    // Flatten and sort results
    feedResults.forEach(result => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    });

    // Sort by publication date (newest first) and limit
    const sortedItems = allItems
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);

    // Group by platform for organized response
    const groupedByPlatform = sortedItems.reduce((acc, item) => {
      if (!acc[item.platform]) {
        acc[item.platform] = [];
      }
      acc[item.platform].push(item);
      return acc;
    }, {} as Record<string, typeof sortedItems>);

    return NextResponse.json({
      timestamp: Date.now(),
      totalItems: sortedItems.length,
      platforms: Object.keys(groupedByPlatform),
      items: platform === 'all' ? groupedByPlatform : sortedItems
    });

  } catch (error) {
    console.error("RSS aggregation error:", error);
    return NextResponse.json({ error: "Failed to fetch RSS feeds" }, { status: 500 });
  }
}

function getPlatformFromUrl(url: string): string {
  if (url.includes('bloomberg')) return 'bloomberg';
  if (url.includes('reuters')) return 'reuters';
  if (url.includes('apnews')) return 'ap';
  if (url.includes('bbc')) return 'bbc';
  if (url.includes('cnn')) return 'cnn';
  if (url.includes('yahoo') || url.includes('marketwatch') || url.includes('wsj') || url.includes('ft.com')) return 'financial';
  if (url.includes('polymarket') || url.includes('kalshi')) return 'predictionMarkets';
  if (url.includes('cointelegraph') || url.includes('decrypt') || url.includes('coindesk')) return 'crypto';
  if (url.includes('npr')) return 'general';
  return 'other';
}

function getCategoryFromUrl(url: string): string {
  if (url.includes('politics')) return 'politics';
  if (url.includes('technology') || url.includes('tech')) return 'technology';
  if (url.includes('business') || url.includes('markets')) return 'economics';
  if (url.includes('crypto')) return 'crypto';
  return 'general';
}

function extractTags(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const tags = [];
  
  // Common financial/political tags
  const tagKeywords = {
    'fed': ['federal reserve', 'fed', 'interest rates', 'monetary policy', 'fomc'],
    'election': ['election', 'president', 'candidate', 'voting', 'campaign'],
    'crypto': ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'cryptocurrency'],
    'ai': ['artificial intelligence', 'ai', 'machine learning', 'chatgpt', 'openai'],
    'inflation': ['inflation', 'cpi', 'prices', 'cost of living', 'consumer price'],
    'recession': ['recession', 'economic downturn', 'gdp', 'economic contraction'],
    'tech': ['technology', 'tech', 'software', 'hardware', 'silicon valley'],
    'war': ['war', 'conflict', 'military', 'defense', 'nato'],
    'oil': ['oil', 'crude', 'energy', 'gas prices', 'opec'],
    'china': ['china', 'chinese', 'beijing', 'trade war'],
    'ukraine': ['ukraine', 'russian', 'putin', 'kyiv']
  };

  Object.entries(tagKeywords).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
}

function analyzeNewsImpact(title: string, description: string, tags: string[]): {
  marketImpact: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'high' | 'medium' | 'low';
  tradingSignals: string[];
  confidence: number;
} {
  const text = `${title} ${description}`.toLowerCase();
  
  // Market impact scoring
  let impactScore = 0;
  const highImpactKeywords = [
    'fed', 'federal reserve', 'interest rate', 'inflation', 'recession', 'gdp',
    'election', 'president', 'war', 'conflict', 'crisis', 'emergency',
    'bitcoin', 'crypto', 'market crash', 'rally', 'surge', 'plunge'
  ];
  
  const mediumImpactKeywords = [
    'earnings', 'merger', 'acquisition', 'ipo', 'regulation', 'policy',
    'unemployment', 'jobs', 'trade', 'tariff', 'sanctions'
  ];
  
  highImpactKeywords.forEach(keyword => {
    if (text.includes(keyword)) impactScore += 3;
  });
  
  mediumImpactKeywords.forEach(keyword => {
    if (text.includes(keyword)) impactScore += 2;
  });
  
  // Tag-based impact boost
  const highImpactTags = ['fed', 'election', 'war', 'crypto', 'inflation', 'recession'];
  highImpactTags.forEach(tag => {
    if (tags.includes(tag)) impactScore += 2;
  });
  
  // Sentiment analysis
  let sentimentScore = 0;
  const positiveKeywords = [
    'surge', 'rally', 'growth', 'increase', 'rise', 'gain', 'profit', 'success',
    'breakthrough', 'innovation', 'positive', 'optimistic', 'bullish'
  ];
  
  const negativeKeywords = [
    'crash', 'plunge', 'decline', 'fall', 'drop', 'loss', 'crisis', 'recession',
    'war', 'conflict', 'negative', 'pessimistic', 'bearish', 'concern'
  ];
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) sentimentScore += 1;
  });
  
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) sentimentScore -= 1;
  });
  
  // Urgency scoring
  let urgencyScore = 0;
  const urgentKeywords = [
    'breaking', 'urgent', 'emergency', 'crisis', 'immediate', 'alert',
    'just in', 'developing', 'live', 'update'
  ];
  
  urgentKeywords.forEach(keyword => {
    if (text.includes(keyword)) urgencyScore += 2;
  });
  
  // Trading signals
  const tradingSignals: string[] = [];
  
  if (tags.includes('fed') && text.includes('rate')) {
    tradingSignals.push('Monitor bond yields and USD strength');
  }
  if (tags.includes('election')) {
    tradingSignals.push('Watch volatility in political prediction markets');
  }
  if (tags.includes('crypto')) {
    tradingSignals.push('Check crypto correlation with traditional markets');
  }
  if (tags.includes('war') || tags.includes('conflict')) {
    tradingSignals.push('Monitor safe haven assets (gold, bonds)');
  }
  if (tags.includes('inflation')) {
    tradingSignals.push('Watch TIPS and inflation-protected securities');
  }
  if (tags.includes('ai')) {
    tradingSignals.push('Monitor tech sector and AI-related stocks');
  }
  
  // Determine final scores
  const marketImpact: 'high' | 'medium' | 'low' = 
    impactScore >= 6 ? 'high' : impactScore >= 3 ? 'medium' : 'low';
    
  const sentiment: 'positive' | 'negative' | 'neutral' = 
    sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';
    
  const urgency: 'high' | 'medium' | 'low' = 
    urgencyScore >= 3 ? 'high' : urgencyScore >= 1 ? 'medium' : 'low';
    
  const confidence = Math.min(0.9, Math.max(0.3, (impactScore + Math.abs(sentimentScore) + urgencyScore) / 15));
  
  return {
    marketImpact,
    sentiment,
    urgency,
    tradingSignals,
    confidence
  };
}
