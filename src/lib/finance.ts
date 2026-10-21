import { db } from "./db";
import { AD_CATEGORY } from "./finance-categories";

// Bangladesh is UTC+6 all year (no daylight saving), so months are computed in Dhaka time.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export type Month = { year: number; month: number }; // month: 0–11

/** Start of a Dhaka calendar month as a UTC instant. */
export function monthStart({ year, month }: Month) {
  return new Date(Date.UTC(year, month, 1) - DHAKA_OFFSET_MS);
}

export function addMonths({ year, month }: Month, n: number): Month {
  const d = new Date(Date.UTC(year, month + n, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function currentMonth(now = new Date()): Month {
  const d = new Date(now.getTime() + DHAKA_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/** "2026-10" → Month; anything invalid → the current month. */
export function parseMonth(value?: string): Month {
  const m = value?.match(/^(\d{4})-(\d{2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[1], month: +m[2] - 1 };
  return currentMonth();
}

export const monthKey = ({ year, month }: Month) => `${year}-${String(month + 1).padStart(2, "0")}`;
export const monthLabel = ({ year, month }: Month, style: "long" | "short" = "long") =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", { month: style, year: "numeric", timeZone: "UTC" });

/** "2026-10-21" as midnight in Dhaka. */
export function parseDhakaDate(value: string) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - DHAKA_OFFSET_MS);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dhakaDateInput(date = new Date()) {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

export function formatDhakaDate(date: Date) {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Income, expenses and profit for each month in [from, to] (inclusive). */
export async function monthlySummary(from: Month, to: Month) {
  const start = monthStart(from);
  const end = monthStart(addMonths(to, 1));
  const [delivered, entries] = await Promise.all([
    // Older delivered orders have no deliveredAt; fall back to when they were placed.
    db.order.findMany({
      where: { status: "delivered", OR: [{ deliveredAt: { gte: start, lt: end } }, { deliveredAt: null, createdAt: { gte: start, lt: end } }] },
      select: { total: true, shipping: true, deliveredAt: true, createdAt: true, items: { select: { unitCost: true, quantity: true } } },
    }),
    db.financeEntry.findMany({ where: { date: { gte: start, lt: end } }, select: { type: true, category: true, amount: true, date: true } }),
  ]);

  const months: Month[] = [];
  for (let m = from; monthStart(m) < end; m = addMonths(m, 1)) months.push(m);
  const rows = months.map((m) => ({
    month: m,
    sales: 0,
    deliveryCharges: 0,
    orders: 0,
    otherIncome: 0,
    productCost: 0,
    adSpend: 0,
    expenses: 0,
    expenseByCategory: {} as Record<string, number>,
    incomeByCategory: {} as Record<string, number>,
  }));
  const rowFor = (d: Date) => rows.find((r) => d >= monthStart(r.month) && d < monthStart(addMonths(r.month, 1)));

  for (const o of delivered) {
    const r = rowFor(o.deliveredAt ?? o.createdAt);
    if (!r) continue;
    r.sales += o.total - o.shipping;
    r.deliveryCharges += o.shipping;
    r.productCost += o.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
    r.orders++;
  }
  for (const e of entries) {
    const r = rowFor(e.date);
    if (!r) continue;
    if (e.type === "income") {
      r.otherIncome += e.amount;
      r.incomeByCategory[e.category] = (r.incomeByCategory[e.category] ?? 0) + e.amount;
    } else {
      r.expenses += e.amount;
      if (e.category === AD_CATEGORY) r.adSpend += e.amount;
      r.expenseByCategory[e.category] = (r.expenseByCategory[e.category] ?? 0) + e.amount;
    }
  }

  return rows.map((r) => {
    const income = r.sales + r.deliveryCharges + r.otherIncome;
    // Expenses here are the recorded ones (ads, rent…); product costs come from each order.
    const totalCost = r.productCost + r.expenses;
    return { ...r, income, totalCost, grossProfit: income - r.productCost, profit: income - totalCost };
  });
}
