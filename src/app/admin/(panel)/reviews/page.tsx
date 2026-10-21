import Link from "next/link";
import { moderateReview } from "@/app/admin/actions";
import { Stars } from "@/components/icons";
import { Empty, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show = "pending" } = await searchParams;
  const reviews = await db.review.findMany({
    where: show === "all" ? undefined : { approved: show === "approved" },
    include: { product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Reviews" subtitle="New reviews stay hidden until you approve them." />
      <div className="mb-4 flex gap-2">
        {["pending", "approved", "all"].map((t) => (
          <Link key={t} href={`/admin/reviews?show=${t}`} className={`rounded-full border px-3 py-1 text-sm capitalize ${show === t ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {t}
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? (
        <Empty>{show === "pending" ? "No reviews waiting for approval. 🎉" : "No reviews."}</Empty>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-3 text-sm">
                  <Stars rating={r.rating} />
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-muted">on</span>
                  <Link href={`/product/${r.product.slug}`} target="_blank" className="hover:underline">
                    {r.product.title}
                  </Link>
                  <span className="text-muted">· {formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-2">{r.body}</p>
              </div>
              <form action={moderateReview} className="flex shrink-0 items-start gap-2">
                <input type="hidden" name="id" value={r.id} />
                {r.approved ? (
                  <button name="op" value="hide" className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-sand">
                    Hide
                  </button>
                ) : (
                  <button name="op" value="approve" className="rounded-lg bg-ink px-3 py-1.5 text-sm text-white">
                    Approve
                  </button>
                )}
                <button name="op" value="delete" className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
