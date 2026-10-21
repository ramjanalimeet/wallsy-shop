import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([db.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  const m = (c: number) => money(c, settings.currency);

  return (
    <div className="container-x max-w-2xl py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-3xl text-white">✓</div>
        <h1 className="mt-6 font-serif text-4xl">Thank you, {order.name.split(" ")[0]}!</h1>
        <p className="mt-3 text-muted">
          Order <strong className="text-ink">#{order.number}</strong> is confirmed. We&apos;ll contact you at {order.email} with shipping updates.
        </p>
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
                  {i.variant} · {i.frame ? `${i.frame} frame` : "Unframed"}
                </p>
              </div>
              <p className="text-sm font-medium">{m(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{m(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sage">
              <dt>Discount ({order.discountCode})</dt>
              <dd>−{m(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shipping ? m(order.shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between pt-2 text-lg font-semibold">
            <dt>Total (cash on delivery)</dt>
            <dd>{m(order.total)}</dd>
          </div>
        </dl>
        <div className="mt-6 rounded-xl bg-sand p-4 text-sm">
          <p className="font-semibold">Shipping to</p>
          <p className="text-muted">
            {order.name}, {order.address}, {order.city} {order.zip}, {order.country}
          </p>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/shop" className="btn btn-primary">
          Keep browsing
        </Link>
      </div>
    </div>
  );
}
