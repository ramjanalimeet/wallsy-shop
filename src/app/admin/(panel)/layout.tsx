import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getSetupStatus } from "@/lib/setup";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The root layout shows setup instructions instead.
  if (!(await getSetupStatus()).ok) return null;
  await requireAdmin();
  const [settings, pendingOrders, pendingReviews] = await Promise.all([
    getSettings(),
    db.order.count({ where: { status: "pending" } }),
    db.review.count({ where: { approved: false } }),
  ]);

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <AdminNav storeName={settings.storeName} pendingOrders={pendingOrders} pendingReviews={pendingReviews} />
      <div className="lg:pl-60">
        <div className="mx-auto max-w-6xl p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
