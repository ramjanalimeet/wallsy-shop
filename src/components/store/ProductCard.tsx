import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { money, percentOff } from "@/lib/format";
import { Stars } from "../icons";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({ product, currency }: { product: CatalogProduct; currency: string }) {
  const off = percentOff(product.price, product.compareAtPrice);
  const image = product.images[0];
  const from = product.variants.length > 1;

  return (
    <div className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden rounded-2xl bg-sand p-[12%] transition-colors group-hover:bg-[#ebe3d6]">
        <div className="framed transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02]">
          {/* Plain img so the dashboard can use any image URL without extra config. */}
          <img src={image} alt={product.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">-{off}%</span>}
          {product.bestseller && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">বেস্টসেলার</span>}
        </div>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-accent-dark">মাত্র {product.stock}টি বাকি</span>
        )}
        {product.stock <= 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-muted">স্টক শেষ</span>}
      </Link>
      <QuickAdd product={product} />
      <div className="mt-3 flex flex-1 flex-col">
        {/* Price sits under the title on phones, beside it on wider screens. */}
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <Link href={`/product/${product.slug}`} className="font-medium leading-snug hover:underline">
            {product.title}
          </Link>
          <p className="sm:shrink-0 sm:text-right">
            <span className="font-semibold">
              {from && <span className="text-xs font-normal text-muted">শুরু </span>}
              {money(product.price, currency)}
            </span>
            {off > 0 && <span className="ml-1.5 text-sm text-muted line-through">{money(product.compareAtPrice!, currency)}</span>}
          </p>
        </div>
        <p className="text-sm text-muted">{product.artist}</p>
        {product.reviewCount > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Stars rating={product.rating} className="h-3.5 w-3.5" /> ({product.reviewCount})
          </p>
        )}
      </div>
    </div>
  );
}
