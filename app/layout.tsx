import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SceneO • Independent Events, Creator Workshops & Film Screenings",
  description: "The modern ticketing platform for community events, movie screenings, workshops, and acoustic music in India. Instant 2-tap UPI checkout, 0% host fees, and offline pass verification.",
  metadataBase: new URL("https://sceneo.in"),
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/logo.svg"],
  },
  openGraph: {
    title: "SceneO • Independent Events & Film Screenings",
    description: "Find the gig. Grab your pass. Never miss a scene.",
    url: "https://sceneo.in",
    siteName: "SceneO",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "SceneO Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SceneO • Independent Events & Film Screenings",
    description: "Find the gig. Grab your pass. Never miss a scene.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-rose-500 selection:text-white overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
