import { NextResponse } from "next/server";

// Bloomberg Terminal-style market data
// In production, integrate with Bloomberg API or financial data providers
export async function GET() {
  try {
    // Simulate Bloomberg Terminal data feeds
    const bloombergData = {
      marketOverview: {
        timestamp: Date.now(),
        indices: [
          { symbol: "SPX", name: "S&P 500", price: 4785.23, change: 12.45, changePercent: 0.26 },
          { symbol: "DJI", name: "Dow Jones", price: 37432.15, change: -45.67, changePercent: -0.12 },
          { symbol: "IXIC", name: "NASDAQ", price: 14932.78, change: 89.23, changePercent: 0.60 },
          { symbol: "RUT", name: "Russell 2000", price: 1987.45, change: 5.67, changePercent: 0.29 }
        ],
        commodities: [
          { symbol: "GC", name: "Gold", price: 2045.30, change: 8.50, changePercent: 0.42 },
          { symbol: "CL", name: "Crude Oil", price: 72.45, change: -1.23, changePercent: -1.67 },
          { symbol: "NG", name: "Natural Gas", price: 2.89, change: 0.12, changePercent: 4.33 },
          { symbol: "SI", name: "Silver", price: 24.67, change: 0.45, changePercent: 1.86 }
        ],
        currencies: [
          { symbol: "EURUSD", name: "Euro/USD", price: 1.0845, change: 0.0023, changePercent: 0.21 },
          { symbol: "GBPUSD", name: "Pound/USD", price: 1.2678, change: -0.0012, changePercent: -0.09 },
          { symbol: "USDJPY", name: "USD/Yen", price: 149.23, change: 0.45, changePercent: 0.30 },
          { symbol: "USDCHF", name: "USD/Franc", price: 0.8765, change: -0.0015, changePercent: -0.17 }
        ],
        bonds: [
          { symbol: "TNX", name: "10Y Treasury", price: 4.12, change: -0.05, changePercent: -1.20 },
          { symbol: "TYX", name: "30Y Treasury", price: 4.28, change: -0.03, changePercent: -0.70 },
          { symbol: "FVX", name: "5Y Treasury", price: 3.89, change: -0.04, changePercent: -1.02 }
        ]
      },
      predictionMarkets: {
        timestamp: Date.now(),
        politics: [
          { market: "2024 Election Winner", yesPrice: 0.62, volume: 2400000, change: 0.03 },
          { market: "Senate Control", yesPrice: 0.45, volume: 890000, change: -0.02 },
          { market: "House Control", yesPrice: 0.38, volume: 650000, change: 0.01 }
        ],
        economics: [
          { market: "Fed Rate Cut by Q2", yesPrice: 0.78, volume: 1200000, change: -0.05 },
          { market: "Recession in 2024", yesPrice: 0.25, volume: 980000, change: -0.03 },
          { market: "Inflation Below 3%", yesPrice: 0.67, volume: 750000, change: 0.02 }
        ],
        technology: [
          { market: "AI Regulation Passes", yesPrice: 0.45, volume: 1100000, change: 0.08 },
          { market: "Bitcoin $100K+ EOY", yesPrice: 0.34, volume: 3100000, change: -0.01 },
          { market: "Tesla $300+ EOY", yesPrice: 0.28, volume: 890000, change: 0.04 }
        ]
      },
      news: {
        timestamp: Date.now(),
        headlines: [
          { 
            id: "bloomberg-1",
            source: "Bloomberg",
            title: "Fed Officials Signal Potential Rate Cuts as Inflation Cools",
            category: "economics",
            impact: "high",
            timestamp: Date.now() - 300000 // 5 minutes ago
          },
          { 
            id: "bloomberg-2", 
            source: "Bloomberg",
            title: "Tech Stocks Rally on AI Regulation Clarity",
            category: "technology",
            impact: "medium",
            timestamp: Date.now() - 600000 // 10 minutes ago
          },
          { 
            id: "bloomberg-3",
            source: "Bloomberg", 
            title: "Oil Prices Drop on Inventory Build Concerns",
            category: "commodities",
            impact: "medium",
            timestamp: Date.now() - 900000 // 15 minutes ago
          }
        ]
      }
    };

    return NextResponse.json(bloombergData);
  } catch (error) {
    console.error("Bloomberg API error:", error);
    return NextResponse.json({ error: "Failed to fetch Bloomberg data" }, { status: 500 });
  }
}
