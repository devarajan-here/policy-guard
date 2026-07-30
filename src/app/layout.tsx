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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "PeopleGuard AI — Secure HR Intelligence",
  description: "A secure-by-design HR assistant for ABC Pvt Ltd, protected by Konsole.",
  openGraph: {
    title: "PeopleGuard AI — Secure HR Intelligence",
    description: "Your people data. Guarded by design.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PeopleGuard AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PeopleGuard AI — Secure HR Intelligence",
    description: "Your people data. Guarded by design.",
    images: ["/og.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
