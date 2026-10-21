import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";

export function Footer({ settings, categories }: { settings: Settings; categories: { name: string; slug: string }[] }) {
  return (
    <footer className="mt-12 bg-ink text-white sm:mt-24">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
        <div className="col-span-2 max-w-sm lg:col-span-1">
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
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">শপ</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/shop" className="hover:text-white">
                সব প্রিন্ট
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
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">সাহায্য</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="/#faq" className="hover:text-white">
                সাধারণ জিজ্ঞাসা
              </Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-white">
                ডেলিভারি ও রিটার্ন
              </Link>
            </li>
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                {settings.contactEmail}
              </a>
            </li>
            {settings.contactPhone && (
              <li>
                <a href={`tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`} className="hover:text-white">
                  📞 {settings.contactPhone}
                </a>
              </li>
            )}
            {settings.whatsappNumber && (
              <li>
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  💬 WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">ফলো করুন</p>
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
            <li className="text-white/60">#MyWallsy দিয়ে ট্যাগ করুন</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-sm text-white/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.storeName}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p>ক্যাশ অন ডেলিভারি · সারা বাংলাদেশে ডেলিভারি · ৭ দিনের রিটার্ন</p>
        </div>
      </div>
    </footer>
  );
}
