import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Vibe Index — Billboard Sadness Index",
  description: "Tracking the emotional temperature of Billboard Hot 100 hits over time. When charts get bright, recessions follow.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sadindex.com"),
  verification: {
    google: "EHtSx85VUcaQWdWLpeY0U2h2V_676OCo8Qk1X_OopQY",
  },
  openGraph: {
    title: "The Vibe Index — Is America Sad Right Now?",
    description: "Billboard Hot 100 emotional valence tracked against the economy. The CNN Fear & Greed Index of pop culture.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Vibe Index — Billboard Sadness Index",
    description: "When the charts get bright, recessions follow. Track the emotional temperature of the Hot 100.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
