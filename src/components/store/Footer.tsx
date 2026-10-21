import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";

export function Footer({ settings, categories }: { settings: Settings; categories: { name: string; slug: string }[] }) {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <p className="font-serif text-3xl">
            {settings.storeName}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-3 text-white/70">{settings.tagline}</p>
          <p className="mt-6 font-medium">{settings.newsletterTitle}</p>
          <div className="mt-3">
            <NewsletterForm code={settings.newsletterCode} dark />
          </div>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Shop</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/shop" className="hover:text-white">
                All prints
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Help</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/#faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-white">
                Shipping & returns
              </Link>
            </li>
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                {settings.contactEmail}
              </a>
            </li>
            {settings.contactPhone && <li>{settings.contactPhone}</li>}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">Follow</p>
          <ul className="space-y-2 text-white/80">
            {settings.instagram && (
              <li>
                <a href={settings.instagram} className="hover:text-white" target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {settings.facebook && (
              <li>
                <a href={settings.facebook} className="hover:text-white" target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            )}
            <li className="text-white/60">Tag us #MyWallsy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-sm text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>
          <p>Secure checkout · Cash on delivery · 30-day returns</p>
        </div>
      </div>
    </footer>
  );
}
