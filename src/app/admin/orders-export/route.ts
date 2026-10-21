import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quote fields with separators, and stop spreadsheet apps treating text as a formula.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** All orders as a CSV file that opens in Excel or Google Sheets. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const orders = await db.order.findMany({ orderBy: { number: "desc" }, include: { items: true } });
  const header = ["Order", "Date", "Status", "Source", "Name", "Phone", "Email", "Address", "District", "Area", "Items", "Subtotal", "Discount", "Delivery", "Total", "Product cost", "Courier", "Tracking", "Customer note", "Private note"];
  const tk = (c: number) => (c / 100).toFixed(2);
  const rows = orders.map((o) => [
    o.number,
    o.createdAt.toISOString().slice(0, 10),
    o.status,
    o.source,
    o.name,
    o.phone,
    o.email,
    o.address,
    o.city,
    o.deliveryArea,
    o.items.map((i) => `${i.title} (${i.variant}${i.frame ? `, ${i.frame} frame` : ""}) x${i.quantity}`).join("; "),
    tk(o.subtotal),
    tk(o.discount),
    tk(o.shipping),
    tk(o.total),
    tk(o.items.reduce((s, i) => s + i.unitCost * i.quantity, 0)),
    o.courier,
    o.trackingCode,
    o.note,
    o.adminNote,
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wallsy-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
