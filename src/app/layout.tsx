import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sadindex.com"),
  title: {
    default: "Sad Index — National Mood Dashboard | 4 Indices Tracking America's Mood",
    template: "%s | Sad Index",
  },
  description:
    "4 indices tracking America's mood: Music Sadness, Market Fear, Consumer Gloom, and Job Anxiety. Combined into the National Mood Score. 25 years of data.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "EHtSx85VUcaQWdWLpeY0U2h2V_676OCo8Qk1X_OopQY",
  },
  openGraph: {
    title: "Sad Index — Is America Sad Right Now?",
    description:
      "Billboard Hot 100 emotional valence tracked against the economy. The CNN Fear & Greed Index of pop culture.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
    siteName: "Sad Index",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sad Index — Billboard Sadness Index",
    description:
      "When the charts get bright, recessions follow. Track the emotional temperature of the Hot 100.",
    images: ["/api/og"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sad Index",
  alternateName: "Billboard Sadness Index",
  url: "https://sadindex.com",
  description:
    "Weekly emotional valence tracking of Billboard Hot 100 songs against economic indicators",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sad Index",
  url: "https://sadindex.com",
  description:
    "Billboard Sadness Index — tracking America's musical mood since 2000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}
