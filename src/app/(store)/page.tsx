import Link from "next/link";
import { ArrowIcon, LeafIcon, ReturnIcon, ShieldIcon, Stars, TruckIcon } from "@/components/icons";
import { NewsletterForm } from "@/components/store/NewsletterForm";
import { ProductCard } from "@/components/store/ProductCard";
import { listProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const faqs = [
  ["How long does delivery take?", "Prints are made to order within 1–2 business days. Most orders arrive within 3–5 business days after dispatch, and you'll get tracking by email."],
  ["What paper and inks do you use?", "250gsm archival matte fine-art paper and museum-grade pigment inks, rated to last over 100 years without fading."],
  ["Do frames come with glass?", "Every frame is solid wood with shatter-proof acrylic glazing, a white mat and hanging hardware — ready to hang straight out of the box."],
  ["Can I return my order?", "Yes. If you don't love it, return it within 30 days for a full refund. Damaged in transit? We'll reprint it free."],
  ["Which payment methods do you accept?", "Cash on delivery is available on every order. Pay the courier when your art arrives."],
];

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
              <Link href="#categories" className="btn btn-ghost">
                Shop by style
              </Link>
            </div>
            {ratingAgg._count > 0 && (
              <div className="mt-8 flex items-center gap-3 text-sm">
                <Stars rating={avg} />
                <span>
                  <strong>{avg.toFixed(1)}/5</strong> from {ratingAgg._count} reviews
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative aspect-[5/4] rounded-[2rem] bg-gradient-to-b from-[#e9dfd0] to-[#dccdb8] p-6 sm:p-10">
              <div className="absolute left-[8%] top-[10%] w-[44%] rotate-[-1deg]">
                <div className="framed">
                  <img src={settings.heroImage} alt="Featured print" className="aspect-[3/4] w-full object-cover" />
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
                <p className="font-semibold">Free shipping</p>
                <p className="text-muted">on orders over {money(settings.freeShippingThreshold, settings.currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-6 text-sm lg:grid-cols-4">
          {[
            [TruckIcon, "Free shipping", `On orders over ${money(settings.freeShippingThreshold, settings.currency)}`],
            [ReturnIcon, "30-day returns", "Love it or your money back"],
            [LeafIcon, "Archival quality", "Pigment inks that last 100+ years"],
            [ShieldIcon, "Pay on delivery", "Cash on delivery, no card needed"],
          ].map(([Icon, title, text]) => {
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
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Find your style</p>
            <h2 className="mt-2 font-serif text-4xl">Shop by collection</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-2 font-semibold hover:text-accent sm:flex">
            View all <ArrowIcon className="h-4 w-4" />
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
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">Customer favourites</p>
              <h2 className="mt-2 font-serif text-4xl">Bestsellers</h2>
            </div>
            <Link href="/shop" className="flex items-center gap-2 font-semibold hover:text-accent">
              Shop all <ArrowIcon className="h-4 w-4" />
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
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Framed by hand</p>
            <h2 className="mt-2 font-serif text-4xl">Unbox it. Hang it. Done.</h2>
            <p className="mt-4 text-muted">Add a solid wood frame to any print for {money(settings.framePrice, settings.currency)}. Every frame comes assembled with a mat, shatter-proof glazing and wall hooks.</p>
            <ul className="mt-6 space-y-3">
              {["Solid wood in black, white or natural oak", "Shatter-proof acrylic — safe for kids' rooms", "Hanging hardware included, no tools needed"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sage">✓</span> {t}
                </li>
              ))}
            </ul>
            <Link href="/shop" className="btn btn-primary mt-8">
              Find your print
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
              <h2 className="mt-3 font-serif text-4xl">Loved on walls everywhere</h2>
              <p className="mt-2 text-muted">
                Rated {avg.toFixed(1)} out of 5 across {ratingAgg._count} reviews
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
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">Just dropped</p>
              <h2 className="mt-2 font-serif text-4xl">New arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="flex items-center gap-2 font-semibold hover:text-accent">
              See what&apos;s new <ArrowIcon className="h-4 w-4" />
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
        <h2 className="mb-8 text-center font-serif text-4xl">Questions? Answered.</h2>
        <div className="divide-y divide-line border-y border-line">
          {faqs.map(([q, a]) => (
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
