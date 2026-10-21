"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { BagIcon } from "../icons";
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
      className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-ink hover:text-white md:bottom-auto md:right-3 md:top-3 md:h-auto md:w-auto md:translate-y-1 md:px-3.5 md:py-2 md:text-xs md:font-semibold md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
      aria-label={`${product.title} কার্টে যোগ করুন`}
    >
      {/* Phones: a round cart button in the corner, clear of the badges. Desktop: a pill on hover. */}
      <BagIcon className="h-[18px] w-[18px] md:hidden" />
      <span className="hidden md:inline">+ কার্টে নিন</span>
    </button>
  );
}
