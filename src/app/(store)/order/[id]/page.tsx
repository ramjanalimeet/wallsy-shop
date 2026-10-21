import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/store/WhatsApp";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { FRAME_BN, whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "অর্ডার কনফার্ম হয়েছে", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const m = (c: number) => money(c, settings.currency);
  const confirmText = `আসসালামু আলাইকুম, আমার অর্ডার #${order.number} কনফার্ম করতে চাই।\nনাম: ${order.name}\nমোবাইল: ${order.phone}\nমোট: ${m(order.total)}`;

  return (
    <div className="container-x max-w-2xl py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-3xl text-white">✓</div>
        <h1 className="mt-6 font-serif text-4xl">ধন্যবাদ, {order.name.split(" ")[0]}!</h1>
        <p className="mt-3 text-muted">
          আপনার অর্ডার <strong className="text-ink">#{order.number}</strong> সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আমরা {order.phone} নম্বরে কল করে অর্ডার কনফার্ম করব।
        </p>
        {settings.whatsappNumber && (
          <a href={whatsappLink(settings.whatsappNumber, confirmText)} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
            <WhatsAppIcon /> WhatsApp-এ দ্রুত কনফার্ম করুন
          </a>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6">
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              {i.image && <img src={i.image} alt="" className="h-16 w-12 rounded object-cover" />}
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  {i.title} × {i.quantity}
                </p>
                <p className="text-muted">
                  {i.variant} · {i.frame ? `${FRAME_BN[i.frame] ?? i.frame} ফ্রেম` : "ফ্রেম ছাড়া"}
                </p>
              </div>
              <p className="text-sm font-medium">{m(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>সাবটোটাল</dt>
            <dd>{m(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sage">
              <dt>ডিসকাউন্ট ({order.discountCode})</dt>
              <dd>−{m(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>ডেলিভারি চার্জ ({order.deliveryArea === "outside" ? "ঢাকার বাইরে" : "ঢাকার ভিতরে"})</dt>
            <dd>{order.shipping ? m(order.shipping) : "ফ্রি"}</dd>
          </div>
          <div className="flex justify-between pt-2 text-lg font-semibold">
            <dt>সর্বমোট (ক্যাশ অন ডেলিভারি)</dt>
            <dd>{m(order.total)}</dd>
          </div>
        </dl>
        <div className="mt-6 rounded-xl bg-sand p-4 text-sm">
          <p className="font-semibold">ডেলিভারি ঠিকানা</p>
          <p className="text-muted">
            {order.name}, {order.address}, {order.city}
          </p>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/shop" className="btn btn-primary">
          আরও দেখুন
        </Link>
      </div>
    </div>
  );
}
