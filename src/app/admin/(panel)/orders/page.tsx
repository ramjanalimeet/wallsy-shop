import Link from "next/link";
import { Empty, PageHeader, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const tabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q } = await searchParams;
  const where = {
    ...(status !== "all" ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, ...(Number(q) ? [{ number: Number(q) }] : [])] } : {}),
  };
  const [settings, orders, counts] = await Promise.all([
    getSettings(),
    db.order.findMany({ where, include: { _count: { select: { items: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => (s === "all" ? counts.reduce((a, c) => a + c._count, 0) : (counts.find((c) => c.status === s)?._count ?? 0));

  return (
    <>
      <PageHeader title="Orders" subtitle="Cash-on-delivery orders. Update status as you pack, ship and deliver." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/admin/orders" : `/admin/orders?status=${t}`}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${status === t ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
          >
            {t} <span className="opacity-60">{count(t)}</span>
          </Link>
        ))}
        <form className="ml-auto">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search name, email, #" className="input py-1.5" />
        </form>
      </div>
      {orders.length === 0 ? (
        <Empty>No orders here yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-sand/40">
                  <td className="p-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                      #{o.number}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{formatDate(o.createdAt)}</td>
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`}>
                      <span className="block">{o.name}</span>
                      <span className="text-xs text-muted">{o.email}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{o._count.items}</td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3 text-right font-medium">{money(o.total, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
