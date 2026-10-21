import Link from "next/link";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { parseImages } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function NewOrderPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    db.product.findMany({ orderBy: { title: "asc" }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
  ]);
  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">
        ← Orders
      </Link>
      <PageHeader title="New order" subtitle="Add an order you received on WhatsApp, by phone or on social media." />
      <ManualOrderForm
        currency={settings.currency}
        framePrice={settings.framePrice}
        fees={{ inside: settings.shippingFee, outside: settings.shippingFeeOutside, freeOver: settings.freeShippingThreshold }}
        products={products.map((p) => ({
          id: p.id,
          title: p.title,
          image: parseImages(p.images)[0] ?? "",
          price: p.price,
          stock: p.stock,
          variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
        }))}
      />
    </>
  );
}
