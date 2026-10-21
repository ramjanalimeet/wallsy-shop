"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { priceCart, type CartLine } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

type FormState = { ok?: boolean; error?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email")).toLowerCase();
  if (!EMAIL.test(email)) return { error: "Please enter a valid email." };
  await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  return { ok: true };
}

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const productId = clean(form.get("productId"));
  const name = clean(form.get("name"), 60);
  const body = clean(form.get("body"), 1000);
  const rating = Number(form.get("rating"));
  if (!name || body.length < 10 || !(rating >= 1 && rating <= 5)) return { error: "Please add your name, a rating and at least a sentence." };
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { error: "Product not found." };
  await db.review.create({ data: { productId, name, body, rating: Math.round(rating) } });
  return { ok: true };
}

function sanitizeLines(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.slice(0, 50).map((l) => ({
    productId: String(l?.productId ?? ""),
    variantId: l?.variantId ? String(l.variantId) : null,
    frame: l?.frame ? String(l.frame) : "",
    quantity: Number(l?.quantity) || 1,
  }));
}

export async function previewCheckout(rawLines: unknown, code: string | null) {
  const settings = await getSettings();
  const cart = await priceCart(sanitizeLines(rawLines), settings, code);
  return {
    subtotal: cart.subtotal,
    discount: cart.discount.amount,
    discountCode: cart.discount.code,
    discountError: cart.discount.error,
    shipping: cart.shipping,
    total: cart.total,
    // Lets the client drop items that were removed or deactivated in the dashboard.
    validProductIds: [...new Set(cart.items.map((i) => i.product.id))],
  };
}

export type CustomerInput = { email: string; name: string; phone: string; address: string; city: string; zip: string; country: string; note: string };

export async function placeOrder(rawLines: unknown, customer: CustomerInput, code: string | null): Promise<{ id?: string; error?: string }> {
  const c = Object.fromEntries(Object.entries(customer ?? {}).map(([k, v]) => [k, String(v ?? "").trim().slice(0, 300)])) as CustomerInput;
  if (!EMAIL.test(c.email)) return { error: "Please enter a valid email address." };
  if (!c.name || !c.address || !c.city || !c.country) return { error: "Please complete your shipping details." };

  const settings = await getSettings();
  const cart = await priceCart(sanitizeLines(rawLines), settings, code);
  if (!cart.items.length) return { error: "Your cart is empty." };
  if (code && cart.discount.error) return { error: cart.discount.error };

  try {
    const order = await db.$transaction(async (tx) => {
      const qtyByProduct = new Map<string, number>();
      for (const i of cart.items) qtyByProduct.set(i.product.id, (qtyByProduct.get(i.product.id) ?? 0) + i.quantity);
      for (const [id, qty] of qtyByProduct) {
        // Conditional decrement: fails if another order took the stock first.
        const updated = await tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (updated.count === 0) {
          const p = cart.items.find((i) => i.product.id === id)!.product;
          throw new Error(`Sorry, only ${Math.max(0, p.stock)} of “${p.title}” left in stock.`);
        }
      }
      if (cart.discount.code) await tx.discountCode.update({ where: { code: cart.discount.code }, data: { usedCount: { increment: 1 } } });

      const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
      return tx.order.create({
        data: {
          number: (last?.number ?? 1000) + 1,
          ...c,
          subtotal: cart.subtotal,
          discount: cart.discount.amount,
          discountCode: cart.discount.code,
          shipping: cart.shipping,
          total: cart.total,
          paymentMethod: "cod",
          items: {
            create: cart.items.map((i) => ({
              productId: i.product.id,
              title: i.product.title,
              variant: i.variant?.name ?? "",
              frame: i.frame,
              image: JSON.parse(i.product.images)[0] ?? "",
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          },
        },
      });
    });
    revalidatePath("/", "layout");
    return { id: order.id };
  } catch (e) {
    return { error: e instanceof Error && e.message.startsWith("Sorry") ? e.message : "We couldn't place your order. Please try again." };
  }
}
