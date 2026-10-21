import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const flow = ["pending", "processing", "shipped", "delivered"];

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, order] = await Promise.all([getSettings(), db.order.findUnique({ where: { id }, include: { items: true } })]);
  if (!order) notFound();
  const m = (c: number) => money(c, settings.currency);
  const step = flow.indexOf(order.status);
  const next = step >= 0 && step < flow.length - 1 ? flow[step + 1] : null;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">
        ← Orders
      </Link>
      <PageHeader title={`Order #${order.number}`} subtitle={order.createdAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}>
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-5 flex items-center gap-2">
              {flow.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-1.5">
                  <div className={`h-1.5 rounded-full ${order.status !== "cancelled" && i <= step ? "bg-sage" : "bg-line"}`} />
                  <span className="text-xs capitalize text-muted">{s}</span>
                </div>
              ))}
            </div>
            <form action={updateOrderStatus} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={order.id} />
              {next && (
                <button name="status" value={next} className="btn btn-primary px-4 py-2 text-sm capitalize">
                  Mark as {next}
                </button>
              )}
              <select name="status" defaultValue={order.status} className="input w-auto py-2 text-sm">
                {[...flow, "cancelled"].map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost px-4 py-2 text-sm">Update</button>
            </form>
            <p className="mt-2 text-xs text-muted">Cancelling an order puts its items back in stock.</p>
          </Card>

          <Card>
            <p className="mb-3 font-semibold">Items</p>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 text-sm">
                  {i.image && <img src={i.image} alt="" className="h-14 w-10 rounded object-cover" />}
                  <div className="flex-1">
                    <p className="font-medium">{i.title}</p>
                    <p className="text-muted">
                      {i.variant} · {i.frame ? `${i.frame} frame` : "Unframed"}
                    </p>
                  </div>
                  <p className="text-muted">
                    {m(i.unitPrice)} × {i.quantity}
                  </p>
                  <p className="w-20 text-right font-medium">{m(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{m(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount ({order.discountCode})</dt>
                  <dd>−{m(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{order.shipping ? m(order.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total to collect</dt>
                <dd>{m(order.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="text-sm">
            <p className="mb-2 font-semibold">Customer</p>
            <p>{order.name}</p>
            <a href={`mailto:${order.email}`} className="block text-accent hover:underline">
              {order.email}
            </a>
            {order.phone && (
              <a href={`tel:${order.phone}`} className="block text-accent hover:underline">
                {order.phone}
              </a>
            )}
          </Card>
          <Card className="text-sm">
            <p className="mb-2 font-semibold">Ship to</p>
            <p>{order.name}</p>
            <p>{order.address}</p>
            <p>
              {order.city} {order.zip}
            </p>
            <p>{order.country}</p>
          </Card>
          {order.note && (
            <Card className="text-sm">
              <p className="mb-2 font-semibold">Customer note</p>
              <p className="whitespace-pre-line text-muted">{order.note}</p>
            </Card>
          )}
          <Card className="text-sm">
            <p className="mb-2 font-semibold">Payment</p>
            <p>Cash on delivery</p>
          </Card>
        </div>
      </div>
    </>
  );
}
