/** Formats minor units (paisa/cents). Taka uses South Asian grouping: ৳1,00,000. */
export function money(cents: number, currency = "৳") {
  const value = cents / 100;
  const digits = Number.isInteger(value) ? 0 : 2;
  const locale = currency === "৳" ? "en-IN" : "en-US";
  return `${currency}${value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function parseImages(images: string): string[] {
  try {
    const list = JSON.parse(images);
    return Array.isArray(list) ? list.filter((i) => typeof i === "string") : [];
  } catch {
    return [];
  }
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function percentOff(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
