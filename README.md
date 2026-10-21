# Wallsy: wall-art store and admin dashboard

Built for shoppers in Bangladesh: prices in Taka (৳), key sections in Bangla, cash on delivery with inside/outside Dhaka delivery fees, and **Order on WhatsApp** buttons alongside the regular cart and checkout. The WhatsApp number, delivery fees, free-delivery amount and home page text are all editable in **Store settings**.

A conversion-focused e-commerce store for art prints, with a built-in dashboard to run it. Built with Next.js, Tailwind CSS and Prisma.

## Deploy on Vercel

The build needs no database and no settings, so it can't fail on missing configuration.

1. On [vercel.com/new](https://vercel.com/new), import this repository and click **Deploy**.
2. In the new project, open **Storage → Create Database → Neon** and connect it to the project.
3. Open **Settings → Environment Variables** and add `ADMIN_PASSWORD` (your dashboard password).
4. Open **Deployments → ⋯ → Redeploy**.

On the first visit, the store creates its tables and loads the starter catalog (products, collections and discount codes, with no fake reviews or orders). Until a database is connected, every page shows these setup steps instead of an error.

Other Postgres hosts (Supabase, Railway…) work too. The app finds the connection string in `DATABASE_URL`, `POSTGRES_PRISMA_URL` or `POSTGRES_URL`, including versions with a custom prefix such as `STORAGE_DATABASE_URL`.

Optional: set `ADMIN_SECRET` to a long random string to sign dashboard sessions with a separate key. Without it, the key comes from the password, so changing the password signs everyone out.

## Run it locally

```bash
npm install
cp .env.example .env      # point DATABASE_URL at any Postgres database
npm run dev               # tables and the starter catalog are created on the first visit
```

- Storefront: http://localhost:3000
- Dashboard: http://localhost:3000/admin (sign in with `ADMIN_PASSWORD`)

`npm run db:demo` replaces everything with the demo store, including sample reviews and orders, which is handy for trying out the dashboard. **It deletes all products, orders and settings. Never run it against your live store.**

### Changing the database schema

The tables are created from `src/lib/schema-sql.ts`, which `npm run build` regenerates from `prisma/schema.prisma`. That only covers a brand-new database. If you change the schema after launch, apply it to the existing database with `npx prisma db push`.

## What's in the storefront

Everything here is backed by the database and can be edited from the dashboard.

| Conversion feature | Where |
| --- | --- |
| Announcement bar, hero headline, CTA and hero image | Home (edit in **Store settings**) |
| Trust strip: free-shipping threshold, returns, quality, cash on delivery | Home, product page, checkout |
| Free-shipping progress bar | Cart drawer and product page |
| Sale prices with "Save X%", Bestseller and "Only X left" badges | Product cards and product page |
| Live frame preview: pick a frame and the product image updates | Product page |
| Size options, frame add-on, quantity, **Buy it now** | Product page |
| Sticky add-to-cart bar after scrolling | Product page |
| Delivery-date estimate | Product page |
| Star ratings and customer reviews with moderation | Cards, product page, home |
| One-click quick add and slide-out cart with "complete the gallery wall" upsell | Everywhere |
| One-page guest checkout (no account needed), discount codes, cash on delivery | `/checkout` |
| Newsletter sign-up that reveals a discount code | Home and footer |
| FAQ that answers shipping, returns and payment questions | Home |
| SEO metadata and Product structured data (rich results) | Product pages |

Totals are always recalculated on the server from the database, so prices can't be changed in the browser. Stock is reserved atomically when an order is placed.

## The dashboard (`/admin`)

- **Overview**: revenue, orders and average order value with comparison to the previous period, a daily revenue chart, recent orders, top sellers and low-stock alerts
- **Orders**: filter by status, search, a one-click "Mark as shipped/delivered" flow, and customer and address details. Cancelling an order puts its items back in stock.
- **Products**: add or edit products, images, sizes and prices, compare-at (sale) price, stock, collection, and the Featured, Bestseller and Published toggles
- **Collections**: create and reorder the categories shown in the menu and on the home page
- **Discounts**: percentage or fixed codes with minimum spend and usage limits
- **Reviews**: approve, hide or delete customer reviews (new reviews stay hidden until approved)
- **Customers**: buyers ranked by total spend, plus newsletter subscribers
- **Store settings**: store name, announcement, hero copy and image, currency symbol, shipping fee, free-shipping threshold, frame price, newsletter offer, contact details and social links

## Images

The demo artwork is generated SVG in `public/art` (`node scripts/generate-art.mjs`). For real products, upload photos anywhere public (Cloudinary, S3, your CDN, or `public/`) and paste the URLs into the product form, one per line.

In production the app refuses the example password from `.env.example`.

## Next steps worth adding

- Online card payments (Stripe Checkout) alongside cash on delivery
- Order confirmation emails (Resend or Postmark)
- Image uploads straight from the dashboard
