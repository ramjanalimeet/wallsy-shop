"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminConfigured, checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";

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

  let variants: { name: string; price: number }[] = [];
  try {
    variants = (JSON.parse(str(form, "variants", 20000) || "[]") as { name: string; price: string }[])
      .map((v) => ({ name: String(v.name).trim().slice(0, 80), price: Math.round(parseFloat(String(v.price)) * 100) }))
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

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  const field = str(form, "field");
  if (!["active", "featured", "bestseller"].includes(field)) return;
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { [field]: !p[field as "active"] } });
  refresh();
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
    await tx.order.update({ where: { id }, data: { status } });
  });
  revalidatePath("/admin", "layout");
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
  const data = {
    code,
    type,
    value: type === "percent" ? Math.round(raw) : Math.round(raw * 100),
    minSubtotal: cents(form, "minSubtotal"),
    maxUses: maxUses > 0 ? maxUses : null,
    active: true,
  };
  const existing = await db.discountCode.findUnique({ where: { code } });
  if (existing) return { error: `${code} already exists.` };
  await db.discountCode.create({ data });
  revalidatePath("/admin/discounts");
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
