import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/inter";
import "./globals.css";
import Header from "@/components/Header";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
