import { db } from "./db";
import { parseImages } from "./format";
import type { Prisma } from "@prisma/client";

const include = {
  category: true,
  variants: { orderBy: { sortOrder: "asc" } },
  reviews: { where: { approved: true }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

type Row = Prisma.ProductGetPayload<{ include: typeof include }>;

function shape(p: Row) {
  const ratings = p.reviews.map((r) => r.rating);
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    artist: p.artist,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: parseImages(p.images),
    stock: p.stock,
    featured: p.featured,
    bestseller: p.bestseller,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
    reviewCount: ratings.length,
    rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
  };
}

export type CatalogProduct = ReturnType<typeof shape>;

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export async function listProducts(opts: { category?: string; q?: string; sort?: SortKey; take?: number; where?: Prisma.ProductWhereInput } = {}) {
  const where: Prisma.ProductWhereInput = { active: true, ...opts.where };
  if (opts.category) where.category = { slug: opts.category };
  if (opts.q) where.OR = [{ title: { contains: opts.q } }, { artist: { contains: opts.q } }, { description: { contains: opts.q } }];

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    opts.sort === "newest"
      ? [{ createdAt: "desc" }]
      : opts.sort === "price-asc"
        ? [{ price: "asc" }]
        : opts.sort === "price-desc"
          ? [{ price: "desc" }]
          : [{ bestseller: "desc" }, { featured: "desc" }, { createdAt: "desc" }];

  const rows = await db.product.findMany({ where, include, orderBy, take: opts.take });
  const list = rows.map(shape);
  if (opts.sort === "rating") list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  return list;
}

export async function getProduct(slug: string) {
  const row = await db.product.findFirst({ where: { slug, active: true }, include });
  return row ? shape(row) : null;
}
