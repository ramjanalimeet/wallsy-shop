import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const categories = [
  { name: "Abstract", slug: "abstract", description: "Shapes, color and movement for modern spaces.", image: "/art/bauhaus-balance.svg" },
  { name: "Landscapes", slug: "landscapes", description: "Mountains, deserts and skylines to escape into.", image: "/art/misty-mountains.svg" },
  { name: "Minimal", slug: "minimal", description: "Quiet, considered pieces that let a room breathe.", image: "/art/ocean-lines.svg" },
  { name: "Typography", slug: "typography", description: "Words to live by, set in beautiful type.", image: "/art/stay-curious.svg" },
  { name: "Retro", slug: "retro", description: "Warm 70s tones with a modern twist.", image: "/art/retro-rainbow.svg" },
];

type Seed = [title: string, art: string, category: string, artist: string, base: number, compare: number | null, flags: string, stock: number];
const products: Seed[] = [
  ["Sunset Dunes", "sunset-dunes", "landscapes", "Mira Okafor", 2900, 3900, "featured bestseller", 42],
  ["Bauhaus Balance", "bauhaus-balance", "abstract", "Jonas Weber", 3200, null, "featured bestseller", 18],
  ["Terracotta Arches", "terracotta-arches", "retro", "Lucía Ramos", 2900, 3600, "featured bestseller", 6],
  ["Misty Mountains", "misty-mountains", "landscapes", "Erik Lund", 3400, null, "bestseller", 30],
  ["Ocean Lines", "ocean-lines", "minimal", "Hana Sato", 2600, null, "featured", 25],
  ["Moon Phases", "moon-phases", "minimal", "Hana Sato", 2900, 3500, "bestseller", 4],
  ["Monstera Shadow", "monstera-shadow", "minimal", "Ama Mensah", 2900, null, "featured", 22],
  ["Organic Blobs", "organic-blobs", "abstract", "Lucía Ramos", 2700, null, "", 35],
  ["Golden Hour", "golden-hour", "retro", "Mira Okafor", 2900, 3400, "bestseller", 14],
  ["Swiss Dots", "swiss-dots", "abstract", "Jonas Weber", 2600, null, "", 40],
  ["Stay Curious", "stay-curious", "typography", "Studio Wallsy", 2400, null, "featured", 50],
  ["Good Things Take Time", "good-things", "typography", "Studio Wallsy", 2400, 2900, "bestseller", 3],
  ["Desert Bloom", "desert-cactus", "landscapes", "Ama Mensah", 2900, null, "", 19],
  ["Pine Forest", "pine-forest", "landscapes", "Erik Lund", 3200, null, "featured", 27],
  ["Retro Rainbow", "retro-rainbow", "retro", "Lucía Ramos", 2700, 3200, "featured", 33],
  ["Cutouts No. 3", "matisse-cutouts", "abstract", "Jonas Weber", 3400, null, "", 12],
  ["City Nights", "city-nights", "landscapes", "Mira Okafor", 3200, null, "", 21],
  ["Terrazzo", "terrazzo", "abstract", "Ama Mensah", 2600, null, "", 38],
];

const reviewPool = [
  ["Sarah K.", 5, "The print quality is unreal. Colors are even richer in person and the paper feels premium."],
  ["Daniel M.", 5, "Arrived in two days, packaged like a treasure. Already ordered two more for the hallway."],
  ["Priya S.", 4, "Beautiful piece. The oak frame is lovely, just wish it came with a hanging guide."],
  ["Tom R.", 5, "Exactly what our living room needed. Guests ask about it every time."],
  ["Aisha B.", 5, "Bought it as a housewarming gift and my friend cried. 10/10."],
  ["Lena W.", 4, "Gorgeous colors. Went with the 50×70 and it fills the wall perfectly."],
  ["Marco D.", 5, "Third order from Wallsy. Consistent quality and great customer service."],
];

