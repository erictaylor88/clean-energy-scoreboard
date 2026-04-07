import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/inter";
import "./globals.css";
import Header from "@/components/Header";
import { WebsiteJsonLd, DatasetJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: {
    default: "Clean Energy Scoreboard — Is Clean Energy Winning?",
    template: "%s | Clean Energy Scoreboard",
  },
  description:
    "Real-time scoreboard tracking the global energy transition. See which countries lead in clean energy, track historical trends, and find out if we're winning.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://iscleanenergywinning.com"
  ),
  openGraph: {
    type: "website",
    siteName: "Clean Energy Scoreboard",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
  },
  alternates: {
    canonical: "https://iscleanenergywinning.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <WebsiteJsonLd />
        <DatasetJsonLd
          name="Global Electricity Generation Data"
          description="Yearly and monthly electricity generation data for 215+ countries, sourced from Ember's Global Electricity Review."
          url="https://iscleanenergywinning.com"
        />
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex flex-col min-h-screen">
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
