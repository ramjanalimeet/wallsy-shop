import Link from "next/link";
import { deleteFinanceEntry } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { FinanceEntryForm } from "@/components/admin/FinanceEntryForm";
import { Card, Empty, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { addMonths, currentMonth, dhakaDateInput, formatDhakaDate, monthKey, monthLabel, monthlySummary, monthStart, parseMonth } from "@/lib/finance";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

const CHART_MONTHS = 6;

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const month = parseMonth((await searchParams).month);
  const isCurrent = monthKey(month) === monthKey(currentMonth());
  const [settings, history, entries, pending] = await Promise.all([
    getSettings(),
    monthlySummary(addMonths(month, -(CHART_MONTHS - 1)), month),
    db.financeEntry.findMany({ where: { date: { gte: monthStart(month), lt: monthStart(addMonths(month, 1)) } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    db.order.aggregate({ where: { status: { in: ["pending", "processing", "shipped"] } }, _sum: { total: true }, _count: true }),
  ]);
  const m = (c: number) => money(c, settings.currency);
  const now = history[history.length - 1];
  const prev = history[history.length - 2];
  const margin = now.income ? Math.round((now.profit / now.income) * 100) : 0;
  const change = (a: number, b?: number) => (b ? Math.round(((a - b) / Math.abs(b)) * 100) : null);
  const max = Math.max(1, ...history.flatMap((h) => [h.income, h.expenses]));
  const expenseCats = Object.entries(now.expenseByCategory).sort((a, b) => b[1] - a[1]);

  const kpis = [
    { label: "Income", value: m(now.income), delta: change(now.income, prev?.income), good: true },
    { label: "Expenses", value: m(now.expenses), delta: change(now.expenses, prev?.expenses), good: false },
    { label: "Net profit", value: m(now.profit), delta: change(now.profit, prev?.profit), good: true, tone: now.profit >= 0 ? "text-emerald-700" : "text-red-600" },
    { label: "Profit margin", value: `${margin}%`, delta: null, good: true },
  ];

  return (
    <>
      <PageHeader title="Finance" subtitle={`Income, expenses and profit for ${monthLabel(month)}`}>
        <div className="flex items-center gap-1 rounded-xl border border-[#e2ded6] bg-white p-1">
          <Link href={`/admin/finance?month=${monthKey(addMonths(month, -1))}`} className="rounded-lg px-3 py-2 hover:bg-[#f1efea]" aria-label="Previous month">
            ‹
          </Link>
          <span className="min-w-36 text-center font-medium">{monthLabel(month)}</span>
          {isCurrent ? (
            <span className="px-3 py-2 text-ink/30">›</span>
          ) : (
            <Link href={`/admin/finance?month=${monthKey(addMonths(month, 1))}`} className="rounded-lg px-3 py-2 hover:bg-[#f1efea]" aria-label="Next month">
              ›
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="text-sm text-muted">{k.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${k.tone ?? ""}`}>{k.value}</p>
            {k.delta !== null && (
              <p className={`mt-1 text-xs font-medium ${(k.delta >= 0) === k.good ? "text-emerald-600" : "text-red-600"}`}>
                {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}% vs {monthLabel(addMonths(month, -1), "short")}
              </p>
            )}
          </Card>
        ))}
      </div>
      {pending._count > 0 && (
        <p className="mt-3 text-sm text-muted">
          Not counted yet: <strong className="text-ink">{m(pending._sum.total ?? 0)}</strong> cash on delivery from {pending._count} orders that aren&apos;t delivered. It&apos;s
          added to income when you mark an order delivered.
        </p>
      )}

      <Card className="mt-4">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">Last {CHART_MONTHS} months</p>
          <div className="flex gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sage" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Expenses
            </span>
          </div>
        </div>
        <div className="grid h-56 grid-cols-6 items-end gap-3">
          {history.map((h) => (
            <Link key={monthKey(h.month)} href={`/admin/finance?month=${monthKey(h.month)}`} className="group flex h-full flex-col justify-end">
              <div className="flex flex-1 items-end justify-center gap-1">
                <div className="w-1/3 max-w-8 rounded-t-md bg-sage transition group-hover:opacity-80" style={{ height: `${Math.max(1, (h.income / max) * 100)}%` }} title={`Income ${m(h.income)}`} />
                <div className="w-1/3 max-w-8 rounded-t-md bg-accent transition group-hover:opacity-80" style={{ height: `${Math.max(1, (h.expenses / max) * 100)}%` }} title={`Expenses ${m(h.expenses)}`} />
              </div>
              <p className={`mt-2 text-center text-xs ${monthKey(h.month) === monthKey(month) ? "font-semibold text-ink" : "text-muted"}`}>{monthLabel(h.month, "short")}</p>
              <p className={`text-center text-xs font-medium ${h.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{m(h.profit)}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="mb-3 font-semibold">Where the money came from</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Product sales ({now.orders} delivered orders)</dt>
                  <dd className="font-medium">{m(now.sales)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery charges collected</dt>
                  <dd className="font-medium">{m(now.deliveryCharges)}</dd>
                </div>
                {Object.entries(now.incomeByCategory).map(([c, v]) => (
                  <div key={c} className="flex justify-between">
                    <dt className="text-muted">{c}</dt>
                    <dd className="font-medium">{m(v)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-2 font-semibold">
                  <dt>Total income</dt>
                  <dd>{m(now.income)}</dd>
                </div>
              </dl>
            </Card>
            <Card>
              <p className="mb-3 font-semibold">Where the money went</p>
              {expenseCats.length === 0 ? (
                <p className="text-sm text-muted">No expenses recorded this month.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {expenseCats.map(([c, v]) => (
                    <li key={c}>
                      <div className="flex justify-between">
                        <span className="text-muted">{c}</span>
                        <span className="font-medium">{m(v)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-[#f1efea]">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(v / now.expenses) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <p className="mb-3 font-semibold">Entries in {monthLabel(month)}</p>
            {entries.length === 0 ? (
              <Empty>No expenses or extra income recorded for this month yet.</Empty>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#ece8e1] bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#ece8e1] text-left text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Note</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece8e1]">
                    {entries.map((e) => (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap p-4 text-muted">{formatDhakaDate(e.date)}</td>
                        <td className="p-4">
                          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${e.type === "income" ? "bg-sage" : "bg-accent"}`} />
                          {e.category}
                        </td>
                        <td className="p-4 text-muted">{e.note || "—"}</td>
                        <td className={`whitespace-nowrap p-4 text-right font-medium ${e.type === "income" ? "text-emerald-700" : ""}`}>
                          {e.type === "income" ? "+" : "−"}
                          {m(e.amount)}
                        </td>
                        <td className="p-4 text-right">
                          <form action={deleteFinanceEntry}>
                            <input type="hidden" name="id" value={e.id} />
                            <ConfirmButton message="Delete this entry?" className="text-muted hover:text-red-600">
                              Delete
                            </ConfirmButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <p className="mb-1 font-semibold">Record money in or out</p>
          <p className="mb-4 text-sm text-muted">Orders are counted automatically. Add your costs here, and any sales made outside the website.</p>
          <FinanceEntryForm currency={settings.currency} today={dhakaDateInput()} />
        </Card>
      </div>
    </>
  );
}
