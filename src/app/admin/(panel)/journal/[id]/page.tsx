import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/ActionForm";
import { PostForm } from "@/components/admin/PostForm";
import { PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  const post = isNew ? null : await db.post.findUnique({ where: { id } });
  if (!isNew && !post) notFound();

  return (
    <>
      <Link href="/admin/journal" className="text-sm text-muted hover:underline">
        ← Journal
      </Link>
      <PageHeader title={post?.title ?? "New post"} subtitle={created ? "✓ Post created" : undefined}>
        {post?.published && (
          <Link href={`/journal/${post.slug}`} target="_blank" className="btn btn-ghost rounded-xl px-4 py-2 text-sm">
            View on site ↗
          </Link>
        )}
        {post && (
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <ConfirmButton message="Delete this post?" className="btn rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Delete
            </ConfirmButton>
          </form>
        )}
      </PageHeader>
      <PostForm post={post ?? { title: "", slug: "", excerpt: "", body: "", cover: "", published: true }} />
    </>
  );
}
