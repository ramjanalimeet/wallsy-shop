"use client";

import { money } from "@/lib/format";
import { TruckIcon } from "../icons";
import { useCart } from "./CartProvider";

export function FreeShippingBar({ extra = 0 }: { extra?: number }) {
  const { subtotal, config } = useCart();
  const total = subtotal + extra;
  const remaining = config.freeShippingThreshold - total;
  const pct = Math.min(100, (total / config.freeShippingThreshold) * 100);

  return (
    <div className="rounded-xl bg-sand p-3 text-sm">
      <p className="flex items-center gap-2">
        <TruckIcon className="h-4 w-4 shrink-0" />
        {remaining > 0 ? (
          <span>
            You&apos;re <strong>{money(remaining, config.currency)}</strong> away from <strong>free shipping</strong>
          </span>
        ) : (
          <span>
            <strong>Nice!</strong> Your order ships free.
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-sage transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
