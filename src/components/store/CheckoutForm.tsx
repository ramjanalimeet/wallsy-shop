"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { placeOrder, previewCheckout } from "@/app/(store)/actions";
import { money } from "@/lib/format";
import { FRAME_BN } from "@/lib/whatsapp";
import { LockIcon, ReturnIcon, ShieldIcon, TruckIcon } from "../icons";
import { useCart } from "./CartProvider";
import { WhatsAppOrderButton } from "./WhatsApp";

type Summary = Awaited<ReturnType<typeof previewCheckout>>;
type Area = "inside" | "outside";

export function CheckoutForm() {
  const { items, config, clear, update } = useCart();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [area, setArea] = useState<Area>("inside");
  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  const lines = useMemo(() => items.map((i) => ({ productId: i.productId, variantId: i.variantId, frame: i.frame, quantity: i.quantity })), [items]);

  useEffect(() => {
    if (!lines.length) return setSummary(null);
    let cancelled = false;
    previewCheckout(lines, appliedCode, area).then((s) => {
      if (cancelled) return;
      setSummary(s);
      // Drop anything that was deleted or unpublished since it was added.
      items.filter((i) => !s.validProductIds.includes(i.productId)).forEach((i) => update(i.key, 0));
    });
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCode, area]);

  const submit = (form: FormData) => {
    setError(null);
    const customer = Object.fromEntries(["name", "phone", "email", "address", "city", "note"].map((k) => [k, String(form.get(k) ?? "")]));
    startPlacing(async () => {
      const res = await placeOrder(lines, { ...customer, deliveryArea: area } as never, summary?.discountCode ?? null);
      if (res.error || !res.id) return setError(res.error ?? "কিছু একটা সমস্যা হয়েছে।");
      clear();
      router.push(`/order/${res.id}`);
    });
  };

  if (!items.length)
    return (
      <div className="rounded-2xl bg-sand p-16 text-center">
        <p className="font-serif text-2xl">আপনার কার্ট খালি</p>
        <Link href="/shop" className="btn btn-primary mt-6">
          কেনাকাটা চালিয়ে যান
        </Link>
      </div>
    );

  const areas: [Area, string, number][] = [
    ["inside", "ঢাকার ভিতরে", config.shippingFee],
    ["outside", "ঢাকার বাইরে", config.shippingFeeOutside],
  ];

  return (
    <form action={submit} className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-8">
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/5 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm">
            <strong>ফর্ম পূরণ করতে চান না?</strong> এক ক্লিকে WhatsApp-এ অর্ডার পাঠিয়ে দিন, আমরা কনফার্ম করে নেব।
          </p>
          <WhatsAppOrderButton items={items} className="shrink-0 px-5 py-2.5 text-sm" />
        </div>

        <section>
          <h2 className="mb-4 text-lg font-semibold">১. আপনার তথ্য</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" required autoComplete="name" placeholder="আপনার নাম *" className="input sm:col-span-2" />
            <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="মোবাইল নম্বর * (01XXXXXXXXX)" className="input" />
            <input name="email" type="email" autoComplete="email" placeholder="ইমেইল (ঐচ্ছিক)" className="input" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">২. ডেলিভারি ঠিকানা</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea name="address" required rows={2} autoComplete="street-address" placeholder="সম্পূর্ণ ঠিকানা * (বাসা, রোড, এলাকা, থানা)" className="input sm:col-span-2" />
            <input name="city" required autoComplete="address-level2" placeholder="জেলা *" className="input sm:col-span-2" />
            <textarea name="note" rows={2} placeholder="বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)" className="input sm:col-span-2" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {areas.map(([value, label, fee]) => (
              <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white p-4 ${area === value ? "border-ink" : "border-line"}`}>
                <input type="radio" name="deliveryArea" value={value} checked={area === value} onChange={() => setArea(value)} className="accent-ink" />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="text-sm text-muted">{money(fee, config.currency)}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">৩. পেমেন্ট</h2>
          <label className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-4">
            <input type="radio" checked readOnly className="accent-ink" />
            <span className="flex-1">
              <span className="block font-medium">ক্যাশ অন ডেলিভারি</span>
              <span className="text-sm text-muted">পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।</span>
            </span>
            <span className="text-2xl">💵</span>
          </label>
        </section>

        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted">
          <div className="rounded-xl bg-white p-3">
            <LockIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> নিরাপদ অর্ডার
          </div>
          <div className="rounded-xl bg-white p-3">
            <ReturnIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> ৭ দিনের রিটার্ন
          </div>
          <div className="rounded-xl bg-white p-3">
            <ShieldIcon className="mx-auto mb-1 h-5 w-5 text-sage" /> ভাঙা পৌঁছালে ফ্রি রিপ্লেস
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold">অর্ডার সামারি</h2>
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
                  {i.variantName} · {i.frame ? `${FRAME_BN[i.frame] ?? i.frame} ফ্রেম` : "ফ্রেম ছাড়া"}
                </p>
              </div>
              <p className="text-sm font-medium">{money(i.unitPrice * i.quantity, config.currency)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ডিসকাউন্ট কোড" className="input" />
          <button type="button" onClick={() => setAppliedCode(code || null)} className="btn btn-ghost shrink-0 px-4 py-2">
            প্রয়োগ
          </button>
        </div>
        {summary?.discountError && <p className="mt-2 text-sm text-red-600">{summary.discountError}</p>}
        {summary?.discountCode && <p className="mt-2 text-sm text-sage">✓ {summary.discountCode} কোড যুক্ত হয়েছে</p>}

        <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt>সাবটোটাল</dt>
            <dd>{summary ? money(summary.subtotal, config.currency) : "…"}</dd>
          </div>
          {!!summary?.discount && (
            <div className="flex justify-between text-sage">
              <dt>ডিসকাউন্ট</dt>
              <dd>−{money(summary.discount, config.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5">
              <TruckIcon className="h-4 w-4" /> ডেলিভারি চার্জ
            </dt>
            <dd>{summary ? summary.shipping === 0 ? <span className="font-semibold text-sage">ফ্রি</span> : money(summary.shipping, config.currency) : "…"}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
            <dt>সর্বমোট</dt>
            <dd>{summary ? money(summary.total, config.currency) : "…"}</dd>
          </div>
        </dl>
        {summary && summary.shipping > 0 && (
          <p className="mt-2 text-xs text-muted">আর {money(config.freeShippingThreshold - summary.subtotal, config.currency)} অর্ডার করলেই ডেলিভারি ফ্রি।</p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={placing || !summary} className="btn btn-accent mt-5 w-full py-4 text-base">
          <LockIcon className="h-4 w-4" /> {placing ? "অর্ডার হচ্ছে…" : `অর্ডার কনফার্ম করুন${summary ? ` · ${money(summary.total, config.currency)}` : ""}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">কোনো অ্যাকাউন্ট লাগবে না। অর্ডারের পর আমরা ফোনে কনফার্ম করব।</p>
      </aside>
    </form>
  );
}
