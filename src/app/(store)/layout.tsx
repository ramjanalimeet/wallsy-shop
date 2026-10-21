import { CartDrawer, type Upsell } from "@/components/store/CartDrawer";
import { CartProvider } from "@/components/store/CartProvider";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { WhatsAppFloat } from "@/components/store/WhatsApp";
import { listProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getSetupStatus } from "@/lib/setup";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // The root layout shows setup instructions instead.
  if (!(await getSetupStatus()).ok) return null;
  const [settings, categories, bestsellers] = await Promise.all([
    getSettings(),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    listProducts({ where: { bestseller: true, stock: { gt: 0 } }, take: 6 }),
  ]);

  const upsells: Upsell[] = bestsellers.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.images[0],
    price: p.variants[0]?.price ?? p.price,
    variantId: p.variants[0]?.id ?? null,
    variantName: p.variants[0]?.name ?? "Standard",
  }));

  return (
    <CartProvider
      config={{
        currency: settings.currency,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingFee: settings.shippingFee,
        shippingFeeOutside: settings.shippingFeeOutside,
        whatsappNumber: settings.whatsappNumber,
        framePrice: settings.framePrice,
      }}
    >
      {settings.announcementEnabled && settings.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">{settings.announcement}</div>
      )}
      <Header storeName={settings.storeName} categories={categories} />
      <WhatsAppFloat />
      <main>{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer upsells={upsells} />
    </CartProvider>
  );
}
