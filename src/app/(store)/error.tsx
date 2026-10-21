"use client";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-4xl">কিছু একটা সমস্যা হয়েছে</p>
      <p className="mt-3 max-w-md text-muted">পেজটি লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।</p>
      <button onClick={reset} className="btn btn-primary mt-8">
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
