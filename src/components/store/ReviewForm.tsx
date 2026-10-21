"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/app/(store)/actions";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);
  const [open, setOpen] = useState(false);

  if (state?.ok) return <p className="rounded-xl bg-sand p-4">Thanks! Your review will appear once it&apos;s approved.</p>;
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost">
        Write a review
      </button>
    );

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-white p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1 text-2xl text-amber-500">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`}>
            {i <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <input name="name" required placeholder="Your name" className="input" />
      <textarea name="body" required minLength={10} rows={4} placeholder="What did you love about it?" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
