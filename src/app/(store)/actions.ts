"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { OutOfStockError, saveOrder } from "@/lib/orders";
import { priceCart, type CartLine, type DeliveryArea } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

type FormState = { ok?: boolean; error?: string } | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Bangladeshi mobile numbers: 01XXXXXXXXX, optionally with +88 / 88 in front.
const BD_MOBILE = /^(?:\+?88)?(01[3-9]\d{8})$/;
const area = (v: unknown): DeliveryArea => (v === "outside" ? "outside" : "inside");
const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email")).toLowerCase();
  if (!EMAIL.test(email)) return { error: "সঠিক ইমেইল দিন।" };
  await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  return { ok: true };
}

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const productId = clean(form.get("productId"));
  const name = clean(form.get("name"), 60);
  const body = clean(form.get("body"), 1000);
  const rating = Number(form.get("rating"));
  if (!name || body.length < 10 || !(rating >= 1 && rating <= 5)) return { error: "আপনার নাম, রেটিং এবং অন্তত একটি বাক্য লিখুন।" };
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

export async function previewCheckout(rawLines: unknown, code: string | null, deliveryArea: unknown) {
  const settings = await getSettings();
  const cart = await priceCart(sanitizeLines(rawLines), settings, code, area(deliveryArea));
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

export type CustomerInput = { name: string; phone: string; email: string; address: string; city: string; deliveryArea: string; note: string };

export async function placeOrder(rawLines: unknown, customer: CustomerInput, code: string | null): Promise<{ id?: string; error?: string }> {
  const get = (k: keyof CustomerInput) => String(customer?.[k] ?? "").trim().slice(0, 300);
  const phone = get("phone").replace(/[\s-]/g, "").match(BD_MOBILE)?.[1];
  const email = get("email");
  if (!get("name")) return { error: "আপনার নাম লিখুন।" };
  if (!phone) return { error: "সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)।" };
  if (email && !EMAIL.test(email)) return { error: "ইমেইল সঠিক নয়। না থাকলে ঘরটি খালি রাখুন।" };
  if (!get("address") || !get("city")) return { error: "সম্পূর্ণ ঠিকানা ও জেলা লিখুন।" };
  const c = { name: get("name"), phone, email, address: get("address"), city: get("city"), note: get("note"), deliveryArea: area(customer?.deliveryArea) };

  const settings = await getSettings();
  const cart = await priceCart(sanitizeLines(rawLines), settings, code, c.deliveryArea);
  if (!cart.items.length) return { error: "আপনার কার্ট খালি।" };
  if (code && cart.discount.error) return { error: cart.discount.error };

  try {
    const order = await saveOrder({
      customer: c,
      subtotal: cart.subtotal,
      discount: cart.discount.amount,
      discountCode: cart.discount.code,
      shipping: cart.shipping,
      total: cart.total,
      source: "website",
      items: cart.items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        variant: i.variant?.name ?? "",
        frame: i.frame,
        image: JSON.parse(i.product.images)[0] ?? "",
        unitPrice: i.unitPrice,
        unitCost: i.unitCost,
        quantity: i.quantity,
      })),
    });
    revalidatePath("/", "layout");
    return { id: order.id };
  } catch (e) {
    if (e instanceof OutOfStockError) return { error: `দুঃখিত, “${e.title}” মাত্র ${e.available}টি স্টকে আছে।` };
    return { error: "অর্ডার করা যায়নি। আবার চেষ্টা করুন অথবা WhatsApp-এ অর্ডার করুন।" };
  }
}
