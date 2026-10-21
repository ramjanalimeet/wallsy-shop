import Link from "next/link";
import { ProductCard } from "@/components/store/ProductCard";
import { listProducts, type SortKey } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "সব প্রিন্ট" };

const sorts: [SortKey, string][] = [
  ["featured", "জনপ্রিয়"],
  ["newest", "নতুন"],
  ["rating", "সেরা রেটিং"],
  ["price-asc", "দাম: কম থেকে বেশি"],
  ["price-desc", "দাম: বেশি থেকে কম"],
];

type Search = { category?: string; q?: string; sort?: string };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const sort = (sorts.find(([k]) => k === sp.sort)?.[0] ?? "featured") as SortKey;
  const [settings, categories, products] = await Promise.all([
    getSettings(),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    listProducts({ category: sp.category, q: sp.q, sort }),
  ]);
  const active = categories.find((c) => c.slug === sp.category);

  const href = (patch: Partial<Search>) => {
    const params = new URLSearchParams();
    const next = { ...sp, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <div className="container-x py-12">
      <div className="mb-8">
        <h1 className="font-serif text-5xl">{sp.q ? `“${sp.q}” এর ফলাফল` : (active?.name ?? "সব প্রিন্ট")}</h1>
        <p className="mt-3 max-w-xl text-muted">{active?.description ?? "প্রিমিয়াম কোয়ালিটির ওয়াল আর্ট। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।"}</p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mb-8 flex flex-col gap-3 border-y border-line bg-paper/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Link href={href({ category: undefined })} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${!active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
            সব
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href({ category: c.slug })}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${active?.id === c.id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="text-muted">{products.length}টি প্রিন্ট ·</span>
          <span className="text-muted">সাজান:</span>
          <div className="flex gap-1 overflow-x-auto">
            {sorts.map(([k, label]) => (
              <Link key={k} href={href({ sort: k === "featured" ? undefined : k })} className={`shrink-0 rounded-md px-2 py-1 ${sort === k ? "bg-sand font-semibold" : "hover:bg-sand"}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-sand p-16 text-center">
          <p className="font-serif text-2xl">কিছু পাওয়া যায়নি</p>
          <p className="mt-2 text-muted">অন্য কিছু লিখে খুঁজুন অথবা সব প্রিন্ট দেখুন।</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            সব প্রিন্ট দেখুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currency={settings.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
