import Link from "next/link";
import { db } from "@/lib/db";
import { formatDhakaDate } from "@/lib/finance";

export const metadata = { title: "Journal" };

export default async function JournalPage() {
  const posts = await db.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } });
  const [lead, ...rest] = posts;

  return (
    <div className="container-x py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">Journal</p>
      <h1 className="mt-3 font-serif text-5xl">ঘর সাজানোর গল্প ও টিপস</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">দেয়াল সাজানোর আইডিয়া, সঠিক সাইজ বাছাইয়ের গাইড আর নতুন কালেকশনের খবর।</p>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-2xl bg-sand p-16 text-center">
          <p className="font-serif text-2xl">শীঘ্রই আসছে</p>
          <p className="mt-2 text-muted">প্রথম লেখাটি খুব শিগগিরই প্রকাশিত হবে।</p>
          <Link href="/shop" className="btn btn-primary mt-6">
            প্রিন্ট দেখুন
          </Link>
        </div>
      ) : (
        <>
          <Link href={`/journal/${lead.slug}`} className="group mt-12 grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white lg:grid-cols-2">
            {lead.cover && <img src={lead.cover} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.02]" />}
            <div className="p-8 lg:p-12">
              <p className="text-sm text-muted">{formatDhakaDate(lead.createdAt)}</p>
              <h2 className="mt-2 font-serif text-4xl group-hover:underline">{lead.title}</h2>
              {lead.excerpt && <p className="mt-4 text-lg text-muted">{lead.excerpt}</p>}
              <span className="mt-6 inline-block font-semibold text-accent">পড়ুন →</span>
            </div>
          </Link>
          {rest.length > 0 && (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link key={p.id} href={`/journal/${p.slug}`} className="group">
                  {p.cover && <img src={p.cover} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />}
                  <p className="mt-4 text-sm text-muted">{formatDhakaDate(p.createdAt)}</p>
                  <h3 className="mt-1 font-serif text-2xl group-hover:underline">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 text-muted">{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
