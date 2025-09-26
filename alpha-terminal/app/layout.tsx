import './globals.css'

export const metadata = { 
  title: "Alpha Terminal (MVP)", 
  description: "Live markets + news for Kalshi, Polymarket, DraftKings" 
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
