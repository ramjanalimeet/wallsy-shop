import { deleteDiscount, saveDiscount, toggleDiscount } from "@/app/admin/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/ActionForm";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import Link from "next/link";
import { db } from "@/lib/db";
import { dhakaDateInput, formatDhakaDate } from "@/lib/finance";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [settings, codes] = await Promise.all([getSettings(), db.discountCode.findMany({ orderBy: { createdAt: "desc" } })]);
  const editing = codes.find((c) => c.id === edit);
  const now = new Date();
  const m = (c: number) => money(c, settings.currency);

  return (
    <>
      <PageHeader title="Discount codes" subtitle={`Customers enter these at checkout. Your newsletter sign-up code is ${settings.newsletterCode} — make sure it exists here.`} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-[#ece8e1] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#ece8e1] text-left text-xs font-medium uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min. spend</th>
                <th className="p-3">Used</th>
                <th className="p-3">Expires</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {codes.map((d) => (
                <tr key={d.id} className={d.active && !(d.expiresAt && d.expiresAt < now) ? "" : "opacity-50"}>
                  <td className="p-3 font-mono font-semibold">{d.code}</td>
                  <td className="p-3">{d.type === "percent" ? `${d.value}% off` : `${m(d.value)} off`}</td>
                  <td className="p-3 text-muted">{d.minSubtotal ? m(d.minSubtotal) : "—"}</td>
                  <td className="p-3 text-muted">
                    {d.usedCount}
                    {d.maxUses ? ` / ${d.maxUses}` : ""}
                  </td>
                  <td className="p-3 text-muted">{d.expiresAt ? (d.expiresAt < now ? "Expired" : formatDhakaDate(d.expiresAt)) : "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/discounts?edit=${d.id}`} className="text-sm font-medium hover:underline">
                        Edit
                      </Link>
                      <form action={toggleDiscount}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-sm font-medium hover:underline">{d.active ? "Disable" : "Enable"}</button>
                      </form>
                      <form action={deleteDiscount}>
                        <input type="hidden" name="id" value={d.id} />
                        <ConfirmButton message={`Delete ${d.code}?`} className="text-sm text-red-600 hover:underline">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card className="h-fit">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{editing ? `Edit ${editing.code}` : "Create a code"}</p>
            {editing && (
              <Link href="/admin/discounts" className="text-sm text-muted hover:underline">
                Cancel
              </Link>
            )}
          </div>
          <ActionForm key={editing?.id ?? "new"} action={saveDiscount} success="Code created" resetOnSuccess={!editing} className="space-y-3">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Code">
              <input name="code" required defaultValue={editing?.code} placeholder="EID20" className="input font-mono uppercase" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="type" defaultValue={editing?.type} className="input">
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </Field>
              <Field label="Value" hint="20 = 20% or 20.00">
                <input name="value" required inputMode="decimal" defaultValue={editing ? (editing.type === "percent" ? editing.value : editing.value / 100) : ""} className="input" />
              </Field>
              <Field label={`Min. spend (${settings.currency})`}>
                <input name="minSubtotal" inputMode="decimal" placeholder="0" defaultValue={editing?.minSubtotal ? editing.minSubtotal / 100 : ""} className="input" />
              </Field>
              <Field label="Max uses" hint="Blank = unlimited">
                <input name="maxUses" type="number" min={1} defaultValue={editing?.maxUses ?? ""} className="input" />
              </Field>
              <Field label="Expires on" hint="Blank = never" className="col-span-2">
                <input name="expiresAt" type="date" defaultValue={editing?.expiresAt ? dhakaDateInput(editing.expiresAt) : ""} className="input" />
              </Field>
            </div>
            <SubmitButton className="btn btn-primary w-full rounded-xl">{editing ? "Save changes" : "Create code"}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
