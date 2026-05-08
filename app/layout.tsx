import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SplitSmart — Shared Expense Intelligence",
    template: "%s | SplitSmart",
  },
  description:
    "The AI-powered money OS for groups. Split subscriptions, rent, bills, and travel with friends, flatmates & teams. Zero drama, instant settlements.",
  keywords: [
    "expense splitter",
    "subscription sharing",
    "split bills",
    "group expenses",
    "rent splitting",
    "flatmate app",
    "UPI payments",
    "splitwise alternative",
  ],
  authors: [{ name: "SplitSmart" }],
  creator: "SplitSmart",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SplitSmart",
    title: "SplitSmart — Shared Expense Intelligence",
    description: "AI-powered group expense splitting for the modern era.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitSmart — Shared Expense Intelligence",
    description: "AI-powered group expense splitting for the modern era.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#060914",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#060914] text-white">
        {children}
      </body>
    </html>
  );
}
