import { deleteSubscriber } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function CustomersPage() {
  const [settings, customers, subscribers] = await Promise.all([
    getSettings(),
    db.order.groupBy({
      by: ["phone"],
      where: { status: { not: "cancelled" } },
      _sum: { total: true },
      _count: true,
      _max: { createdAt: true, name: true },
      orderBy: { _sum: { total: "desc" } },
      take: 200,
    }),
    db.subscriber.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} buyers · ${subscribers.length} newsletter subscribers`} />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-[#ece8e1] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#ece8e1] text-left text-xs font-medium uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Last order</th>
                <th className="p-3 text-right">Total spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.phone}>
                  <td className="p-3">
                    <span className="block font-medium">{c._max.name}</span>
                    <a href={`tel:${c.phone}`} className="text-xs text-muted hover:underline">
                      {c.phone || "—"}
                    </a>
                  </td>
                  <td className="p-3">{c._count}</td>
                  <td className="p-3 text-muted">{c._max.createdAt ? formatDate(c._max.createdAt) : "—"}</td>
                  <td className="p-3 text-right font-medium">{money(c._sum.total ?? 0, settings.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card className="h-fit">
          <p className="mb-3 font-semibold">Newsletter subscribers</p>
          {subscribers.length === 0 ? (
            <p className="text-sm text-muted">No subscribers yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="truncate">{s.email}</span>
                  <form action={deleteSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message={`Remove ${s.email}?`} className="text-xs text-muted hover:text-red-600">
                      Remove
                    </ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
