import Link from "next/link";
import { PlusIcon, SearchIcon } from "@/components/admin/icons";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { Empty, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { parseImages } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [settings, products] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { artist: { contains: q, mode: "insensitive" } }] } : undefined,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Products" subtitle={`${products.length} products`}>
        <Link href="/admin/products/new" className="btn btn-primary rounded-xl px-5 py-3">
          <PlusIcon className="h-5 w-5" /> Add product
        </Link>
      </PageHeader>
      <form className="relative mb-6 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60" />
        <input name="q" defaultValue={q} placeholder="Search products..." className="input rounded-xl border-[#e2ded6] py-3.5 pl-12" />
      </form>
      {products.length === 0 ? (
        <Empty>{q ? "No products match your search." : "No products yet."}</Empty>
      ) : (
        <ProductsTable
          currency={settings.currency}
          rows={products.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            artist: p.artist,
            image: parseImages(p.images)[0] ?? "",
            collection: p.category?.name ?? null,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            stock: p.stock,
            active: p.active,
            featured: p.featured,
            bestseller: p.bestseller,
          }))}
        />
      )}
    </>
  );
}
