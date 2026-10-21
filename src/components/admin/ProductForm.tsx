"use client";

import { useState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "./ActionForm";
import { Card, Field } from "./ui";

type Variant = { name: string; price: string };
export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  artist: string;
  description: string;
  price: string;
  compareAtPrice: string;
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
  const [images, setImages] = useState(initial.images.join("\n"));
  const previews = images.split("\n").map((s) => s.trim()).filter(Boolean);

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

        <Card className="space-y-3">
          <Field label="Images" hint="One image URL per line. The first one is the main image. Use /art/… for the bundled artwork or any https:// link.">
            <textarea name="images" rows={3} value={images} onChange={(e) => setImages(e.target.value)} className="input font-mono text-xs" />
          </Field>
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <img key={src + i} src={src} alt="" className="h-24 w-[72px] rounded-md border border-line object-cover" />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sizes</p>
              <p className="text-xs text-muted">Optional. Each size has its own price; the cheapest becomes the “from” price.</p>
            </div>
            <button type="button" onClick={() => setVariants((v) => [...v, { name: "", price: "" }])} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-sand">
              + Add size
            </button>
          </div>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input value={v.name} onChange={(e) => setVariant(i, { name: e.target.value })} placeholder="e.g. A3 · 30×42 cm" className="input" />
                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{currency}</span>
                  <input value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} inputMode="decimal" placeholder="0.00" className="input pl-8" />
                </div>
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
