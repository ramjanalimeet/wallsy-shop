"use client";

import { useState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "./ActionForm";
import { GalleryField } from "./ImageUpload";
import { Card, Field } from "./ui";

type Variant = { name: string; price: string; cost: string };
export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  artist: string;
  description: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  images: string[];
  stock: number;
  categoryId: string;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
  variants: Variant[];
};

export function ProductForm({ initial, categories, currency }: { initial: ProductFormValues; categories: { id: string; name: string }[]; currency: string }) {
  const [variants, setVariants] = useState<Variant[]>(initial.variants);
  const num = (v: string) => parseFloat(v) || 0;
  const margin = (price: string, cost: string) => (num(price) > 0 && num(cost) > 0 ? Math.round(((num(price) - num(cost)) / num(price)) * 100) : null);

  const setVariant = (i: number, patch: Partial<Variant>) => setVariants((v) => v.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <ActionForm action={saveProduct} success="Product saved" className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <div className="space-y-4">
        <Card className="space-y-4">
          <Field label="Title">
            <input name="title" required defaultValue={initial.title} className="input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist">
              <input name="artist" defaultValue={initial.artist} className="input" />
            </Field>
            <Field label="URL handle" hint="Leave blank to generate from the title">
              <input name="slug" defaultValue={initial.slug} className="input" />
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" rows={6} defaultValue={initial.description} className="input" />
          </Field>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-medium">Photos</p>
          <GalleryField name="images" initial={initial.images} />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sizes</p>
              <p className="text-xs text-muted">Each size has its own selling price. Add what it costs you to see your profit.</p>
            </div>
            <button type="button" onClick={() => setVariants((v) => [...v, { name: "", price: "", cost: "" }])} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-sand">
              + Add size
            </button>
          </div>
          {variants.length > 0 && (
            <div className="mb-1 grid grid-cols-[1fr_7rem_7rem_3.5rem_1.5rem] gap-2 text-xs text-muted">
              <span>Size</span>
              <span>Selling price</span>
              <span>Your cost</span>
              <span>Margin</span>
              <span />
            </div>
          )}
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_7rem_3.5rem_1.5rem] items-center gap-2">
                <input value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} placeholder="e.g. A3 · 30×42 cm" className="input" />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{currency}</span>
                  <input value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} inputMode="decimal" placeholder="0" className="input pl-7" />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{currency}</span>
                  <input value={v.cost} onChange={(e) => setVariant(i, { cost: e.target.value })} inputMode="decimal" placeholder="0" className="input pl-7" />
                </div>
                <span className={`text-sm font-medium ${(margin(v.price, v.cost) ?? 0) < 0 ? "text-red-600" : "text-emerald-700"}`}>{margin(v.price, v.cost) ?? "—"}{margin(v.price, v.cost) !== null && "%"}</span>
                <button type="button" onClick={() => setVariants((all) => all.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-red-600" aria-label="Remove size">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-3">
          <p className="text-sm font-medium">Visibility</p>
          {(
            [
              ["active", "Published on the store", initial.active],
              ["featured", "Featured", initial.featured],
              ["bestseller", "Bestseller badge", initial.bestseller],
            ] as const
          ).map(([name, label, checked]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-ink" /> {label}
            </label>
          ))}
        </Card>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Price (${currency})`} hint={variants.length ? "Used if no sizes" : undefined}>
              <input name="price" required inputMode="decimal" defaultValue={initial.price} className="input" />
            </Field>
            <Field label={`Compare-at (${currency})`} hint="Shows a sale badge">
              <input name="compareAtPrice" inputMode="decimal" defaultValue={initial.compareAtPrice} className="input" />
            </Field>
          </div>
          <Field label={`Your cost per print (${currency})`} hint={variants.length ? "Used if no sizes" : "What one print costs you, for profit tracking"}>
            <input name="costPrice" inputMode="decimal" defaultValue={initial.costPrice} className="input" />
          </Field>
          <Field label="Stock" hint="Shows “Only X left” at 10 or fewer">
            <input name="stock" type="number" min={0} defaultValue={initial.stock} className="input" />
          </Field>
          <Field label="Collection">
            <select name="categoryId" defaultValue={initial.categoryId} className="input">
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Card>
        <SubmitButton className="btn btn-primary w-full">Save product</SubmitButton>
      </div>
    </ActionForm>
  );
}
