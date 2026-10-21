import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toBlocks } from "@/lib/content";
import { db } from "@/lib/db";
import { formatDhakaDate } from "@/lib/finance";

type Props = { params: Promise<{ slug: string }> };

const getPost = async (slug: string) => db.post.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt, openGraph: { images: post.cover ? [post.cover] : [] } } : {};
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <article className="container-x max-w-3xl py-16">
      <Link href="/journal" className="text-sm text-muted hover:underline">
        ← Journal
      </Link>
      <p className="mt-6 text-sm text-muted">{formatDhakaDate(post.createdAt)}</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-xl text-muted">{post.excerpt}</p>}
      {post.cover && <img src={post.cover} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />}
      <div className="mt-10 space-y-5 text-lg leading-relaxed text-ink/85">
        {toBlocks(post.body).map((b, i) =>
          b.type === "h" ? (
            <h2 key={i} className="pt-4 font-serif text-3xl text-ink">
              {b.text}
            </h2>
          ) : (
            <p key={i} className="whitespace-pre-line">
              {b.text}
            </p>
          )
        )}
      </div>
      <div className="mt-14 rounded-2xl bg-sand p-8 text-center">
        <p className="font-serif text-2xl">আপনার দেয়ালের জন্য প্রিন্ট খুঁজছেন?</p>
        <Link href="/shop" className="btn btn-accent mt-5">
          সব প্রিন্ট দেখুন
        </Link>
      </div>
    </article>
  );
}
