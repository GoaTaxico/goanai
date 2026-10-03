import type { Metadata, Viewport } from "next";
import { Mukta, Tiro_Devanagari_Hindi } from "next/font/google";

import "./globals.css";

const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const tiro = Tiro_Devanagari_Hindi({
  subsets: ["latin", "devanagari"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const title = "Susegad — Free chat in English, Hindi, and Hinglish";
const description =
  "Susegad is a free chat app for India. Ask in English, Hindi, or Hinglish for schoolwork, travel plans, bills, and everyday messages.";

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08343c",
};

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: title,
    template: "%s · Susegad",
  },
  description,
  applicationName: "Susegad",
  authors: [{ name: "Luqman", url: "https://coastalcode.in" }],
  creator: "Luqman",
  publisher: "CoastalCode",
  keywords: [
    "Susegad",
    "Hindi chat",
    "Hinglish chat",
    "free chat app India",
    "English Hindi assistant",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Susegad",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: "/",
    siteName: "Susegad",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${mukta.variable} ${tiro.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
