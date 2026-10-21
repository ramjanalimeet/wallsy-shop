// Storefront text that can be edited in Dashboard → Store settings.
// An empty setting falls back to these defaults.
import { money } from "./format";
import type { Settings } from "./settings";

export type Faq = { q: string; a: string };
export type Trust = { title: string; text: string };

export const DEFAULT_FAQ: Faq[] = [
  { q: "ডেলিভারি পেতে কতদিন লাগে?", a: "ঢাকার ভিতরে সাধারণত ১–২ দিন এবং ঢাকার বাইরে ৩–৫ দিনের মধ্যে ডেলিভারি দেওয়া হয়। অর্ডারের পর আমরা ফোনে কনফার্ম করি।" },
  { q: "কীভাবে অর্ডার করব?", a: "পছন্দের প্রিন্টটি কার্টে যোগ করে চেকআউট করুন, অথবা সরাসরি “WhatsApp-এ অর্ডার করুন” বাটনে ক্লিক করে আমাদের মেসেজ পাঠান।" },
  { q: "পেমেন্ট কীভাবে করব?", a: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে ডেলিভারি ম্যানকে টাকা পরিশোধ করুন।" },
  { q: "ফ্রেমের সাথে কি গ্লাস থাকে?", a: "প্রতিটি ফ্রেম কাঠের তৈরি, সাথে থাকে না-ভাঙা অ্যাক্রিলিক গ্লাস, সাদা ম্যাট ও দেয়ালে ঝোলানোর হুক। বক্স খুলেই দেয়ালে লাগাতে পারবেন।" },
  { q: "পণ্য ফেরত দেওয়া যাবে?", a: "হ্যাঁ। পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করতে পারবেন। ডেলিভারিতে ভাঙা বা ক্ষতিগ্রস্ত হলে আমরা বিনামূল্যে নতুন পাঠাব।" },
];

export const DEFAULT_DELIVERY_TEXT = "ঢাকায় ১–২ দিন, ঢাকার বাইরে ৩–৫ দিনে ডেলিভারি";
export const DEFAULT_RETURN_TEXT = "পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করা যাবে। ডেলিভারিতে ভাঙা বা ক্ষতিগ্রস্ত হলে ছবি পাঠান, আমরা বিনামূল্যে নতুন পাঠাব।";

export function defaultTrust(s: Pick<Settings, "freeShippingThreshold" | "currency">): Trust[] {
  return [
    { title: "সারা দেশে ডেলিভারি", text: `${money(s.freeShippingThreshold, s.currency)}+ অর্ডারে ফ্রি` },
    { title: "ক্যাশ অন ডেলিভারি", text: "পণ্য হাতে পেয়ে টাকা দিন" },
    { title: "৭ দিনের রিটার্ন", text: "পছন্দ না হলে সহজে ফেরত" },
    { title: "প্রিমিয়াম কোয়ালিটি", text: "দীর্ঘস্থায়ী রং ও মোটা আর্ট পেপার" },
  ];
}

function parse<T>(json: string, valid: (x: unknown) => x is T): T[] | null {
  if (!json) return null;
  try {
    const list = JSON.parse(json);
    return Array.isArray(list) ? list.filter(valid) : null;
  } catch {
    return null;
  }
}

const isFaq = (x: unknown): x is Faq => typeof (x as Faq)?.q === "string" && typeof (x as Faq)?.a === "string" && !!(x as Faq).q.trim();
const isTrust = (x: unknown): x is Trust => typeof (x as Trust)?.title === "string" && typeof (x as Trust)?.text === "string";

export const getFaq = (s: Settings) => parse(s.faqJson, isFaq) ?? DEFAULT_FAQ;
export function getTrust(s: Settings) {
  const saved = parse(s.trustJson, isTrust);
  const defaults = defaultTrust(s);
  // Always four badges: fill any missing ones from the defaults.
  return defaults.map((d, i) => (saved?.[i]?.title ? saved[i] : d));
}
export const getDeliveryText = (s: Settings) => s.deliveryText.trim() || DEFAULT_DELIVERY_TEXT;
export const getReturnText = (s: Settings) => s.returnText.trim() || DEFAULT_RETURN_TEXT;
