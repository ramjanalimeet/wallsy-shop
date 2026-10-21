import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/ActionForm";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";

function CategoryFields({ c }: { c?: { id: string; name: string; slug: string; description: string; image: string; sortOrder: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Name">
        <input name="name" required defaultValue={c?.name} className="input" />
      </Field>
      <Field label="URL handle">
        <input name="slug" defaultValue={c?.slug} placeholder="auto" className="input" />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <input name="description" defaultValue={c?.description} className="input" />
      </Field>
      <Field label="Cover image URL">
        <input name="image" defaultValue={c?.image} placeholder="/art/…" className="input" />
      </Field>
      <Field label="Order in menu">
        <input name="sortOrder" type="number" min={0} defaultValue={c?.sortOrder ?? 0} className="input" />
      </Field>
    </div>
  );
}

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader title="Collections" subtitle="Collections appear in the store menu, on the home page and as shop filters." />
      <div className="space-y-4">
        {categories.map((c) => (
          <Card key={c.id}>
            <div className="flex gap-5">
              {c.image && <img src={c.image} alt="" className="hidden h-28 w-20 rounded-lg object-cover sm:block" />}
              <div className="flex-1">
                <ActionForm action={saveCategory} success="Collection saved">
                  <CategoryFields c={c} />
                  <div className="mt-3 flex items-center gap-3">
                    <SubmitButton className="btn btn-primary rounded-xl px-5 py-3">Save</SubmitButton>
                    <span className="text-sm text-muted">{c._count.products} products</span>
                  </div>
                </ActionForm>
                <form action={deleteCategory} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton message={`Delete “${c.name}”? Its products stay but lose this collection.`} className="text-sm text-red-600 hover:underline">
                    Delete collection
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </Card>
        ))}
        <Card>
          <p className="mb-3 font-semibold">New collection</p>
          <ActionForm action={saveCategory} success="Collection added" resetOnSuccess>
            <CategoryFields />
            <SubmitButton className="btn btn-primary mt-3 px-4 py-2 text-sm">Add collection</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
