"use client";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-4xl">Something went wrong</p>
      <p className="mt-3 max-w-md text-muted">We couldn&apos;t load this page. Please try again in a moment.</p>
      <button onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
