import Link from "next/link";
import { PlusIcon } from "@/components/admin/icons";
import { Empty, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDhakaDate } from "@/lib/finance";

export default async function JournalAdmin() {
  const posts = await db.post.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Journal" subtitle="Blog posts shown on the website's Journal page.">
        <Link href="/admin/journal/new" className="btn btn-primary rounded-xl px-5 py-3">
          <PlusIcon className="h-5 w-5" /> New post
        </Link>
      </PageHeader>
      {posts.length === 0 ? (
        <Empty>No posts yet. Write about decorating tips, choosing sizes or new collections. They help customers and Google find you.</Empty>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#ece8e1] bg-white">
          <ul className="divide-y divide-[#ece8e1]">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/journal/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-[#fcfbf9]">
                  {p.cover ? <img src={p.cover} alt="" className="h-14 w-20 rounded-md object-cover" /> : <span className="h-14 w-20 rounded-md bg-sand" />}
                  <span className="flex-1">
                    <span className="block font-medium">{p.title}</span>
                    <span className="text-sm text-muted">{formatDhakaDate(p.createdAt)}</span>
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${p.published ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
                    <span className={`h-2 w-2 rounded-full ${p.published ? "bg-emerald-500" : "bg-stone-400"}`} />
                    {p.published ? "Published" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
