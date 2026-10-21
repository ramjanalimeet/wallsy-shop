import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <p className="font-serif text-3xl">
          Wallsy<span className="text-accent">.</span>
        </p>
        <p className="mt-1 text-sm text-muted">Sign in to manage your store</p>
        <LoginForm />
      </div>
    </div>
  );
}
