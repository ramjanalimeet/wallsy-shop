"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/admin/actions";
import { CollectionsIcon, CustomersIcon, DiscountIcon, ExternalIcon, FinanceIcon, HomeIcon, LogoutIcon, MenuIcon, OrdersIcon, ProductsIcon, SettingsIcon, StarIcon } from "./icons";

const links = [
  ["/admin", "Overview", HomeIcon],
  ["/admin/orders", "Orders", OrdersIcon],
  ["/admin/finance", "Finance", FinanceIcon],
  ["/admin/products", "Products", ProductsIcon],
  ["/admin/categories", "Collections", CollectionsIcon],
  ["/admin/discounts", "Discounts", DiscountIcon],
  ["/admin/reviews", "Reviews", StarIcon],
  ["/admin/customers", "Customers", CustomersIcon],
  ["/admin/settings", "Store settings", SettingsIcon],
] as const;

export function AdminNav({ storeName, pendingOrders, pendingReviews }: { storeName: string; pendingOrders: number; pendingReviews: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const badge = (href: string) => (href === "/admin/orders" ? pendingOrders : href === "/admin/reviews" ? pendingReviews : 0);

  const logo = (
    <p className="font-serif text-3xl tracking-tight">
      {storeName}
      <span className="text-accent">.</span> <span className="font-sans text-sm text-muted">admin</span>
    </p>
  );

  const nav = (
    <>
      <nav className="flex flex-col gap-1">
        {links.map(([href, label, Icon]) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const n = badge(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] transition ${active ? "bg-[#f1efea] font-medium text-ink" : "text-ink/80 hover:bg-[#f6f4f0]"}`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-ink" : "text-ink/70"}`} />
              {label}
              {n > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">{n}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-4 rounded-xl px-4 py-3 text-[15px] text-ink/80 hover:bg-[#f6f4f0]">
          <ExternalIcon className="h-5 w-5 text-ink/70" /> View store
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] text-ink/80 hover:bg-[#f6f4f0]">
            <LogoutIcon className="h-5 w-5 text-ink/70" /> Log out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-4 left-4 hidden w-64 flex-col rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.08)] lg:flex">
        <div className="mb-8 px-4 pt-4">{logo}</div>
        {nav}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        {logo}
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-line p-2" aria-label="Menu">
          <MenuIcon />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-4">
            <div className="mb-6 px-4 pt-2">{logo}</div>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
