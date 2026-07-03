import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Pranko — AI prank photos in 10 seconds",
  description: "Make your friends question reality. Upload a selfie, pick a prank, get an ultra-realistic photo in 10 seconds.",
  openGraph: {
    title: "Pranko — Make your friends question reality",
    description: "AI prank photos in 10 seconds. They will never recover.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Pranko", description: "AI prank photos in 10 seconds" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}