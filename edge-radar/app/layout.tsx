import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edge Radar (Prototype)",
  description: "Live odds + simple arb finder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
