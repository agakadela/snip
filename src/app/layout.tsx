import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Snip - YouTube Video Summarizer",
  description: "Summarize any YouTube video into a spoken-style script that takes no more than 30 seconds to read aloud.",
  keywords: ["youtube", "summarizer", "ai", "transcript", "summary", "speech"],
  authors: [{ name: "Snip" }],
  openGraph: {
    title: "Snip - YouTube Video Summarizer",
    description: "Summarize any YouTube video into a spoken-style script in 30 seconds or less.",
    url: "https://snip.vercel.app",
    siteName: "Snip",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Snip - YouTube Video Summarizer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snip - YouTube Video Summarizer",
    description: "Summarize any YouTube video into a spoken-style script in 30 seconds or less.",
    images: ["/og-image.png"],
  },
};

// Import the Footer component
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-zinc-950 text-white min-h-screen flex flex-col`}>
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
