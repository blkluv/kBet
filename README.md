# kBET - Live Market Intelligence Dashboard

A Bloomberg Terminal-style interface for real-time market intelligence, arbitrage detection, and news aggregation.

## Features

### 🎯 **Core Functionality**
- **Live Arbitrage Detection** - Find risk-free betting opportunities across sportsbooks and prediction markets
- **Bloomberg Terminal Interface** - Professional multi-panel terminal with dot-matrix aesthetic
- **Real-time News Aggregation** - RSS feeds from 20+ major news sources with sentiment analysis
- **Market Impact Scoring** - Automatic analysis of news for trading signals and market impact

### 📊 **Data Sources**
- **Sportsbooks**: DraftKings, FanDuel, BetMGM, Caesars, PointsBet, BetRivers
- **Prediction Markets**: Kalshi, Polymarket
- **News Sources**: Reuters, AP, BBC, CNN, Bloomberg, Financial Times, MarketWatch
- **Market Data**: Indices, commodities, currencies, bonds (simulated Bloomberg-style)

### 🎨 **Interface**
- **Dot-Matrix Aesthetic** - Black background with green terminal styling
- **Industrial Design** - Monospace fonts, scanlines, and grid patterns
- **Real-time Updates** - Configurable refresh rates (15s/30s/60s)
- **Responsive Layout** - Works on desktop and mobile

### 🧠 **Smart Analysis**
- **News Sentiment Analysis** - Positive/negative/neutral classification
- **Market Impact Scoring** - High/medium/low impact assessment
- **Trading Signals** - Automatic generation of actionable insights
- **Urgency Detection** - Identifies breaking news and urgent alerts

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Main Dashboard: http://localhost:3000
# Terminal View: http://localhost:3000/terminal
```

## API Endpoints

- `/api/odds` - Sportsbook odds from TheOddsAPI
- `/api/kalshi` - Kalshi prediction markets
- `/api/polymarket` - Polymarket prediction markets
- `/api/bloomberg` - Bloomberg-style market data
- `/api/rss` - RSS news aggregation with analysis

## Environment Setup

Create a `.env.local` file:

```bash
THEODDS_API_KEY=your_theodds_api_key_here
```

Get your API key from [TheOddsAPI](https://the-odds-api.com/).

## Trading Signals

The system automatically generates trading signals based on news analysis:

- **Fed Rate News** → "Monitor bond yields and USD strength"
- **Election Updates** → "Watch volatility in political prediction markets"
- **Crypto News** → "Check crypto correlation with traditional markets"
- **War/Conflict** → "Monitor safe haven assets (gold, bonds)"
- **Inflation Data** → "Watch TIPS and inflation-protected securities"
- **AI Developments** → "Monitor tech sector and AI-related stocks"

## Disclaimer

This is for informational purposes only. We do not place bets or provide betting services. Always verify odds, consider fees, and check betting limits before wagering. Gambling can be addictive - bet responsibly.

## License

MIT License - see LICENSE file for details.