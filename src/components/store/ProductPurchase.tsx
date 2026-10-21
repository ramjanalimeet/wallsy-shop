"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { money, percentOff } from "@/lib/format";
import { FireIcon, MinusIcon, PlusIcon, Stars } from "../icons";
import { useCart } from "./CartProvider";
import { FreeShippingBar } from "./FreeShippingBar";
import { WhatsAppOrderButton } from "./WhatsApp";

const frames = [
  { name: "", label: "ফ্রেম ছাড়া", swatch: "bg-white border-dashed", cls: "framed-none" },
  { name: "Black", label: "কালো", swatch: "bg-[#1f1d1a]", cls: "" },
  { name: "White", label: "সাদা", swatch: "bg-[#f4f1ec]", cls: "framed-white" },
  { name: "Oak", label: "ওক কাঠ", swatch: "bg-[#b98a5a]", cls: "framed-oak" },
];

export function ProductPurchase({ product, delivery, children }: { product: CatalogProduct; delivery: string; children: React.ReactNode }) {
  const { add, config } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? null);
  const [frame, setFrame] = useState("Black");
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(product.images[0]);
  const [showSticky, setShowSticky] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const variant = product.variants.find((v) => v.id === variantId);
  const base = variant?.price ?? product.price;
  const unitPrice = base + (frame ? config.framePrice : 0);
  // Compare-at applies to the base size; scale it to the selected one.
  const compareAt = product.compareAtPrice ? product.compareAtPrice + (base - product.price) + (frame ? config.framePrice : 0) : null;
  const off = percentOff(unitPrice, compareAt);
  const soldOut = product.stock <= 0;
  const frameCls = frames.find((f) => f.name === frame)?.cls ?? "";
  const frameLabel = frames.find((f) => f.name === frame)?.label ?? frame;

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToCart = (open = true) =>
    add(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        variantId,
        variantName: variant?.name ?? "Standard",
        frame,
        unitPrice,
      },
      qty,
      open
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-gradient-to-b from-[#ece4d8] to-[#ddd0bd] p-[14%]">
          <div className={`framed ${frameCls} w-full max-w-md transition-all duration-300`}>
            <img src={image} alt={product.title} className="aspect-[3/4] w-full object-cover" />
          </div>
        </div>
        {product.images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {product.images.map((src) => (
              <button key={src} onClick={() => setImage(src)} className={`w-20 overflow-hidden rounded-lg border-2 ${src === image ? "border-ink" : "border-transparent"}`}>
                <img src={src} alt="" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.category && <p className="text-sm font-semibold uppercase tracking-wider text-accent">{product.category.name}</p>}
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{product.title}</h1>
        <p className="mt-1 text-muted">আর্টিস্ট: {product.artist}</p>
        {product.reviewCount > 0 && (
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
            <Stars rating={product.rating} /> <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-muted underline-offset-2 hover:underline">({product.reviewCount}টি রিভিউ)</span>
          </a>
        )}

        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{money(unitPrice, config.currency)}</span>
          {off > 0 && compareAt && (
            <>
              <span className="text-lg text-muted line-through">{money(compareAt, config.currency)}</span>
              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent">{off}% ছাড়</span>
            </>
          )}
        </div>

        {product.variants.length > 0 && (
          <fieldset className="mt-8">
            <legend className="mb-3 text-sm font-semibold">সাইজ</legend>
            <div className="grid grid-cols-3 gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${v.id === variantId ? "border-ink bg-white ring-1 ring-ink" : "border-line bg-white hover:border-ink"}`}
                >
                  <span className="block font-medium">{v.name}</span>
                  <span className="text-muted">{money(v.price, config.currency)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-6">
          <legend className="mb-3 text-sm font-semibold">
            ফ্রেম <span className="font-normal text-muted">· {frame ? `${frameLabel} (+${money(config.framePrice, config.currency)})` : "শুধু প্রিন্ট"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {frames.map((f) => (
              <button
                key={f.label}
                onClick={() => setFrame(f.name)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${f.name === frame ? "border-ink bg-white ring-1 ring-ink" : "border-line bg-white hover:border-ink"}`}
              >
                <span className={`h-4 w-4 rounded-full border border-line ${f.swatch}`} /> {f.label}
              </button>
            ))}
          </div>
          {frame && <p className="mt-2 text-sm text-sage">✓ ফ্রেমসহ রেডি টু হ্যাং অবস্থায় পৌঁছাবে</p>}
        </fieldset>

        {!soldOut && product.stock <= 10 && (
          <p className="mt-6 flex items-center gap-2 text-sm font-medium text-accent-dark">
            <FireIcon className="h-4 w-4" /> দ্রুত বিক্রি হচ্ছে — মাত্র {product.stock}টি স্টকে আছে
          </p>
        )}

        <div ref={buttonRef} className="mt-6 flex gap-3">
          <div className="flex items-center rounded-full border border-line bg-white">
            <button className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="পরিমাণ কমান">
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-6 text-center">{qty}</span>
            <button className="p-3" onClick={() => setQty((q) => Math.min(Math.max(1, product.stock), q + 1))} aria-label="পরিমাণ বাড়ান">
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <button disabled={soldOut} onClick={() => addToCart()} className="btn btn-primary flex-1">
            {soldOut ? "স্টক শেষ" : `কার্টে যোগ করুন · ${money(unitPrice * qty, config.currency)}`}
          </button>
        </div>
        {!soldOut && (
          <button
            onClick={() => {
              addToCart(false);
              router.push("/checkout");
            }}
            className="btn btn-accent mt-3 w-full"
          >
            এখনই কিনুন
          </button>
        )}
        {!soldOut && (
          <WhatsAppOrderButton
            className="mt-3 w-full"
            items={[{ title: product.title, variantName: variant?.name ?? "Standard", frame, quantity: qty, unitPrice }]}
            path={`/product/${product.slug}`}
          />
        )}

        <div className="mt-5">
          <FreeShippingBar />
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <li className="rounded-xl border border-line bg-white p-3">
            🚚 <strong>{delivery}</strong>
          </li>
          <li className="rounded-xl border border-line bg-white p-3">
            ↩️ <strong>৭ দিনের</strong> সহজ রিটার্ন
          </li>
          <li className="rounded-xl border border-line bg-white p-3">
            💵 <strong>ক্যাশ অন ডেলিভারি</strong>
          </li>
          <li className="rounded-xl border border-line bg-white p-3">
            🖼️ <strong>প্রিমিয়াম</strong> আর্ট পেপার
          </li>
        </ul>

        {children}
      </div>

      {showSticky && !soldOut && (
        <div className="animate-fade-in fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur">
          <div className="container-x flex items-center gap-3">
            <img src={product.images[0]} alt="" className="hidden h-12 w-9 rounded object-cover sm:block" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{product.title}</p>
              <p className="text-sm text-muted">
                {variant?.name} · {frame ? frameLabel : "ফ্রেম ছাড়া"}
              </p>
            </div>
            <button onClick={() => addToCart()} className="btn btn-accent shrink-0 px-5 py-3">
              কার্টে নিন · {money(unitPrice * qty, config.currency)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
