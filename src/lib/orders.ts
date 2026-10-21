import "server-only";
import { db } from "./db";

export type OrderItemInput = {
  productId: string | null;
  title: string;
  variant: string;
  frame: string;
  image: string;
  unitPrice: number;
  unitCost: number;
  quantity: number;
};

export type OrderInput = {
  customer: { name: string; phone: string; email: string; address: string; city: string; note: string; deliveryArea: string };
  items: OrderItemInput[];
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  total: number;
  source: string;
  status?: string;
  adminNote?: string;
};

export class OutOfStockError extends Error {
  constructor(
    readonly title: string,
    readonly available: number
  ) {
    super(`Only ${available} of “${title}” in stock`);
  }
}

/**
 * Saves an order and reserves its stock in one transaction. Used by the website
 * checkout and by orders entered in the dashboard (WhatsApp, phone, Facebook…).
 */
export async function saveOrder(input: OrderInput) {
  return db.$transaction(async (tx) => {
    const qtyByProduct = new Map<string, { qty: number; title: string }>();
    for (const i of input.items) {
      if (!i.productId) continue;
      const cur = qtyByProduct.get(i.productId);
      qtyByProduct.set(i.productId, { qty: (cur?.qty ?? 0) + i.quantity, title: i.title });
    }
    for (const [id, { qty, title }] of qtyByProduct) {
      // Conditional decrement: fails if another order took the stock first.
      const updated = await tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
      if (updated.count === 0) {
        const p = await tx.product.findUnique({ where: { id }, select: { stock: true } });
        throw new OutOfStockError(title, Math.max(0, p?.stock ?? 0));
      }
    }
    if (input.discountCode) await tx.discountCode.update({ where: { code: input.discountCode }, data: { usedCount: { increment: 1 } } });

    const status = input.status ?? "pending";
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: {
        number: (last?.number ?? 1000) + 1,
        ...input.customer,
        country: "Bangladesh",
        subtotal: input.subtotal,
        discount: input.discount,
        discountCode: input.discountCode,
        shipping: input.shipping,
        total: input.total,
        paymentMethod: "cod",
        source: input.source,
        status,
        adminNote: input.adminNote ?? "",
        deliveredAt: status === "delivered" ? new Date() : null,
        items: { create: input.items },
      },
    });
  });
}
