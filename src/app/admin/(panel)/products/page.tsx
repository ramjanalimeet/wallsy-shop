import Link from "next/link";
import { toggleProduct } from "@/app/admin/actions";
import { Empty, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { money, parseImages } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [settings, products] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { artist: { contains: q, mode: "insensitive" } }] } : undefined,
      include: { category: true, _count: { select: { orderItems: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Products" subtitle={`${products.length} products`}>
        <Link href="/admin/products/new" className="btn btn-primary px-4 py-2 text-sm">
          + Add product
        </Link>
      </PageHeader>
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search products…" className="input max-w-sm" />
      </form>
      {products.length === 0 ? (
        <Empty>No products yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Collection</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-sand/40">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <img src={parseImages(p.images)[0]} alt="" className="h-12 w-9 rounded object-cover" />
                      <span>
                        <span className="block font-medium hover:underline">{p.title}</span>
                        <span className="text-xs text-muted">{p.artist}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{p.category?.name ?? "—"}</td>
                  <td className="p-3">
                    {money(p.price, settings.currency)}
                    {p.compareAtPrice && <span className="ml-1 text-xs text-muted line-through">{money(p.compareAtPrice, settings.currency)}</span>}
                  </td>
                  <td className={`p-3 font-medium ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : ""}`}>{p.stock}</td>
                  <td className="p-3">
                    <form action={toggleProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="active" />
                      <button className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`} title="Click to toggle">
                        {p.active ? "Live" : "Hidden"}
                      </button>
                    </form>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {(["featured", "bestseller"] as const).map((f) => (
                        <form key={f} action={toggleProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="field" value={f} />
                          <button className={`rounded-full border px-2 py-0.5 text-xs capitalize ${p[f] ? "border-ink bg-ink text-white" : "border-line text-muted"}`} title="Click to toggle">
                            {f}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
