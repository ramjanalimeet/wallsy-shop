"use client";

import Link from "next/link";
import { useState } from "react";
import { bulkProducts, deleteProduct, duplicateProduct, toggleProduct } from "@/app/admin/actions";
import { money } from "@/lib/format";
import { MoreIcon } from "./icons";

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  image: string;
  collection: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
};

function Toggle({ id, field, children }: { id: string; field: string; children: React.ReactNode }) {
  return (
    <form action={toggleProduct}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      {children}
    </form>
  );
}

export function ProductsTable({ rows, currency }: { rows: ProductRow[]; currency: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const all = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece8e1] bg-white">
      {selected.length > 0 && (
        <form action={bulkProducts} onSubmit={(e) => {
          const op = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
          if (op === "delete" && !confirm(`Delete ${selected.length} product(s)? This can't be undone.`)) return e.preventDefault();
          setTimeout(() => setSelected([]), 0);
        }} className="flex flex-wrap items-center gap-2 border-b border-[#ece8e1] bg-[#faf9f6] px-5 py-3 text-sm">
          <input type="hidden" name="ids" value={JSON.stringify(selected)} />
          <span className="mr-2 font-medium">{selected.length} selected</span>
          {[
            ["publish", "Publish"],
            ["hide", "Hide"],
            ["feature", "Mark featured"],
            ["unfeature", "Remove featured"],
          ].map(([op, label]) => (
            <button key={op} name="op" value={op} className="rounded-lg border border-line bg-white px-3 py-1.5 hover:border-ink">
              {label}
            </button>
          ))}
          <button name="op" value="delete" className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50">
            Delete
          </button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[15px]">
          <thead className="border-b border-[#ece8e1] text-left text-xs font-medium uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="w-14 py-4 pl-6">
                <input type="checkbox" checked={all} onChange={() => setSelected(all ? [] : rows.map((r) => r.id))} className="h-4 w-4 rounded accent-ink" aria-label="Select all" />
              </th>
              <th className="py-4 pr-4">Product</th>
              <th className="py-4 pr-4">Collection</th>
              <th className="py-4 pr-4">Price</th>
              <th className="py-4 pr-4">Stock</th>
              <th className="py-4 pr-4">Status</th>
              <th className="py-4 pr-4">Flags</th>
              <th className="w-12 py-4 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece8e1]">
            {rows.map((p) => (
              <tr key={p.id} className={selected.includes(p.id) ? "bg-[#faf9f6]" : "hover:bg-[#fcfbf9]"}>
                <td className="py-4 pl-6">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 rounded accent-ink" aria-label={`Select ${p.title}`} />
                </td>
                <td className="py-4 pr-4">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4">
                    <img src={p.image} alt="" className="h-[72px] w-[68px] shrink-0 rounded-md object-cover" />
                    <span>
                      <span className="block text-[17px] font-medium hover:underline">{p.title}</span>
                      <span className="text-muted">{p.artist}</span>
                    </span>
                  </Link>
                </td>
                <td className="py-4 pr-4 text-ink/80">{p.collection ?? "—"}</td>
                <td className="whitespace-nowrap py-4 pr-4">
                  {money(p.price, currency)}
                  {p.compareAtPrice && <span className="ml-2 text-muted line-through">{money(p.compareAtPrice, currency)}</span>}
                </td>
                <td className={`py-4 pr-4 ${p.stock === 0 ? "font-medium text-red-600" : p.stock <= 5 ? "font-medium text-amber-600" : ""}`}>{p.stock}</td>
                <td className="py-4 pr-4">
                  <Toggle id={p.id} field="active">
                    <button
                      title="Click to toggle"
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${p.active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${p.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                      {p.active ? "Live" : "Hidden"}
                    </button>
                  </Toggle>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex gap-2">
                    {(
                      [
                        ["featured", "Featured", p.featured],
                        ["bestseller", "Bestseller", p.bestseller],
                      ] as const
                    ).map(([field, label, on]) => (
                      <Toggle key={field} id={p.id} field={field}>
                        <button
                          title="Click to toggle"
                          className={`rounded-full border px-3.5 py-1 text-sm transition ${on ? "border-ink bg-ink text-white" : "border-[#e2ded6] text-ink/70 hover:border-ink"}`}
                        >
                          {label}
                        </button>
                      </Toggle>
                    ))}
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <details className="relative">
                    <summary className="rounded-lg p-1.5 text-ink/70 hover:bg-[#f1efea]" aria-label="More actions">
                      <MoreIcon />
                    </summary>
                    <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-line bg-white p-1 text-sm shadow-lg">
                      <Link href={`/admin/products/${p.id}`} className="block rounded-lg px-3 py-2 hover:bg-[#f6f4f0]">
                        Edit
                      </Link>
                      <Link href={`/product/${p.slug}`} target="_blank" className="block rounded-lg px-3 py-2 hover:bg-[#f6f4f0]">
                        View on store
                      </Link>
                      <form action={duplicateProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f6f4f0]">Duplicate</button>
                      </form>
                      <form action={deleteProduct} onSubmit={(e) => !confirm(`Delete “${p.title}”? This can't be undone.`) && e.preventDefault()}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50">Delete</button>
                      </form>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
