"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  variantId: string | null;
  variantName: string;
  frame: string;
  unitPrice: number;
  quantity: number;
};

export type StoreConfig = {
  currency: string;
  freeShippingThreshold: number;
  shippingFee: number;
  shippingFeeOutside: number;
  whatsappNumber: string;
  framePrice: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  config: StoreConfig;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number, openDrawer?: boolean) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "wallsy_cart_v1";

export function CartProvider({ children, config }: { children: React.ReactNode; config: StoreConfig }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const add = useCallback<CartCtx["add"]>((item, quantity = 1, openDrawer = true) => {
    const key = `${item.productId}:${item.variantId ?? ""}:${item.frame}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i));
      return [...prev, { ...item, key, quantity }];
    });
    if (openDrawer) setOpen(true);
  }, []);

  const update = useCallback((key: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i))));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { items, count, subtotal, open, config, setOpen, add, update, remove, clear };
  }, [items, open, config, add, update, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
