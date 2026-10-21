import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stars } from "@/components/icons";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ReviewForm } from "@/components/store/ReviewForm";
import { getProduct, listProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return { title: product.title, description: product.description.slice(0, 160), openGraph: { images: product.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, reviews, related] = await Promise.all([
    getSettings(),
    db.review.findMany({ where: { productId: product.id, approved: true }, orderBy: { createdAt: "desc" } }),
    listProducts({ category: product.category?.slug, where: { id: { not: product.id } }, take: 4 }),
  ]);

  const delivery = "ঢাকায় ১–২ দিন, ঢাকার বাইরে ৩–৫ দিনে ডেলিভারি";

  const details = [
    ["বিবরণ", product.description],
    ["প্রিন্ট ও পেপার", "২৫০ জিএসএম প্রিমিয়াম ম্যাট আর্ট পেপার · দীর্ঘস্থায়ী পিগমেন্ট কালি · স্ট্যান্ডার্ড ফ্রেমে মাপমতো বসে।"],
    ["ডেলিভারি", `ঢাকার ভিতরে ডেলিভারি চার্জ ${money(settings.shippingFee, settings.currency)}, ঢাকার বাইরে ${money(settings.shippingFeeOutside, settings.currency)}। ${money(settings.freeShippingThreshold, settings.currency)} বা তার বেশি অর্ডারে ডেলিভারি ফ্রি। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।`],
    ["রিটার্ন", "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করা যাবে। ডেলিভারিতে ভাঙা বা ক্ষতিগ্রস্ত হলে ছবি পাঠান, আমরা বিনামূল্যে নতুন পাঠাব।"],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    brand: settings.storeName,
    offers: { "@type": "Offer", price: (product.price / 100).toFixed(2), priceCurrency: "BDT", availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ...(product.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.toFixed(1), reviewCount: product.reviewCount } } : {}),
  };

  return (
    <div className="container-x py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductPurchase product={product} delivery={delivery}>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {details.map(([title, body], i) => (
            <details key={title} open={i === 0} className="py-4">
              <summary className="flex items-center justify-between font-semibold">
                {title}
                <span className="chev text-xl leading-none transition-transform">+</span>
              </summary>
              <p className="mt-3 whitespace-pre-line text-muted">{body}</p>
            </details>
          ))}
        </div>
      </ProductPurchase>

      <section id="reviews" className="mt-24 scroll-mt-24">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-4xl">ক্রেতাদের রিভিউ</h2>
            {product.reviewCount > 0 && (
              <p className="mt-2 flex items-center gap-2 text-muted">
                <Stars rating={product.rating} /> {product.rating.toFixed(1)}/5 · {product.reviewCount}টি রিভিউ
              </p>
            )}
          </div>
          <ReviewForm productId={product.id} />
        </div>
        {reviews.length === 0 ? (
          <p className="text-muted">এখনো কোনো রিভিউ নেই — প্রথম রিভিউটি আপনিই দিন।</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-3">{r.body}</p>
                <p className="mt-3 text-sm font-semibold">{r.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-serif text-4xl">আরও দেখুন</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
