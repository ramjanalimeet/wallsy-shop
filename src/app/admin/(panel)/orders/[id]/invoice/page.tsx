import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { FRAME_BN } from "@/lib/whatsapp";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, order] = await Promise.all([getSettings(), db.order.findUnique({ where: { id }, include: { items: true } })]);
  if (!order) notFound();
  const m = (c: number) => money(c, settings.currency);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      {/* Hide the dashboard chrome when printing. */}
      <style>{`@media print { aside, header, .no-print { display: none !important; } body, .min-h-screen { background: #fff !important; } .lg\\:pl-72 { padding-left: 0 !important; } }`}</style>
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>
      <div className="flex justify-between">
        <div>
          <p className="font-serif text-3xl">
            {settings.storeName}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-1 text-muted">{settings.contactPhone}</p>
          <p className="text-muted">{settings.contactEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold">Invoice #{order.number}</p>
          <p className="text-muted">{order.createdAt.toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "Asia/Dhaka" })}</p>
          <p className="mt-1 font-medium">Cash on delivery</p>
        </div>
      </div>
      <div className="mt-8 rounded-xl bg-[#f8f7f4] p-4">
        <p className="text-xs uppercase tracking-wider text-muted">Deliver to</p>
        <p className="mt-1 font-semibold">{order.name}</p>
        <p>{order.phone}</p>
        <p>
          {order.address}, {order.city}
        </p>
        {order.note && <p className="mt-1 text-muted">Note: {order.note}</p>}
      </div>
      <table className="mt-8 w-full">
        <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {order.items.map((i) => (
            <tr key={i.id}>
              <td className="py-3">
                <p className="font-medium">{i.title}</p>
                <p className="text-muted">
                  {i.variant} · {i.frame ? `${FRAME_BN[i.frame] ?? i.frame} ফ্রেম` : "ফ্রেম ছাড়া"}
                </p>
              </td>
              <td className="py-3 text-center">{i.quantity}</td>
              <td className="py-3 text-right">{m(i.unitPrice)}</td>
              <td className="py-3 text-right">{m(i.unitPrice * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-64 space-y-1">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{m(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>−{m(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>{order.shipping ? m(order.shipping) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-2 text-base font-semibold">
          <dt>Amount to pay</dt>
          <dd>{m(order.total)}</dd>
        </div>
      </dl>
      <p className="mt-10 text-center text-muted">ধন্যবাদ! Thank you for shopping with {settings.storeName}.</p>
    </div>
  );
}
