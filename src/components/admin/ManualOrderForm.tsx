"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createManualOrder } from "@/app/admin/actions";
import { money } from "@/lib/format";
import { ORDER_SOURCES, SOURCE_LABELS } from "@/lib/order-sources";
import { Card, Field } from "./ui";

export type PickProduct = { id: string; title: string; image: string; price: number; stock: number; variants: { id: string; name: string; price: number }[] };
type Line = { key: number; productId: string; variantId: string | null; frame: string; quantity: string; unitPrice: string };

const FRAMES = [
  ["", "No frame"],
  ["Black", "Black frame"],
  ["White", "White frame"],
  ["Oak", "Oak frame"],
];

export function ManualOrderForm({
  products,
  currency,
  framePrice,
  fees,
}: {
  products: PickProduct[];
  currency: string;
  framePrice: number;
  fees: { inside: number; outside: number; freeOver: number };
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [area, setArea] = useState<"inside" | "outside">("inside");
  const [shipping, setShipping] = useState<string | null>(null);
  const [discount, setDiscount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [search, setSearch] = useState("");

  const listPrice = (l: Pick<Line, "productId" | "variantId" | "frame">) => {
    const p = products.find((x) => x.id === l.productId);
    const v = p?.variants.find((x) => x.id === l.variantId);
    return ((v?.price ?? p?.price ?? 0) + (l.frame ? framePrice : 0)) / 100;
  };
  const addProduct = (p: PickProduct) => {
    const line = { key: Date.now(), productId: p.id, variantId: p.variants[0]?.id ?? null, frame: "", quantity: "1", unitPrice: "" };
    setLines((ls) => [...ls, { ...line, unitPrice: String(listPrice(line)) }]);
    setSearch("");
  };
  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) =>
      ls.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        // Size or frame changed: refresh the price from the price list.
        if ("variantId" in patch || "frame" in patch) next.unitPrice = String(listPrice(next));
        return next;
      })
    );

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.unitPrice) || 0) * (parseInt(l.quantity) || 0), 0);
  const autoShipping = (subtotal * 100 >= fees.freeOver ? 0 : area === "outside" ? fees.outside : fees.inside) / 100;
  const ship = shipping ?? String(autoShipping);
  const total = subtotal - (parseFloat(discount) || 0) + (parseFloat(ship) || 0);
  const m = (taka: number) => money(Math.round(taka * 100), currency);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 8) : [];
  }, [search, products]);

  const submit = (form: FormData) => {
    setError(null);
    const f = (k: string) => String(form.get(k) ?? "");
    startSaving(async () => {
      const res = await createManualOrder({
        customer: { name: f("name"), phone: f("phone"), email: f("email"), address: f("address"), city: f("city"), deliveryArea: area, note: f("note") },
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, frame: l.frame, quantity: parseInt(l.quantity) || 0, unitPrice: parseFloat(l.unitPrice) || 0 })),
        shipping: parseFloat(ship) || 0,
        discount: parseFloat(discount) || 0,
        source: f("source"),
        status: f("status"),
        adminNote: f("adminNote"),
      });
      if (res.error || !res.id) return setError(res.error ?? "Couldn't save the order.");
      router.push(`/admin/orders/${res.id}?created=1`);
    });
  };

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Card>
          <p className="mb-3 font-semibold">Products</p>
          <div className="relative">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a product to add…" className="input" />
            {matches.length > 0 && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-80 overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg">
                {matches.map((p) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[#f6f4f0]">
                    <img src={p.image} alt="" className="h-12 w-10 rounded object-cover" />
                    <span className="flex-1">
                      <span className="block font-medium">{p.title}</span>
                      <span className="text-sm text-muted">
                        {money(p.price, currency)} · {p.stock} in stock
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Search above and click a product to add it.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {lines.map((l) => {
                const p = products.find((x) => x.id === l.productId)!;
                return (
                  <li key={l.key} className="flex flex-wrap items-center gap-3 py-3">
                    <img src={p.image} alt="" className="h-14 w-11 rounded object-cover" />
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{p.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {p.variants.length > 0 && (
                          <select value={l.variantId ?? ""} onChange={(e) => update(l.key, { variantId: e.target.value })} className="input w-auto py-1.5 text-sm">
                            {p.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <select value={l.frame} onChange={(e) => update(l.key, { frame: e.target.value })} className="input w-auto py-1.5 text-sm">
                          {FRAMES.map(([v, label]) => (
                            <option key={v} value={v}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <label className="text-xs text-muted">
                      Qty
                      <input value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} inputMode="numeric" className="input mt-0.5 w-16 py-1.5" />
                    </label>
                    <label className="text-xs text-muted">
                      Price ({currency})
                      <input value={l.unitPrice} onChange={(e) => update(l.key, { unitPrice: e.target.value })} inputMode="decimal" className="input mt-0.5 w-24 py-1.5" />
                    </label>
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="self-end pb-2 text-sm text-muted hover:text-red-600">
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="grid gap-3 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Customer</p>
          <Field label="Name *">
            <input name="name" required className="input" />
          </Field>
          <Field label="Phone *">
            <input name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" className="input" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input name="address" className="input" />
          </Field>
          <Field label="District">
            <input name="city" className="input" />
          </Field>
          <Field label="Email (optional)">
            <input name="email" type="email" className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            {(
              [
                ["inside", "Inside Dhaka"],
                ["outside", "Outside Dhaka"],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 bg-white p-3 text-sm ${area === v ? "border-ink" : "border-line"}`}>
                <input type="radio" checked={area === v} onChange={() => (setArea(v), setShipping(null))} className="accent-ink" /> {label}
              </label>
            ))}
          </div>
          <Field label="Customer's note" className="sm:col-span-2">
            <input name="note" className="input" />
          </Field>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-3">
          <p className="font-semibold">Order</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Came from">
              <select name="source" defaultValue="whatsapp" className="input">
                {ORDER_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue="processing" className="input capitalize">
                {["pending", "processing", "shipped", "delivered"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Private note (only you see this)">
            <textarea name="adminNote" rows={2} className="input" />
          </Field>
          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{m(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Discount ({currency})</dt>
              <dd>
                <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" placeholder="0" className="input w-24 py-1 text-right" />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt>Delivery ({currency})</dt>
              <dd>
                <input value={ship} onChange={(e) => setShipping(e.target.value)} inputMode="decimal" className="input w-24 py-1 text-right" />
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total to collect</dt>
              <dd>{m(total)}</dd>
            </div>
          </dl>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={saving || lines.length === 0} className="btn btn-primary w-full rounded-xl">
            {saving ? "Saving…" : "Create order"}
          </button>
          <p className="text-xs text-muted">Stock is reduced, and the order appears in Orders, Customers and Finance like a website order.</p>
        </Card>
      </div>
    </form>
  );
}
