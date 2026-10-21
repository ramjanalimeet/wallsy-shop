"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { useCart } from "./CartProvider";

export function QuickAdd({ product }: { product: CatalogProduct }) {
  const { add } = useCart();
  if (product.stock <= 0) return null;
  const v = product.variants[0];

  return (
    <button
      onClick={() =>
        add({
          productId: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0],
          variantId: v?.id ?? null,
          variantName: v?.name ?? "Standard",
          frame: "",
          unitPrice: v?.price ?? product.price,
        })
      }
      className="absolute right-3 top-3 translate-y-1 rounded-full bg-white px-3.5 py-2 text-xs font-semibold shadow-md transition hover:bg-ink hover:text-white md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
      aria-label={`${product.title} কার্টে যোগ করুন`}
    >
      + কার্টে নিন
    </button>
  );
}
