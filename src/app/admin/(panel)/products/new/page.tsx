import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export default async function NewProductPage() {
  const [settings, categories] = await Promise.all([getSettings(), db.category.findMany({ orderBy: { sortOrder: "asc" } })]);
  return (
    <>
      <Link href="/admin/products" className="text-sm text-muted hover:underline">
        ← Products
      </Link>
      <PageHeader title="Add product" />
      <ProductForm
        currency={settings.currency}
        categories={categories}
        initial={{
          title: "",
          slug: "",
          artist: "",
          description: "",
          price: "",
          compareAtPrice: "",
          images: [],
          stock: 10,
          categoryId: "",
          featured: false,
          bestseller: false,
          active: true,
          variants: [
            { name: "A4 · 21×30 cm", price: "" },
            { name: "A3 · 30×42 cm", price: "" },
            { name: "50×70 cm", price: "" },
          ],
        }}
      />
    </>
  );
}
