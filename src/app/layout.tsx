import type { Metadata } from "next";
import { Fraunces, Hind_Siliguri, Inter } from "next/font/google";
import { SetupScreen } from "@/components/SetupScreen";
import { getSettings } from "@/lib/settings";
import { getSetupStatus } from "@/lib/setup";
import "./globals.css";

// Everything is driven by the database and editable from the dashboard, so render on each request.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const bangla = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-bangla" });

export async function generateMetadata(): Promise<Metadata> {
  if (!(await getSetupStatus()).ok) return { title: "Wallsy · Setup", robots: { index: false } };
  const s = await getSettings();
  return {
    title: { default: `${s.storeName} — ${s.tagline}`, template: `%s · ${s.storeName}` },
    description: s.heroSubtitle,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const status = await getSetupStatus();
  return (
    <html lang="bn" className={`${inter.variable} ${fraunces.variable} ${bangla.variable}`}>
      <body className="min-h-screen font-sans">{status.ok ? children : <SetupScreen status={status} />}</body>
    </html>
  );
}
