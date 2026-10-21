import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-7xl">404</p>
      <p className="mt-4 text-lg text-muted">This wall is bare — we couldn&apos;t find that page.</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Browse prints
      </Link>
    </div>
  );
}
