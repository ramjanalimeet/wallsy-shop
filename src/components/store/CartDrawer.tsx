"use client";

import Link from "next/link";
import { useEffect } from "react";
import { money } from "@/lib/format";
import { FRAME_BN } from "@/lib/whatsapp";
import { CloseIcon, LockIcon, MinusIcon, PlusIcon } from "../icons";
import { useCart } from "./CartProvider";
import { FreeShippingBar } from "./FreeShippingBar";
import { WhatsAppOrderButton } from "./WhatsApp";

export type Upsell = { id: string; slug: string; title: string; image: string; price: number; variantId: string | null; variantName: string };

export function CartDrawer({ upsells }: { upsells: Upsell[] }) {
  const { items, open, setOpen, update, remove, subtotal, config, add } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const suggestions = upsells.filter((u) => !items.some((i) => i.productId === u.id)).slice(0, 2);

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl" role="dialog" aria-label="Shopping cart">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-xl">আপনার কার্ট</h2>
          <button onClick={() => setOpen(false)} aria-label="কার্ট বন্ধ করুন" className="rounded-full p-2 hover:bg-sand">
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-serif text-2xl">আপনার দেয়াল অপেক্ষা করছে।</p>
            <p className="text-muted">কার্টে এখনো কিছু নেই।</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-primary">
              প্রিন্ট দেখুন
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeShippingBar />
            </div>
            <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4">
                  <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)} className="w-20 shrink-0">
                    <img src={item.image} alt={item.title} className="aspect-[3/4] w-full rounded-md object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-medium leading-tight">{item.title}</p>
                      <p className="font-medium">{money(item.unitPrice * item.quantity, config.currency)}</p>
                    </div>
                    <p className="text-sm text-muted">
                      {item.variantName}
                      {item.frame ? ` · ${FRAME_BN[item.frame] ?? item.frame} ফ্রেম` : " · ফ্রেম ছাড়া"}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button className="p-2" onClick={() => update(item.key, item.quantity - 1)} aria-label="Decrease quantity">
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button className="p-2" onClick={() => update(item.key, item.quantity + 1)} aria-label="Increase quantity">
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(item.key)} className="text-sm text-muted underline-offset-2 hover:underline">
                        বাদ দিন
                      </button>
                    </div>
                  </div>
                </li>
              ))}

              {suggestions.length > 0 && (
                <li className="border-t border-line pt-4">
                  <p className="mb-3 text-sm font-semibold">সাথে নিতে পারেন</p>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestions.map((u) => (
                      <div key={u.id} className="rounded-lg border border-line bg-white p-2">
                        <img src={u.image} alt={u.title} className="aspect-[3/4] w-full rounded object-cover" />
                        <p className="mt-2 truncate text-sm font-medium">{u.title}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm">{money(u.price, config.currency)}</span>
                          <button
                            className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
                            onClick={() =>
                              add({ productId: u.id, slug: u.slug, title: u.title, image: u.image, variantId: u.variantId, variantName: u.variantName, frame: "", unitPrice: u.price }, 1, true)
                            }
                          >
                            + যোগ করুন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              )}
            </ul>

            <div className="border-t border-line bg-white px-5 py-4">
              <div className="flex justify-between text-base">
                <span>সাবটোটাল</span>
                <span className="font-semibold">{money(subtotal, config.currency)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">ডেলিভারি চার্জ ও ডিসকাউন্ট চেকআউটে হিসাব হবে।</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-accent mt-4 w-full">
                <LockIcon className="h-4 w-4" /> চেকআউট করুন
              </Link>
              <WhatsAppOrderButton items={items} className="mt-2 w-full" />
              <p className="mt-3 text-center text-xs text-muted">ক্যাশ অন ডেলিভারি · সারা বাংলাদেশে ডেলিভারি</p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
