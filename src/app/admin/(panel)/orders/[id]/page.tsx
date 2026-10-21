import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import { OrderDetailsForm } from "@/components/admin/OrderDetailsForm";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { SOURCE_LABELS } from "@/lib/order-sources";
import { whatsappLink } from "@/lib/whatsapp";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const flow = ["pending", "processing", "shipped", "delivered"];

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const [settings, order] = await Promise.all([getSettings(), db.order.findUnique({ where: { id }, include: { items: true } })]);
  if (!order) notFound();
  const m = (c: number) => money(c, settings.currency);
  const step = flow.indexOf(order.status);
  // Only shown once costs are entered for the products in this order.
  const cost = order.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const profit = cost > 0 ? { cost, value: order.subtotal - order.discount - cost } : null;
  const waNumber = order.phone ? `88${order.phone.replace(/^\+?88/, "")}` : "";
  const statusText: Record<string, string> = {
    pending: "আমরা আপনার অর্ডারটি পেয়েছি এবং শীঘ্রই কনফার্ম করব।",
    processing: "আপনার অর্ডারটি কনফার্ম হয়েছে এবং প্রস্তুত করা হচ্ছে।",
    shipped: `আপনার অর্ডারটি কুরিয়ারে পাঠানো হয়েছে${order.courier ? ` (${order.courier})` : ""}।${order.trackingCode ? ` ট্র্যাকিং নম্বর: ${order.trackingCode}` : ""}`,
    delivered: "আপনার অর্ডারটি ডেলিভারি হয়েছে। কেনাকাটার জন্য ধন্যবাদ!",
    cancelled: "আপনার অর্ডারটি বাতিল করা হয়েছে।",
  };
  const statusMessage = `আসসালামু আলাইকুম ${order.name}, ${settings.storeName} থেকে বলছি। অর্ডার #${order.number}: ${statusText[order.status] ?? ""} মোট: ${m(order.total)} (ক্যাশ অন ডেলিভারি)।`;
  const next = step >= 0 && step < flow.length - 1 ? flow[step + 1] : null;

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">
        ← Orders
      </Link>
      {created && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✓ Order created and stock updated.</p>}
      <PageHeader title={`Order #${order.number}`} subtitle={order.createdAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Dhaka" })}>
        <StatusBadge status={order.status} />
        <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="btn btn-ghost rounded-xl px-4 py-2 text-sm">
          Print invoice
        </Link>
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
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Customer</p>
              <span className="rounded-full bg-[#f1efea] px-2.5 py-0.5 text-xs">via {SOURCE_LABELS[order.source] ?? order.source}</span>
            </div>
            <p className="font-medium">{order.name}</p>
            {order.phone && (
              <a href={`tel:${order.phone}`} className="block text-accent hover:underline">
                📞 {order.phone}
              </a>
            )}
            {order.email && (
              <a href={`mailto:${order.email}`} className="block text-accent hover:underline">
                {order.email}
              </a>
            )}
            <p className="mt-2 text-muted">
              {order.address}, {order.city} · {order.deliveryArea === "outside" ? "Outside Dhaka" : "Inside Dhaka"}
            </p>
            {order.note && <p className="mt-2 rounded-lg bg-sand p-2">“{order.note}”</p>}
            {waNumber && (
              <a
                href={whatsappLink(waNumber, statusMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-3 w-full rounded-xl bg-[#25D366] py-2.5 text-white hover:bg-[#1ebe5b]"
              >
                WhatsApp the customer an update
              </a>
            )}
          </Card>
          <Card>
            <p className="mb-3 font-semibold">Delivery & notes</p>
            <OrderDetailsForm
              order={{
                id: order.id,
                name: order.name,
                phone: order.phone,
                email: order.email,
                address: order.address,
                city: order.city,
                deliveryArea: order.deliveryArea,
                courier: order.courier,
                trackingCode: order.trackingCode,
                adminNote: order.adminNote,
              }}
            />
          </Card>
          {profit && (
            <Card className="text-sm">
              <p className="mb-2 font-semibold">Profit on this order</p>
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted">Products sold (after discount)</dt>
                  <dd>{m(order.subtotal - order.discount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Your product cost</dt>
                  <dd>−{m(profit.cost)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-1 font-semibold">
                  <dt>Gross profit</dt>
                  <dd className={profit.value >= 0 ? "text-emerald-700" : "text-red-600"}>{m(profit.value)}</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
