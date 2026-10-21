import "server-only";
import { db } from "./db";
import { money } from "./format";
import type { Settings } from "./settings";

export type CartLine = { productId: string; variantId?: string | null; framed?: boolean; frame?: string; quantity: number };

export const FRAMES = ["Black", "White", "Oak"] as const;

/** Re-prices a cart from the database so the client can never set its own prices. */
export type DeliveryArea = "inside" | "outside";

export function shippingFor(area: DeliveryArea, settings: Settings) {
  return area === "outside" ? settings.shippingFeeOutside : settings.shippingFee;
}

export async function priceCart(lines: CartLine[], settings: Settings, code?: string | null, area: DeliveryArea = "inside") {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await db.product.findMany({ where: { id: { in: ids }, active: true }, include: { variants: true } });

  const items = [];
  for (const line of lines) {
    const p = products.find((x) => x.id === line.productId);
    if (!p) continue;
    const variant = p.variants.find((v) => v.id === line.variantId) ?? (p.variants.length ? p.variants[0] : null);
    const frame = line.frame && (FRAMES as readonly string[]).includes(line.frame) ? line.frame : "";
    const quantity = Math.max(1, Math.min(20, Math.floor(line.quantity || 1)));
    const unitPrice = (variant?.price ?? p.price) + (frame ? settings.framePrice : 0);
    items.push({ product: p, variant, frame, quantity, unitPrice });
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = await evaluateDiscount(code, subtotal, settings.currency);
  const afterDiscount = subtotal - discount.amount;
  // Threshold uses the pre-discount subtotal, matching the progress bar shoppers see in the cart.
  const shipping = items.length === 0 || subtotal >= settings.freeShippingThreshold ? 0 : shippingFor(area, settings);
  return { items, subtotal, discount, shipping, total: afterDiscount + shipping };
}

export async function evaluateDiscount(code: string | null | undefined, subtotal: number, currency: string) {
  const none = { code: null as string | null, amount: 0, error: null as string | null };
  if (!code?.trim()) return none;
  const row = await db.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!row || !row.active) return { ...none, error: "কোডটি সঠিক নয়।" };
  if (row.maxUses != null && row.usedCount >= row.maxUses) return { ...none, error: "কোডটির মেয়াদ শেষ।" };
  if (subtotal < row.minSubtotal) return { ...none, error: `এই কোড ব্যবহার করতে কমপক্ষে ${money(row.minSubtotal, currency)} অর্ডার করুন।` };
  const amount = row.type === "percent" ? Math.round((subtotal * Math.min(row.value, 100)) / 100) : Math.min(row.value, subtotal);
  return { code: row.code, amount, error: null };
}
