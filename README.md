# Wallsy: wall-art store and admin dashboard

A conversion-focused e-commerce store for art prints, with a built-in dashboard to run it. Built with Next.js, Tailwind CSS and Prisma.

## Quick start

```bash
npm install
cp .env.example .env      # then set ADMIN_PASSWORD and ADMIN_SECRET
npm run setup             # creates the SQLite database and loads demo products and orders
npm run dev
```

- Storefront: http://localhost:3000
- Dashboard: http://localhost:3000/admin (sign in with `ADMIN_PASSWORD`)

`npm run db:seed` resets the store to the demo data at any time. **It deletes all products, orders and settings.**

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

## Deploying

SQLite is great locally but serverless hosts don't keep a writable disk. For production:

1. Create a Postgres database (Neon, Supabase, Vercel Postgres, Railway…).
2. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set `DATABASE_URL`, `ADMIN_PASSWORD` and `ADMIN_SECRET` (`openssl rand -hex 32`) in your host's environment variables.
4. Run `npx prisma db push` once against the production database (and `npm run db:seed` if you want the demo content).
5. Deploy. On Vercel the default build command (`npm run build`) works as is.

In production the app refuses the placeholder password and secret from `.env.example`.

## Next steps worth adding

- Online card payments (Stripe Checkout) alongside cash on delivery
- Order confirmation emails (Resend or Postmark)
- Image uploads straight from the dashboard
