"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/admin/actions";

const links = [
  ["/admin", "Overview", "◎"],
  ["/admin/orders", "Orders", "▤"],
  ["/admin/products", "Products", "▦"],
  ["/admin/categories", "Collections", "◫"],
  ["/admin/discounts", "Discounts", "%"],
  ["/admin/reviews", "Reviews", "★"],
  ["/admin/customers", "Customers", "☺"],
  ["/admin/settings", "Store settings", "⚙"],
];

export function AdminNav({ storeName, pendingOrders, pendingReviews }: { storeName: string; pendingOrders: number; pendingReviews: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const badge = (href: string) => (href === "/admin/orders" ? pendingOrders : href === "/admin/reviews" ? pendingReviews : 0);

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map(([href, label, icon]) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        const n = badge(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
          >
            <span className="w-4 text-center">{icon}</span>
            {label}
            {n > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs text-white">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink p-4 lg:flex">
        <p className="mb-8 px-3 pt-2 font-serif text-2xl text-white">
          {storeName}
          <span className="text-accent">.</span> <span className="font-sans text-xs font-medium text-white/40">admin</span>
        </p>
        {nav}
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm text-white/65 hover:text-white">
            ↗ View store
          </Link>
          <form action={logout}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/65 hover:text-white">⎋ Log out</button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <p className="font-serif text-xl">
          {storeName}
          <span className="text-accent">.</span> <span className="font-sans text-xs text-white/40">admin</span>
        </p>
        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-white/20 px-3 py-1 text-sm">
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-[52px] z-30 bg-ink p-4 lg:hidden">
          {nav}
          <div className="mt-3 flex gap-4 border-t border-white/10 px-3 pt-3 text-sm text-white/65">
            <Link href="/" target="_blank">
              ↗ View store
            </Link>
            <form action={logout}>
              <button>⎋ Log out</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
