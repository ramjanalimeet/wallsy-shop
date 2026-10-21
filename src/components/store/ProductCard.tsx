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
      {/* The quick-add button is positioned against the image, not the whole card. */}
      <div className="relative">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden rounded-2xl bg-sand p-[14%] transition-colors group-hover:bg-[#ebe3d6] sm:p-[12%]">
        <div className="framed transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02]">
          {/* Plain img so the dashboard can use any image URL without extra config. */}
          <img src={image} alt={product.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />
        </div>
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white sm:px-2.5 sm:py-1 sm:text-xs">-{off}%</span>}
          {product.bestseller && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white sm:px-2.5 sm:py-1 sm:text-xs">বেস্টসেলার</span>}
        </div>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-accent-dark sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-xs">মাত্র {product.stock}টি বাকি</span>
        )}
        {product.stock <= 0 && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-muted sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-xs">স্টক শেষ</span>}
      </Link>
      <QuickAdd product={product} />
      </div>
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
