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
    <div className="min-h-screen bg-[#f8f7f4]">
      <AdminNav storeName={settings.storeName} pendingOrders={pendingOrders} pendingReviews={pendingReviews} />
      <div className="lg:pl-72">
        <div className="max-w-[1280px] px-4 py-6 sm:px-8 sm:py-10 lg:pl-10">{children}</div>
      </div>
    </div>
  );
}
