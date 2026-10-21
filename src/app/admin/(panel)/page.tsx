import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const DAYS = 14;

export default async function Overview() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS - 1));
  const prevSince = new Date(since);
  prevSince.setDate(prevSince.getDate() - DAYS);

  const live = { status: { not: "cancelled" } };
  const [settings, recent, current, previous, lowStock, topItems, productCount, subscriberCount, pending] = await Promise.all([
    getSettings(),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.order.findMany({ where: { ...live, createdAt: { gte: since } }, select: { total: true, createdAt: true } }),
    db.order.aggregate({ where: { ...live, createdAt: { gte: prevSince, lt: since } }, _sum: { total: true }, _count: true }),
    db.product.findMany({ where: { active: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 6 }),
    db.orderItem.groupBy({ by: ["title"], where: { order: live }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.product.count({ where: { active: true } }),
    db.subscriber.count(),
    db.order.count({ where: { status: "pending" } }),
  ]);

  const m = (c: number) => money(c, settings.currency);
  const revenue = current.reduce((s, o) => s + o.total, 0);
  const prevRevenue = previous._sum.total ?? 0;
  const aov = current.length ? Math.round(revenue / current.length) : 0;
  const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : null);

  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    return { date: d, total: 0, count: 0 };
  });
  const byDay = new Map(days.map((d) => [d.date.toDateString(), d]));
  for (const o of current) {
    const day = byDay.get(o.createdAt.toDateString());
    if (day) {
      day.total += o.total;
      day.count++;
    }
  }
  const max = Math.max(1, ...days.map((d) => d.total));

  const kpis = [
    { label: `Revenue · ${DAYS}d`, value: m(revenue), delta: change(revenue, prevRevenue) },
    { label: `Orders · ${DAYS}d`, value: String(current.length), delta: change(current.length, previous._count) },
    { label: "Avg. order value", value: m(aov), delta: null },
    { label: "Awaiting action", value: String(pending), delta: null, href: "/admin/orders?status=pending" },
  ];

  return (
    <>
      <PageHeader title="Overview" subtitle={`Here's how ${settings.storeName} is doing over the last ${DAYS} days.`}>
        <Link href="/admin/products/new" className="btn btn-primary px-4 py-2 text-sm">
          + Add product
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold">{k.value}</p>
            {k.delta !== null && (
              <p className={`mt-1 text-xs font-medium ${k.delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}% vs previous {DAYS} days
              </p>
            )}
            {k.href && (
              <Link href={k.href} className="mt-1 block text-xs font-medium text-accent">
                View pending orders →
              </Link>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="mb-6 flex items-baseline justify-between">
          <p className="font-semibold">Daily revenue</p>
          <p className="text-sm text-muted">
            {productCount} live products · {subscriberCount} subscribers
          </p>
        </div>
        <div className="flex h-48 items-end gap-1.5">
          {days.map((d) => (
            <div key={d.date.toISOString()} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="rounded-t-md bg-accent/80 transition group-hover:bg-accent" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white group-hover:block">
                {d.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: {m(d.total)} · {d.count} orders
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{days[0].date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          <span>Today</span>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Recent orders</p>
            <Link href="/admin/orders" className="text-sm font-medium text-accent">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-line">
            {recent.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:bg-sand/50">
                <span className="w-14 font-medium">#{o.number}</span>
                <span className="flex-1 truncate">{o.name}</span>
                <span className="hidden text-muted sm:block">{formatDate(o.createdAt)}</span>
                <StatusBadge status={o.status} />
                <span className="w-20 text-right font-medium">{m(o.total)}</span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="mb-3 font-semibold">Top sellers</p>
            <ol className="space-y-2 text-sm">
              {topItems.map((t, i) => (
                <li key={t.title} className="flex justify-between">
                  <span>
                    <span className="mr-2 text-muted">{i + 1}.</span>
                    {t.title}
                  </span>
                  <span className="font-medium">{t._sum.quantity} sold</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <p className="mb-3 font-semibold">Low stock</p>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted">Everything is well stocked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <Link href={`/admin/products/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                    <span className={`font-medium ${p.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
