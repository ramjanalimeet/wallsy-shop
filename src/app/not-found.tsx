import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-serif text-7xl">404</p>
      <p className="mt-4 text-lg text-muted">দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি।</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        প্রিন্ট দেখুন
      </Link>
    </div>
  );
}
