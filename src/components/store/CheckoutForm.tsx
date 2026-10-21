"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { placeOrder, previewCheckout } from "@/app/(store)/actions";
import { money } from "@/lib/format";
import { LockIcon, ReturnIcon, ShieldIcon, TruckIcon } from "../icons";
import { useCart } from "./CartProvider";

type Summary = Awaited<ReturnType<typeof previewCheckout>>;

export function CheckoutForm() {
  const { items, config, clear, update } = useCart();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  const lines = useMemo(() => items.map((i) => ({ productId: i.productId, variantId: i.variantId, frame: i.frame, quantity: i.quantity })), [items]);

  useEffect(() => {
    if (!lines.length) return setSummary(null);
    let cancelled = false;
    previewCheckout(lines, appliedCode).then((s) => {
      if (cancelled) return;
      setSummary(s);
      // Drop anything that was deleted or unpublished since it was added.
      items.filter((i) => !s.validProductIds.includes(i.productId)).forEach((i) => update(i.key, 0));
    });
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCode]);

  const submit = (form: FormData) => {
    setError(null);
    const customer = Object.fromEntries(["email", "name", "phone", "address", "city", "zip", "country", "note"].map((k) => [k, String(form.get(k) ?? "")]));
    startPlacing(async () => {
      const res = await placeOrder(lines, customer as never, summary?.discountCode ?? null);
      if (res.error || !res.id) return setError(res.error ?? "Something went wrong.");
      clear();
      router.push(`/order/${res.id}`);
    });
  };

  if (!items.length)
    return (
      <div className="rounded-2xl bg-sand p-16 text-center">
        <p className="font-serif text-2xl">Your cart is empty</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          Continue shopping
        </Link>
      </div>
    );

  return (
    <form action={submit} className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">1. Contact</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="email" type="email" required autoComplete="email" placeholder="Email for order updates" className="input sm:col-span-2" />
            <input name="phone" type="tel" autoComplete="tel" placeholder="Phone (for the courier)" className="input sm:col-span-2" />
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">2. Shipping address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required autoComplete="name" placeholder="Full name" className="input sm:col-span-2" />
            <input name="address" required autoComplete="street-address" placeholder="Address" className="input sm:col-span-2" />
            <input name="city" required autoComplete="address-level2" placeholder="City" className="input" />
            <input name="zip" autoComplete="postal-code" placeholder="Postal code" className="input" />
            <input name="country" required autoComplete="country-name" placeholder="Country" className="input sm:col-span-2" />
            <textarea name="note" rows={2} placeholder="Delivery note (optional)" className="input sm:col-span-2" />
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold">3. Payment</h2>
          <label className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-4">
            <input type="radio" checked readOnly className="accent-ink" />
            <span className="flex-1">
              <span className="block font-medium">Cash on delivery</span>
              <span className="text-sm text-muted">Pay the courier when your order arrives. No card needed.</span>
            </span>
            <span className="text-2xl">💵</span>
          </label>
        </section>
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted">
          <div className="rounded-xl bg-white p-3">
            <LockIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> Secure & encrypted
          </div>
          <div className="rounded-xl bg-white p-3">
            <ReturnIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> 30-day returns
          </div>
          <div className="rounded-xl bg-white p-3">
            <ShieldIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> Damage-free guarantee
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="flex gap-3">
              <div className="relative w-14 shrink-0">
                <img src={i.image} alt="" className="aspect-[3/4] w-full rounded object-cover" />
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-white">{i.quantity}</span>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.title}</p>
                <p className="text-muted">
                  {i.variantName} · {i.frame || "Unframed"}
                </p>
              </div>
              <p className="text-sm font-medium">{money(i.unitPrice * i.quantity, config.currency)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code" className="input" />
          <button type="button" onClick={() => setAppliedCode(code || null)} className="btn btn-ghost shrink-0 px-4 py-2">
            Apply
          </button>
        </div>
        {summary?.discountError && <p className="mt-2 text-sm text-red-600">{summary.discountError}</p>}
        {summary?.discountCode && <p className="mt-2 text-sm text-sage">✓ {summary.discountCode} applied</p>}

        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{summary ? money(summary.subtotal, config.currency) : "…"}</dd>
          </div>
          {!!summary?.discount && (
            <div className="flex justify-between text-sage">
              <dt>Discount</dt>
              <dd>−{money(summary.discount, config.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5">
              <TruckIcon className="h-4 w-4" /> Shipping
            </dt>
            <dd>{summary ? (summary.shipping === 0 ? <span className="font-semibold text-sage">FREE</span> : money(summary.shipping, config.currency)) : "…"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{summary ? money(summary.total, config.currency) : "…"}</dd>
          </div>
        </dl>
        {summary && summary.shipping > 0 && (
          <p className="mt-2 text-xs text-muted">Add {money(config.freeShippingThreshold - summary.subtotal, config.currency)} more for free shipping.</p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={placing || !summary} className="btn btn-accent mt-5 w-full py-4 text-base">
          <LockIcon className="h-4 w-4" /> {placing ? "Placing order…" : `Place order${summary ? ` · ${money(summary.total, config.currency)}` : ""}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">No account needed — checkout as a guest in under a minute.</p>
      </aside>
    </form>
  );
}
