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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Susegad",
  description: "Chat with Susegad in English, Hindi, or Hinglish.",
  applicationName: "Susegad",
  appleWebApp: {
    capable: true,
    title: "Susegad",
    statusBarStyle: "default",
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
