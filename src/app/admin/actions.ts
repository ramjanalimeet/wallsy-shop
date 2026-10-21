"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfigured, checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDhakaDate } from "@/lib/finance";
import { slugify } from "@/lib/format";
import { ORDER_SOURCES } from "@/lib/order-sources";
import { OutOfStockError, saveOrder } from "@/lib/orders";
import { getSettings } from "@/lib/settings";

type State = { ok?: boolean; error?: string } | null;

const str = (f: FormData, k: string, max = 5000) => String(f.get(k) ?? "").trim().slice(0, max);
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
/** Parses a price typed as "29.99" into minor units. */
const cents = (f: FormData, k: string) => {
  const v = parseFloat(str(f, k).replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) ? Math.round(v * 100) : 0;
};
const int = (f: FormData, k: string) => Math.max(0, parseInt(str(f, k), 10) || 0);

/** "+880 1839-295114", "01839295114" or "+01839295114" → "8801839295114" for wa.me links. */
function whatsappDigits(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("01")) return `88${digits}`;
  return digits;
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Auth ----------

export async function login(_: State, form: FormData): Promise<State> {
  if (!adminConfigured()) return { error: "Set ADMIN_PASSWORD in your environment variables first." };
  if (!checkCredentials(str(form, "email"), str(form, "password"))) return { error: "Wrong email or password." };
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------- Products ----------

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "product";
  let slug = root;
  for (let n = 2; ; n++) {
    const hit = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${root}-${n}`;
  }
}

export async function saveProduct(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = str(form, "id") || undefined;
  const title = str(form, "title", 200);
  if (!title) return { error: "Title is required." };
  const price = cents(form, "price");
  if (price <= 0) return { error: "Price must be greater than zero." };

  const images = str(form, "images")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!images.length) return { error: "Add at least one image URL." };

  let variants: { name: string; price: number; cost: number }[] = [];
  try {
    variants = (JSON.parse(str(form, "variants", 20000) || "[]") as { name: string; price: string; cost?: string }[])
      .map((v) => ({
        name: String(v.name).trim().slice(0, 80),
        price: Math.round(parseFloat(String(v.price)) * 100),
        cost: Math.max(0, Math.round((parseFloat(String(v.cost ?? "")) || 0) * 100)),
      }))
      .filter((v) => v.name && v.price > 0);
  } catch {
    return { error: "Couldn't read the size options." };
  }

  const compare = cents(form, "compareAtPrice");
  const data = {
    title,
    slug: await uniqueSlug(str(form, "slug") || title, id),
    artist: str(form, "artist", 120),
    description: str(form, "description"),
    // With sizes, the cheapest one is the "from" price shown on cards.
    price: variants.length ? Math.min(...variants.map((v) => v.price)) : price,
    compareAtPrice: compare > 0 ? compare : null,
    costPrice: cents(form, "costPrice"),
    images: JSON.stringify(images),
    stock: int(form, "stock"),
    categoryId: str(form, "categoryId") || null,
    featured: bool(form, "featured"),
    bestseller: bool(form, "bestseller"),
    active: bool(form, "active"),
  };

  const product = await db.$transaction(async (tx) => {
    const p = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
    await tx.variant.deleteMany({ where: { productId: p.id } });
    if (variants.length) await tx.variant.createMany({ data: variants.map((v, i) => ({ ...v, productId: p.id, sortOrder: i })) });
    return p;
  });

  refresh();
  if (!id) redirect(`/admin/products/${product.id}?created=1`);
  return { ok: true };
}

export async function deleteProduct(form: FormData) {
  await requireAdmin();
  await db.product.delete({ where: { id: str(form, "id") } });
  refresh();
  redirect("/admin/products");
}

/** Copies a product (photos, sizes, prices, costs) as a hidden draft to edit. */
export async function duplicateProduct(form: FormData) {
  await requireAdmin();
  const p = await db.product.findUniqueOrThrow({ where: { id: str(form, "id") }, include: { variants: true } });
  const copy = await db.product.create({
    data: {
      title: `${p.title} (copy)`,
      slug: await uniqueSlug(`${p.slug}-copy`),
      artist: p.artist,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      costPrice: p.costPrice,
      images: p.images,
      stock: p.stock,
      categoryId: p.categoryId,
      active: false,
      variants: { create: p.variants.map((v) => ({ name: v.name, price: v.price, cost: v.cost, sortOrder: v.sortOrder })) },
    },
  });
  refresh();
  redirect(`/admin/products/${copy.id}?created=1`);
}

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const field = str(form, "field");
  if (!["active", "featured", "bestseller"].includes(field)) return;
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { [field]: !p[field as "active"] } });
  refresh();
}

export async function bulkProducts(form: FormData) {
  await requireAdmin();
  let ids: string[] = [];
  try {
    ids = (JSON.parse(str(form, "ids", 20000)) as unknown[]).map(String);
  } catch {
    return;
  }
  if (!ids.length) return;
  const where = { id: { in: ids } };
  const op = str(form, "op");
  if (op === "delete") await db.product.deleteMany({ where });
  else if (op === "publish") await db.product.updateMany({ where, data: { active: true } });
  else if (op === "hide") await db.product.updateMany({ where, data: { active: false } });
  else if (op === "feature") await db.product.updateMany({ where, data: { featured: true } });
  else if (op === "unfeature") await db.product.updateMany({ where, data: { featured: false } });
  refresh();
}

// ---------- Images ----------

const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/gif", "image/avif"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Stores an uploaded image (already resized in the browser) and returns its URL. */
export async function uploadImage(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "No file received." };
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Please upload a JPG, PNG or WebP image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "That image is too large (max 3 MB)." };
  const image = await db.image.create({ data: { data: Buffer.from(await file.arrayBuffer()), contentType: file.type, size: file.size } });
  return { url: `/api/img/${image.id}` };
}

// ---------- Categories ----------

export async function saveCategory(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = str(form, "id") || undefined;
  const name = str(form, "name", 80);
  if (!name) return { error: "Name is required." };
  const slug = slugify(str(form, "slug") || name);
  const clash = await db.category.findUnique({ where: { slug } });
  if (clash && clash.id !== id) return { error: `The URL “${slug}” is already used by another collection.` };
  const data = { name, slug, description: str(form, "description", 500), image: str(form, "image", 500), sortOrder: int(form, "sortOrder") };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  refresh();
  return { ok: true };
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  await db.category.delete({ where: { id: str(form, "id") } });
  refresh();
}

// ---------- Orders ----------

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export async function updateOrderStatus(form: FormData) {
  await requireAdmin();
  const status = str(form, "status");
  if (!STATUSES.includes(status)) return;
  const id = str(form, "id");
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    if (order.status === status) return;
    // Put stock back when an order is cancelled, and take it again if it's reinstated.
    const delta = status === "cancelled" ? 1 : order.status === "cancelled" ? -1 : 0;
    if (delta)
      for (const i of order.items)
        if (i.productId) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: delta * i.quantity } } });
    // Cash-on-delivery money comes in on delivery, so Finance counts income from this date.
    const deliveredAt = status === "delivered" ? new Date() : null;
    await tx.order.update({ where: { id }, data: { status, deliveredAt } });
  });
  revalidatePath("/admin", "layout");
}

// ---------- Finance ----------

export async function addFinanceEntry(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const type = str(form, "type") === "income" ? "income" : "expense";
  const amount = cents(form, "amount");
  if (amount <= 0) return { error: "Enter an amount greater than zero." };
  const category = str(form, "category", 60);
  if (!category) return { error: "Choose a category." };
  const date = parseDhakaDate(str(form, "date"));
  if (!date) return { error: "Choose a valid date." };
  await db.financeEntry.create({ data: { type, category, amount, date, note: str(form, "note", 300) } });
  revalidatePath("/admin/finance");
  return { ok: true };
}

export async function deleteFinanceEntry(form: FormData) {
  await requireAdmin();
  await db.financeEntry.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/finance");
}

// ---------- Manual orders & order details ----------

type ManualOrderPayload = {
  customer: { name: string; phone: string; email: string; address: string; city: string; deliveryArea: string; note: string };
  lines: { productId: string; variantId: string | null; frame: string; quantity: number; unitPrice: number }[];
  shipping: number;
  discount: number;
  source: string;
  status: string;
  adminNote: string;
};

/** Saves an order taken over WhatsApp, phone or social media. Prices are in Taka, as typed. */
export async function createManualOrder(payload: ManualOrderPayload): Promise<{ id?: string; error?: string }> {
  await requireAdmin();
  const t = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
  const c = payload?.customer ?? ({} as ManualOrderPayload["customer"]);
  if (!t(c.name)) return { error: "Enter the customer's name." };
  if (!t(c.phone)) return { error: "Enter the customer's phone number." };
  const lines = (payload.lines ?? []).filter((l) => l.productId && Number(l.quantity) > 0).slice(0, 50);
  if (!lines.length) return { error: "Add at least one product." };

  const settings = await getSettings();
  const products = await db.product.findMany({ where: { id: { in: lines.map((l) => l.productId) } }, include: { variants: true } });
  const items = [];
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) return { error: "One of the products no longer exists." };
    const v = p.variants.find((x) => x.id === l.variantId) ?? null;
    const frame = ["Black", "White", "Oak"].includes(l.frame) ? l.frame : "";
    const listPrice = (v?.price ?? p.price) + (frame ? settings.framePrice : 0);
    const typed = Math.round(Number(l.unitPrice) * 100);
    items.push({
      productId: p.id,
      title: p.title,
      variant: v?.name ?? "",
      frame,
      image: JSON.parse(p.images)[0] ?? "",
      unitPrice: typed > 0 ? typed : listPrice,
      unitCost: (v?.cost || p.costPrice) + (frame ? settings.frameCost : 0),
      quantity: Math.min(100, Math.floor(Number(l.quantity))),
    });
  }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = Math.min(subtotal, Math.max(0, Math.round(Number(payload.discount) * 100) || 0));
  const shipping = Math.max(0, Math.round(Number(payload.shipping) * 100) || 0);
  const phone = t(c.phone, 30).replace(/[\s-]/g, "");
  try {
    const order = await saveOrder({
      customer: {
        name: t(c.name),
        phone: phone.match(/^(?:\+?88)?(01\d{9})$/)?.[1] ?? phone,
        email: t(c.email),
        address: t(c.address),
        city: t(c.city),
        note: t(c.note),
        deliveryArea: c.deliveryArea === "outside" ? "outside" : "inside",
      },
      items,
      subtotal,
      discount,
      discountCode: null,
      shipping,
      total: subtotal - discount + shipping,
      source: (ORDER_SOURCES as readonly string[]).includes(payload.source) ? payload.source : "other",
      status: STATUSES.includes(payload.status) ? payload.status : "pending",
      adminNote: t(payload.adminNote, 1000),
    });
    refresh();
    return { id: order.id };
  } catch (e) {
    if (e instanceof OutOfStockError) return { error: `Only ${e.available} of “${e.title}” left in stock. Update the stock first if you have more.` };
    throw e;
  }
}

/** Edits customer details, courier/tracking and the private note on an order. */
export async function updateOrderDetails(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = str(form, "id");
  await db.order.update({
    where: { id },
    data: {
      name: str(form, "name", 200),
      phone: str(form, "phone", 30),
      email: str(form, "email", 200),
      address: str(form, "address", 300),
      city: str(form, "city", 100),
      deliveryArea: str(form, "deliveryArea") === "outside" ? "outside" : "inside",
      courier: str(form, "courier", 60),
      trackingCode: str(form, "trackingCode", 100),
      adminNote: str(form, "adminNote", 2000),
    },
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------- Discounts ----------

export async function saveDiscount(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const code = str(form, "code", 40).toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Code is required." };
  const type = str(form, "type") === "fixed" ? "fixed" : "percent";
  const raw = parseFloat(str(form, "value"));
  if (!(raw > 0)) return { error: "Value must be greater than zero." };
  if (type === "percent" && raw > 100) return { error: "A percentage can't be more than 100." };
  const maxUses = parseInt(str(form, "maxUses"), 10);
  const expiryDay = str(form, "expiresAt") ? parseDhakaDate(str(form, "expiresAt")) : null;
  const data = {
    code,
    type,
    value: type === "percent" ? Math.round(raw) : Math.round(raw * 100),
    minSubtotal: cents(form, "minSubtotal"),
    maxUses: maxUses > 0 ? maxUses : null,
    // Valid through the end of the chosen day (Dhaka time).
    expiresAt: expiryDay ? new Date(expiryDay.getTime() + 86_400_000 - 1) : null,
  };
  const id = str(form, "id") || undefined;
  const existing = await db.discountCode.findUnique({ where: { code } });
  if (existing && existing.id !== id) return { error: `${code} already exists.` };
  if (id) await db.discountCode.update({ where: { id }, data });
  else await db.discountCode.create({ data: { ...data, active: true } });
  revalidatePath("/admin/discounts");
  if (id) redirect("/admin/discounts");
  return { ok: true };
}

export async function toggleDiscount(form: FormData) {
  await requireAdmin();
  const d = await db.discountCode.findUniqueOrThrow({ where: { id: str(form, "id") } });
  await db.discountCode.update({ where: { id: d.id }, data: { active: !d.active } });
  revalidatePath("/admin/discounts");
}

export async function deleteDiscount(form: FormData) {
  await requireAdmin();
  await db.discountCode.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/discounts");
}

// ---------- Reviews ----------

export async function moderateReview(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (str(form, "op") === "delete") await db.review.delete({ where: { id } });
  else await db.review.update({ where: { id }, data: { approved: str(form, "op") === "approve" } });
  refresh();
}

// ---------- Subscribers ----------

export async function deleteSubscriber(form: FormData) {
  await requireAdmin();
  await db.subscriber.delete({ where: { id: str(form, "id") } });
  revalidatePath("/admin/customers");
}

// ---------- Settings ----------

export async function saveSettings(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const storeName = str(form, "storeName", 60);
  if (!storeName) return { error: "Store name is required." };
  await db.setting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {
      storeName,
      tagline: str(form, "tagline", 200),
      announcement: str(form, "announcement", 200),
      announcementEnabled: bool(form, "announcementEnabled"),
      heroEyebrow: str(form, "heroEyebrow", 100),
      heroTitle: str(form, "heroTitle", 120),
      heroSubtitle: str(form, "heroSubtitle", 300),
      heroCta: str(form, "heroCta", 40),
      heroImage: str(form, "heroImage", 500),
      currency: str(form, "currency", 5) || "$",
      freeShippingThreshold: cents(form, "freeShippingThreshold"),
      shippingFee: cents(form, "shippingFee"),
      shippingFeeOutside: cents(form, "shippingFeeOutside"),
      whatsappNumber: whatsappDigits(str(form, "whatsappNumber", 30)),
      framePrice: cents(form, "framePrice"),
      frameCost: cents(form, "frameCost"),
      deliveryText: str(form, "deliveryText", 300),
      returnText: str(form, "returnText", 1000),
      faqJson: str(form, "faqJson", 20000),
      trustJson: str(form, "trustJson", 5000),
      newsletterTitle: str(form, "newsletterTitle", 120),
      newsletterText: str(form, "newsletterText", 300),
      newsletterCode: str(form, "newsletterCode", 40).toUpperCase(),
      contactEmail: str(form, "contactEmail", 120),
      contactPhone: str(form, "contactPhone", 40),
      instagram: str(form, "instagram", 300),
      facebook: str(form, "facebook", 300),
    },
  });
  refresh();
  return { ok: true };
}
