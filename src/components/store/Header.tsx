"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from "../icons";
import { useCart } from "./CartProvider";

type Nav = { name: string; slug: string };

export function Header({ storeName, categories }: { storeName: string; categories: Nav[] }) {
  const { count, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [bump, setBump] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!count) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(t);
  }, [count]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-4">
        <button className="-ml-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
          <MenuIcon />
        </button>
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          {storeName}
          <span className="text-accent">.</span>
        </Link>
        <nav className="ml-8 hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link href="/shop" className="hover:text-accent">
            সব প্রিন্ট
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className="hover:text-accent">
              {c.name}
            </Link>
          ))}
          <Link href="/shop?sort=newest" className="text-accent">
            নতুন
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button className="rounded-full p-2 hover:bg-sand" onClick={() => setSearch((v) => !v)} aria-label="Search">
            <SearchIcon />
          </button>
          <button className="relative rounded-full p-2 hover:bg-sand" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
            <BagIcon />
            {count > 0 && (
              <span className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white transition-transform ${bump ? "scale-125" : ""}`}>
                {count}
              </span>
            )}
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
          <nav className="animate-fade-in absolute left-0 top-0 flex h-full w-72 flex-col gap-1 bg-paper p-5 text-lg">
            <button className="mb-4 self-end p-2" onClick={() => setMenu(false)} aria-label="Close menu">
              <CloseIcon />
            </button>
            <Link href="/shop" className="py-2">
              সব প্রিন্ট
            </Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="py-2">
                {c.name}
              </Link>
            ))}
            <Link href="/shop?sort=newest" className="py-2 text-accent">
              নতুন
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
