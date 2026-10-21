"use client";

import { useActionState, useState, useTransition } from "react";
import { submitReview } from "@/app/(store)/actions";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  if (state?.ok) return <p className="rounded-xl bg-sand p-4">ধন্যবাদ! অনুমোদনের পর আপনার রিভিউ দেখা যাবে।</p>;
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost">
        রিভিউ লিখুন
      </button>
    );

  return (
    <form
      // onSubmit rather than action={…} so a validation error doesn't clear what the customer wrote.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-3 rounded-2xl border border-line bg-white p-5"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1 text-2xl text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
            {i <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <input name="name" required placeholder="আপনার নাম" className="input" />
      <textarea name="body" required minLength={10} rows={4} placeholder="প্রোডাক্টটি কেমন লেগেছে?" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary">
        {pending ? "পাঠানো হচ্ছে…" : "রিভিউ দিন"}
      </button>
    </form>
  );
}
