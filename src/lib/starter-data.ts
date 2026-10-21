import type { Prisma, PrismaClient } from "@prisma/client";

const categories = [
  { name: "Abstract", slug: "abstract", description: "আধুনিক ঘরের জন্য রং, আকৃতি আর ছন্দের মেলবন্ধন।", image: "/art/bauhaus-balance.svg" },
  { name: "Landscapes", slug: "landscapes", description: "পাহাড়, মরুভূমি আর শহরের দৃশ্য, দেয়ালেই প্রকৃতি।", image: "/art/misty-mountains.svg" },
  { name: "Minimal", slug: "minimal", description: "সহজ, শান্ত ডিজাইন যা ঘরকে করে আরও খোলামেলা।", image: "/art/ocean-lines.svg" },
  { name: "Typography", slug: "typography", description: "অনুপ্রেরণার কথা, সুন্দর টাইপোগ্রাফিতে।", image: "/art/stay-curious.svg" },
  { name: "Retro", slug: "retro", description: "৭০-এর দশকের উষ্ণ রং, আধুনিক ছোঁয়ায়।", image: "/art/retro-rainbow.svg" },
];

type Seed = [title: string, art: string, category: string, artist: string, base: number, compare: number | null, flags: string, stock: number];
const products: Seed[] = [
  ["Sunset Dunes", "sunset-dunes", "landscapes", "Nusrat Jahan", 95000, 135000, "featured bestseller", 42],
  ["Bauhaus Balance", "bauhaus-balance", "abstract", "Arif Hossain", 105000, null, "featured bestseller", 18],
  ["Terracotta Arches", "terracotta-arches", "retro", "Tania Akter", 95000, 125000, "featured bestseller", 6],
  ["Misty Mountains", "misty-mountains", "landscapes", "Rafiq Islam", 115000, null, "bestseller", 30],
  ["Ocean Lines", "ocean-lines", "minimal", "Sadia Rahman", 85000, null, "featured", 25],
  ["Moon Phases", "moon-phases", "minimal", "Sadia Rahman", 95000, 120000, "bestseller", 4],
  ["Monstera Shadow", "monstera-shadow", "minimal", "Mehedi Hasan", 95000, null, "featured", 22],
  ["Organic Blobs", "organic-blobs", "abstract", "Tania Akter", 89000, null, "", 35],
  ["Golden Hour", "golden-hour", "retro", "Nusrat Jahan", 95000, 115000, "bestseller", 14],
  ["Swiss Dots", "swiss-dots", "abstract", "Arif Hossain", 85000, null, "", 40],
  ["Stay Curious", "stay-curious", "typography", "Studio Wallsy", 75000, null, "featured", 50],
  ["Good Things Take Time", "good-things", "typography", "Studio Wallsy", 75000, 95000, "bestseller", 3],
  ["Desert Bloom", "desert-cactus", "landscapes", "Mehedi Hasan", 95000, null, "", 19],
  ["Pine Forest", "pine-forest", "landscapes", "Rafiq Islam", 105000, null, "featured", 27],
  ["Retro Rainbow", "retro-rainbow", "retro", "Tania Akter", 89000, 105000, "featured", 33],
  ["Cutouts No. 3", "matisse-cutouts", "abstract", "Arif Hossain", 115000, null, "", 12],
  ["City Nights", "city-nights", "landscapes", "Nusrat Jahan", 105000, null, "", 21],
  ["Terrazzo", "terrazzo", "abstract", "Mehedi Hasan", 85000, null, "", 38],
];

// Sample content for `npm run db:demo` only; never loaded into a live store.
const reviewPool = [
  ["Farhana R.", 5, "প্রিন্টের কোয়ালিটি অসাধারণ! ছবির চেয়ে বাস্তবে আরও সুন্দর।"],
  ["Tanvir A.", 5, "ঢাকায় পরের দিনই পেয়েছি, প্যাকেজিং খুব ভালো ছিল।"],
  ["Nabila S.", 4, "ওক ফ্রেমটা দারুণ। ঝোলানোর নির্দেশনা থাকলে আরও ভালো হতো।"],
  ["Rakib H.", 5, "ড্রয়িং রুমের লুকটাই বদলে গেছে। গেস্টরা সবাই জিজ্ঞেস করে।"],
  ["Sumaiya K.", 5, "গিফট হিসেবে দিয়েছিলাম, বন্ধু খুব খুশি হয়েছে।"],
  ["Imran M.", 4, "রংগুলো খুব সুন্দর। 50×70 সাইজটা দেয়ালে পারফেক্ট লাগছে।"],
  ["Jannat F.", 5, "তৃতীয়বার অর্ডার করলাম, প্রতিবারই কোয়ালিটি একই রকম ভালো।"],
];

const names = ["Farhana Rahman", "Tanvir Ahmed", "Nabila Sultana", "Rakib Hasan", "Sumaiya Khan", "Imran Mahmud", "Jannat Ferdous", "Shakib Chowdhury", "Mim Akter", "Rahat Kabir"];
const cities = ["Dhaka", "Dhaka", "Chattogram", "Sylhet", "Dhaka", "Khulna", "Rajshahi", "Gazipur"];
const statuses = ["delivered", "delivered", "delivered", "shipped", "shipped", "processing", "pending", "cancelled"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Replaces the store's data with the starter catalog. With `demo`, also adds sample
 * reviews and orders; those are made up, so they're never loaded into a live store.
 */
export async function loadStarterData(db: Db, { demo }: { demo: boolean }) {
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
        description: `${title} — ${artist}-এর ডিজাইন করা ওয়াল আর্ট। ২৫০ জিএসএম প্রিমিয়াম ম্যাট আর্ট পেপারে দীর্ঘস্থায়ী পিগমেন্ট কালিতে প্রিন্ট করা, তাই রং সহজে ফিকে হয় না। প্রতিটি প্রিন্ট হাতে যাচাই করে মজবুত প্যাকেজিংয়ে পাঠানো হয় — চাইলে ফ্রেমসহ, রেডি টু হ্যাং।`,
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
            { name: "A3 · 30×42 cm", price: base + 40000, sortOrder: 1 },
            { name: "50×70 cm", price: base + 110000, sortOrder: 2 },
          ],
        },
        reviews: !demo
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
      { code: "WALLSY15", type: "percent", value: 15, minSubtotal: 400000 },
      { code: "SAVE200", type: "fixed", value: 20000, minSubtotal: 150000 },
    ],
  });

  if (!demo) return;

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
        unitPrice: p.price + 40000 + (framed ? 90000 : 0),
        quantity: 1 + (k % 2),
      };
    });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const city = cities[n % cities.length];
    const inside = city === "Dhaka";
    const shipping = subtotal >= 250000 ? 0 : inside ? 7000 : 13000;
    const name = names[n % names.length];
    await db.order.create({
      data: {
        number: 1001 + n,
        email: n % 3 === 0 ? `${name.split(" ")[0].toLowerCase()}@example.com` : "",
        phone: `0171${String(1000000 + n * 7919).slice(-7)}`,
        name,
        address: `বাসা ${10 + n}, রোড ${1 + (n % 12)}`,
        city,
        deliveryArea: inside ? "inside" : "outside",
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: statuses[n % statuses.length],
        createdAt: new Date(Date.now() - (34 - n) * 0.6 * 86400000),
        items: { create: items },
      },
    });
  }

}
