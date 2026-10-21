"use client";

import { useRouter } from "next/navigation";

/** Compact sort picker for phones; desktop shows the options as links. */
export function SortSelect({ options, value }: { options: { label: string; href: string; key: string }[]; value: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">সাজান</span>
      <select
        value={value}
        onChange={(e) => router.push(options.find((o) => o.key === e.target.value)!.href)}
        className="rounded-lg border border-line bg-white py-1.5 pl-2.5 pr-7 text-[16px] font-medium sm:text-sm"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