const names = ["Olivia Brown", "Liam Smith", "Emma Garcia", "Noah Khan", "Ava Rossi", "Ethan Lee", "Sofia Nguyen", "Lucas Silva", "Mia Patel", "Leo Müller"];
const cities = ["London", "Berlin", "Toronto", "Austin", "Sydney", "Dublin", "Lisbon", "Amsterdam"];
const statuses = ["delivered", "delivered", "delivered", "shipped", "shipped", "processing", "pending", "cancelled"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// `--if-empty` (used on deploy): only fills a brand-new database, and only with the
// catalog. Sample reviews and orders are made up, so they're left out of a live store.
const ifEmpty = process.argv.includes("--if-empty");

async function main() {
  if (ifEmpty) {
    const [products, settings] = await Promise.all([db.product.count(), db.setting.count()]);
    if (products > 0 || settings > 0) return console.log("Database already has data, skipping seed.");
  }
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.discountCode.deleteMany();
  await db.setting.deleteMany();
  await db.setting.create({ data: { id: 1 } });

  const cats = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await db.category.create({ data: { ...c, sortOrder: i } });
    cats.set(c.slug, row.id);
  }

  const created: { id: string; title: string; price: number; images: string }[] = [];
  for (const [i, [title, art, cat, artist, base, compare, flags, stock]] of products.entries()) {
    const p = await db.product.create({
      data: {
        title,
        slug: slugify(title),
        artist,
        description: `${title} by ${artist} is printed on 250gsm archival matte paper with museum-grade pigment inks that won't fade for 100+ years. Each print is checked by hand, rolled in acid-free tissue and shipped in a crush-proof tube — or framed and ready to hang.`,
        price: base,
        compareAtPrice: compare,
        images: JSON.stringify([`/art/${art}.svg`]),
        stock,
        featured: flags.includes("featured"),
        bestseller: flags.includes("bestseller"),
        categoryId: cats.get(cat),
        createdAt: new Date(Date.now() - (products.length - i) * 86400000 * 3),
        variants: {
          create: [
            { name: "A4 · 21×30 cm", price: base, sortOrder: 0 },
            { name: "A3 · 30×42 cm", price: base + 1000, sortOrder: 1 },
            { name: "50×70 cm", price: base + 2500, sortOrder: 2 },
          ],
        },
        reviews: ifEmpty
          ? undefined
          : {
              create: Array.from({ length: 2 + (i % 4) }, (_, k) => {
                const [name, rating, body] = reviewPool[(i + k) % reviewPool.length];
                return { name: name as string, rating: rating as number, body: body as string, approved: true, createdAt: new Date(Date.now() - (k + 1) * 86400000 * 5) };
              }),
            },
      },
    });
    created.push(p);
  }

  await db.discountCode.createMany({
    data: [
      { code: "WELCOME10", type: "percent", value: 10 },
      { code: "WALLSY15", type: "percent", value: 15, minSubtotal: 10000 },
      { code: "SAVE5", type: "fixed", value: 500, minSubtotal: 4000 },
    ],
  });

  if (ifEmpty) return console.log(`Loaded starter catalog: ${created.length} products in ${categories.length} collections.`);

  // Demo orders spread over the last three weeks so the dashboard has data to show.
  for (let n = 0; n < 34; n++) {
    const count = 1 + (n % 3);
    const items = Array.from({ length: count }, (_, k) => {
      const p = created[(n * 5 + k * 7) % created.length];
      const framed = (n + k) % 2 === 0;
      return {
        productId: p.id,
        title: p.title,
        variant: "A3 · 30×42 cm",
        frame: framed ? "Black" : "",
        image: JSON.parse(p.images)[0],
        unitPrice: p.price + 1000 + (framed ? 2500 : 0),
        quantity: 1 + (k % 2),
      };
    });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shipping = subtotal >= 6000 ? 0 : 599;
    const name = names[n % names.length];
    await db.order.create({
      data: {
        number: 1001 + n,
        email: `${name.split(" ")[0].toLowerCase()}@example.com`,
        name,
        address: `${10 + n} Example Street`,
        city: cities[n % cities.length],
        country: "United Kingdom",
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: statuses[n % statuses.length],
        createdAt: new Date(Date.now() - (34 - n) * 0.6 * 86400000),
        items: { create: items },
      },
    });
  }

  console.log(`Seeded ${created.length} products, ${categories.length} categories and 34 demo orders.`);
}

main().finally(() => db.$disconnect());
