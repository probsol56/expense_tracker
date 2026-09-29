import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Headings and headline figures only — body copy stays in the sans face.
const displayFont = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = config.siteUrl;
const title = "Wallo — Personal Finance, Elevated";
const description = "A calmer, premium way to track and understand your money.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Wallo",
  },
  description,
  applicationName: "Wallo",
  keywords: [
    "expense tracker",
    "personal finance",
    "budgeting app",
    "loan tracker",
    "money management",
  ],
  authors: [{ name: "Wallo" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Wallo",
    title,
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Wallo — Personal Finance, Elevated" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF1EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F0C" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // §17: Respect the OS preference by default; persist an explicit user override.
  const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-canvas font-sans text-fg antialiased selection:bg-brass/30 selection:text-fg">
        {children}
      </body>
    </html>
  );
}

