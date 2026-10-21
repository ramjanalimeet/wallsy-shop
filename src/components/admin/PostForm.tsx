"use client";

import { savePost } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "./ActionForm";
import { ImageField } from "./ImageUpload";
import { Card, Field } from "./ui";

export type PostValues = { id?: string; title: string; slug: string; excerpt: string; body: string; cover: string; published: boolean };

export function PostForm({ post }: { post: PostValues }) {
  return (
    <ActionForm action={savePost} success="Post saved" className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <Card className="space-y-4">
        <Field label="Title">
          <input name="title" required defaultValue={post.title} className="input text-lg font-medium" />
        </Field>
        <Field label="Short summary" hint="Shown on the Journal page and in link previews">
          <textarea name="excerpt" rows={2} defaultValue={post.excerpt} className="input" />
        </Field>
        <Field label="Post" hint="Leave a blank line between paragraphs. Start a line with ## to make a heading.">
          <textarea name="body" rows={18} defaultValue={post.body} className="input leading-relaxed" />
        </Field>
      </Card>
      <div className="space-y-4">
        <Card className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={post.published} className="h-4 w-4 accent-ink" /> Published on the website
          </label>
          <Field label="URL handle" hint="Leave blank to generate from the title">
            <input name="slug" defaultValue={post.slug} className="input" />
          </Field>
          <SubmitButton className="btn btn-primary w-full rounded-xl">Save post</SubmitButton>
        </Card>
        <Card>
          <p className="mb-3 text-sm font-medium">Cover image</p>
          <ImageField name="cover" initial={post.cover} aspect="aspect-[4/3]" />
        </Card>
      </div>
    </ActionForm>
  );
}
