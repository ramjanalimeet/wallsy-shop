import Link from "next/link";
import { ArrowIcon, LeafIcon, ReturnIcon, ShieldIcon, Stars, TruckIcon } from "@/components/icons";
import { NewsletterForm } from "@/components/store/NewsletterForm";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { ProductCard } from "@/components/store/ProductCard";
import { listProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getFaq, getTrust } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export default async function HomePage() {
  const [settings, categories, bestsellers, newest, reviews, ratingAgg] = await Promise.all([
    getSettings(),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    listProducts({ where: { bestseller: true }, take: 8 }),
    listProducts({ sort: "newest", take: 4 }),
    db.review.findMany({ where: { approved: true, rating: { gte: 4 } }, include: { product: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.review.aggregate({ where: { approved: true }, _avg: { rating: true }, _count: true }),
  ]);
  const gallery = bestsellers.filter((p) => p.images[0] !== settings.heroImage).slice(0, 2);
  const avg = ratingAgg._avg.rating ?? 0;

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="container-x grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {settings.heroEyebrow}
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">{settings.heroTitle}</h1>
            <p className="mt-6 max-w-lg text-lg text-muted">{settings.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-accent px-8">
                {settings.heroCta} <ArrowIcon className="h-4 w-4" />
              </Link>
              {settings.whatsappNumber && (
                <a
                  href={whatsappLink(settings.whatsappNumber, "আসসালামু আলাইকুম, আমি ওয়াল আর্ট অর্ডার করতে চাই।")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-[#25D366] text-white hover:bg-[#1ebe5b]"
                >
                  <WhatsAppIcon /> WhatsApp-এ অর্ডার
                </a>
              )}
            </div>
            {ratingAgg._count > 0 && (
              <div className="mt-8 flex items-center gap-3 text-sm">
                <Stars rating={avg} />
                <span>
                  <strong>{avg.toFixed(1)}/5</strong> · {ratingAgg._count}টি রিভিউ
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative aspect-[5/4] rounded-[2rem] bg-gradient-to-b from-[#e9dfd0] to-[#dccdb8] p-6 sm:p-10">
              <div className="absolute left-[8%] top-[10%] w-[44%] rotate-[-1deg]">
                <div className="framed">
                  <img src={settings.heroImage} alt="ফিচারড প্রিন্ট" className="aspect-[3/4] w-full object-cover" />
                </div>
              </div>
              {gallery[0] && (
                <div className="absolute right-[10%] top-[8%] w-[30%]">
                  <div className="framed framed-oak">
                    <img src={gallery[0].images[0]} alt={gallery[0].title} className="aspect-[3/4] w-full object-cover" />
                  </div>
                </div>
              )}
              {gallery[1] && (
                <div className="absolute bottom-[16%] right-[16%] w-[24%]">
                  <div className="framed framed-white">
                    <img src={gallery[1].images[0]} alt={gallery[1].title} className="aspect-[3/4] w-full object-cover" />
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[10%] rounded-b-[2rem] bg-[#c9b79e]" />
            </div>
            <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <TruckIcon className="h-6 w-6 text-sage" />
              <div className="text-sm">
                <p className="font-semibold">ফ্রি ডেলিভারি</p>
                <p className="text-muted">{money(settings.freeShippingThreshold, settings.currency)}+ অর্ডারে</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {getTrust(settings).map(({ title, text }, i) => [[TruckIcon, ShieldIcon, ReturnIcon, LeafIcon][i], title, text]).map(([Icon, title, text]) => {
            const I = Icon as typeof TruckIcon;
            return (
              <div key={title as string} className="flex items-center gap-3">
                <I className="h-7 w-7 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">{title as string}</p>
                  <p className="text-muted">{text as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="container-x scroll-mt-20 py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">আপনার স্টাইল খুঁজুন</p>
            <h2 className="mt-2 font-serif text-4xl">কালেকশন</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 font-semibold hover:text-accent sm:flex">
            সব দেখুন <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group overflow-hidden rounded-2xl bg-sand">
              <div className="p-6 pb-0">
                <div className="framed transition-transform duration-500 group-hover:-translate-y-1">
                  {c.image && <img src={c.image} alt={c.name} loading="lazy" className="aspect-[3/4] w-full object-cover" />}
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-semibold">{c.name}</span>
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="container-x py-4">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">সবচেয়ে জনপ্রিয়</p>
              <h2 className="mt-2 font-serif text-4xl">বেস্টসেলার</h2>
            </div>
            <Link href="/shop" className="flex items-center gap-2 font-semibold hover:text-accent">
              সব দেখুন <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}

      {/* Framing value prop */}
      <section className="container-x py-20">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-[#ebe4d8] lg:grid-cols-2">
          <div className="flex justify-center gap-6 p-10 sm:p-14">
            {["", "framed-oak", "framed-white"].map((f, i) => {
              const p = bestsellers[i + 2] ?? bestsellers[i];
              return p ? (
                <div key={i} className={`w-1/3 ${i === 1 ? "-translate-y-6" : "translate-y-4"}`}>
                  <div className={`framed ${f}`}>
                    <img src={p.images[0]} alt={p.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                  </div>
                </div>
              ) : null;
            })}
          </div>
          <div className="p-10 pt-0 lg:pl-0 lg:pt-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">ফ্রেমসহ রেডি</p>
            <h2 className="mt-2 font-serif text-4xl">বক্স খুলুন, দেয়ালে লাগান।</h2>
            <p className="mt-4 text-muted">যেকোনো প্রিন্টের সাথে মাত্র {money(settings.framePrice, settings.currency)} যোগ করে কাঠের ফ্রেম নিন। ম্যাট, গ্লাস আর হুকসহ পুরোপুরি তৈরি অবস্থায় পৌঁছাবে।</p>
            <ul className="mt-6 space-y-3">
              {["কালো, সাদা অথবা ন্যাচারাল ওক কাঠের ফ্রেম", "না-ভাঙা অ্যাক্রিলিক গ্লাস — বাচ্চাদের রুমেও নিরাপদ", "ঝোলানোর হুক সাথেই থাকে, কোনো টুল লাগবে না"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sage">✓</span> {t}
                </li>
              ))}
            </ul>
            <Link href="/shop" className="btn btn-primary mt-8">
              প্রিন্ট বেছে নিন
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-x">
            <div className="mb-10 text-center">
              <Stars rating={avg} className="h-6 w-6" />
              <h2 className="mt-3 font-serif text-4xl">ক্রেতারা যা বলছেন</h2>
              <p className="mt-2 text-muted">
                {ratingAgg._count}টি রিভিউতে গড় রেটিং {avg.toFixed(1)}/5
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-line bg-paper p-6">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-5 flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {r.name}
                    </span>
                    <Link href={`/product/${r.product.slug}`} className="text-muted underline-offset-2 hover:underline">
                      {r.product.title}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newest.length > 0 && (
        <section className="container-x py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">এইমাত্র এসেছে</p>
              <h2 className="mt-2 font-serif text-4xl">নতুন কালেকশন</h2>
            </div>
            <Link href="/shop?sort=newest" className="flex items-center gap-2 font-semibold hover:text-accent">
              সব নতুন দেখুন <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {newest.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container-x">
        <div className="rounded-[2rem] bg-accent px-6 py-14 text-center text-white sm:px-14">
          <h2 className="font-serif text-4xl">{settings.newsletterTitle}</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">{settings.newsletterText}</p>
          <div className="mx-auto mt-8 max-w-md">
            <NewsletterForm code={settings.newsletterCode} dark />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x max-w-3xl scroll-mt-20 py-20">
        <h2 className="mb-8 text-center font-serif text-4xl">সাধারণ জিজ্ঞাসা</h2>
        <div className="divide-y divide-line border-y border-line">
          {getFaq(settings).map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex items-center justify-between gap-4 text-lg font-medium">
                {q}
                <span className="chev text-2xl leading-none transition-transform">+</span>
              </summary>
              <p className="mt-3 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
