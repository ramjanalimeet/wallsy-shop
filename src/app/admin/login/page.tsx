import { redirect } from "next/navigation";
import { adminConfigured, adminEmailRequired, isAdmin } from "@/lib/auth";
import { AdminScale } from "@/components/admin/AdminScale";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <AdminScale />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <p className="font-serif text-3xl">
          Wallsy<span className="text-accent">.</span>
        </p>
        <p className="mt-1 text-sm text-muted">Sign in to manage your store</p>
        {adminConfigured() ? (
          <LoginForm withEmail={adminEmailRequired()} />
        ) : (
          <div className="mt-6 rounded-lg bg-sand p-4 text-sm">
            <p className="font-semibold">Set your admin password</p>
            <p className="mt-1 text-muted">
              On Vercel, open your project → Settings → Environment Variables, add <code className="font-semibold text-ink">ADMIN_PASSWORD</code> with a strong password, then
              redeploy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
