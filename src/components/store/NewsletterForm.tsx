"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/(store)/actions";

export function NewsletterForm({ code, dark = false }: { code: string; dark?: boolean }) {
  const [state, action, pending] = useActionState(subscribe, null);

  if (state?.ok)
    return (
      <p className={`rounded-xl p-4 text-center ${dark ? "bg-white/10" : "bg-white"}`}>
        ধন্যবাদ! চেকআউটে <strong className="tracking-wider">{code}</strong> কোড ব্যবহার করুন।
      </p>
    );

  return (
    <form action={action} className="flex w-full flex-col gap-2 sm:flex-row">
      <input name="email" type="email" required placeholder="আপনার ইমেইল" className={`input flex-1 ${dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/60" : ""}`} />
      <button disabled={pending} className={`btn ${dark ? "bg-white text-ink hover:bg-sand" : "btn-primary"}`}>
        {pending ? "অপেক্ষা করুন…" : "ছাড় নিন"}
      </button>
      {state?.error && <p className="text-sm text-red-500 sm:basis-full">{state.error}</p>}
    </form>
  );
}
