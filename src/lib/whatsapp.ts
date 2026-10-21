import { money } from "./format";

/** Bangla names for the frame options (stored in English). */
export const FRAME_BN: Record<string, string> = { Black: "কালো", White: "সাদা", Oak: "ওক কাঠ" };

export type WhatsAppItem = { title: string; variantName: string; frame: string; quantity: number; unitPrice: number };

export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** The pre-filled message a shopper sends to order the given items over WhatsApp. */
export function orderMessage(items: WhatsAppItem[], currency: string, extra = "") {
  const lines = items.map(
    (i, n) => `${n + 1}. ${i.title} (${i.variantName}, ${i.frame ? `${FRAME_BN[i.frame] ?? i.frame} ফ্রেম` : "ফ্রেম ছাড়া"}) × ${i.quantity} = ${money(i.unitPrice * i.quantity, currency)}`
  );
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return ["আসসালামু আলাইকুম, আমি অর্ডার করতে চাই:", "", ...lines, "", `মোট: ${money(total, currency)} (ডেলিভারি চার্জ আলাদা)`, extra, "", "নাম:", "ঠিকানা:"]
    .filter((l, i, all) => l !== "" || all[i - 1] !== "")
    .join("\n");
}
