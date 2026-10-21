import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

// Everything is driven by the database and editable from the dashboard, so render on each request.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.storeName} — ${s.tagline}`, template: `%s · ${s.storeName}` },
    description: s.heroSubtitle,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
