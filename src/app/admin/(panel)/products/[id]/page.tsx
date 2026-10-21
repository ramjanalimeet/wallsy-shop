import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { parseImages } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const decimal = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2));

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const [settings, categories, product] = await Promise.all([
    getSettings(),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted hover:underline">
        ← Products
      </Link>
      <PageHeader title={product.title} subtitle={created ? "✓ Product created" : undefined}>
        <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-ghost px-4 py-2 text-sm">
          View on store ↗
        </Link>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton message="Delete this product? This can't be undone." className="btn px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            Delete
          </ConfirmButton>
        </form>
      </PageHeader>
      <ProductForm
        currency={settings.currency}
        categories={categories}
        initial={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          artist: product.artist,
          description: product.description,
          price: decimal(product.price),
          compareAtPrice: decimal(product.compareAtPrice),
          images: parseImages(product.images),
          stock: product.stock,
          categoryId: product.categoryId ?? "",
          featured: product.featured,
          bestseller: product.bestseller,
          active: product.active,
          variants: product.variants.map((v) => ({ name: v.name, price: decimal(v.price) })),
        }}
      />
    </>
  );
}
