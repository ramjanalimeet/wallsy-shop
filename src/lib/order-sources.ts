// Where an order came from. Shared by the dashboard forms and server actions.
export const ORDER_SOURCES = ["whatsapp", "phone", "facebook", "instagram", "website", "other"] as const;

export const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  facebook: "Facebook",
  instagram: "Instagram",
  other: "Other",
};
