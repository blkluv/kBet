import './globals.css'

export const metadata = { 
  title: "kBET - Live Market Intelligence Dashboard", 
  description: "Real-time arbitrage opportunities, prediction market analysis, and cross-venue odds comparison. Find risk-free betting edges across sportsbooks and prediction markets with Bloomberg-style terminal interface." 
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
