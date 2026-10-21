"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from "../icons";
import { useCart } from "./CartProvider";

type Nav = { name: string; slug: string };

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header({ storeName, categories }: { storeName: string; categories: Nav[] }) {
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [collections, setCollections] = useState(false);
  const [q, setQ] = useState("");
  const [bump, setBump] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const dropdown = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenu(false);
    setCollections(false);
  }, [pathname, params]);
  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);
  useEffect(() => {
    if (!collections) return;
    const close = (e: MouseEvent) => !dropdown.current?.contains(e.target as Node) && setCollections(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [collections]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  const active = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/shop") return pathname === "/shop" && !params.get("category") && !params.get("filter");
    if (href === "/shop?filter=bestseller") return params.get("filter") === "bestseller";
    return pathname.startsWith(href);
  };
  const link = (href: string, accent = false) =>
    `relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100 ${
      active(href) ? "after:scale-x-100" : ""
    } ${accent ? "text-accent" : "text-ink hover:text-ink/70"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8dfd3] bg-paper/95 backdrop-blur">
      <div className="container-x flex h-[72px] items-center gap-6 lg:h-20">
        <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
          <MenuIcon className="h-6 w-6" />
        </button>
        <Link href="/" className="font-serif text-[28px] font-semibold tracking-tight lg:text-[32px]">
          {storeName}
          <span className="text-accent">.</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-10 text-[16px] lg:flex xl:ml-14 xl:gap-12">
          <Link href="/" className={link("/")}>
            Home
          </Link>
          <Link href="/shop" className={link("/shop")}>
            Shop All
          </Link>
          <div ref={dropdown} className="relative">
            <button onClick={() => setCollections((v) => !v)} className={`flex items-center gap-2 py-2 ${params.get("category") ? "text-ink" : "text-ink hover:text-ink/70"}`} aria-expanded={collections}>
              Collections <Chevron open={collections} />
            </button>
            {collections && (
              <div className="animate-fade-in absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-[#e8dfd3] bg-white p-2 shadow-xl">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/shop?category=${c.slug}`} className="block rounded-xl px-4 py-2.5 hover:bg-sand">
                    {c.name}
                  </Link>
                ))}
                <Link href="/shop" className="mt-1 block rounded-xl border-t border-line px-4 py-2.5 text-sm text-muted hover:bg-sand">
                  View all prints →
                </Link>
              </div>
            )}
          </div>
          <Link href="/shop?filter=bestseller" className={link("/shop?filter=bestseller", true)}>
            Best Sellers
          </Link>
          <Link href="/about" className={link("/about")}>
            About
          </Link>
          <Link href="/journal" className={link("/journal")}>
            Journal
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <button className="rounded-full p-2 hover:bg-sand" onClick={() => setSearch((v) => !v)} aria-label="Search">
            <SearchIcon className="h-6 w-6" />
          </button>
          <button className="relative rounded-full p-2 hover:bg-sand" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
            <BagIcon className="h-6 w-6" />
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white transition-transform ${bump ? "scale-125" : ""}`}
            >
              {count}
            </span>
          </button>
        </div>
      </div>

      {search && (
        <form onSubmit={submit} className="container-x animate-fade-in pb-4">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="প্রিন্ট, আর্টিস্ট বা স্টাইল খুঁজুন…" className="input" />
        </form>
      )}

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <nav className="animate-fade-in absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-paper p-6 text-lg">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-serif text-2xl">
                {storeName}
                <span className="text-accent">.</span>
              </span>
              <button className="p-2" onClick={() => setMenu(false)} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>
            <Link href="/" className="py-2.5">
              Home
            </Link>
            <Link href="/shop" className="py-2.5">
              Shop All
            </Link>
            <p className="mt-2 py-2.5 text-sm uppercase tracking-wider text-muted">Collections</p>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="py-2 pl-4 text-base">
                {c.name}
              </Link>
            ))}
            <Link href="/shop?filter=bestseller" className="mt-2 py-2.5 text-accent">
              Best Sellers
            </Link>
            <Link href="/about" className="py-2.5">
              About
            </Link>
            <Link href="/journal" className="py-2.5">
              Journal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
