import { deleteDiscount, saveDiscount, toggleDiscount } from "@/app/admin/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/ActionForm";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export default async function DiscountsPage() {
  const [settings, codes] = await Promise.all([getSettings(), db.discountCode.findMany({ orderBy: { createdAt: "desc" } })]);
  const m = (c: number) => money(c, settings.currency);

  return (
    <>
      <PageHeader title="Discount codes" subtitle={`Customers enter these at checkout. Your newsletter sign-up code is ${settings.newsletterCode} — make sure it exists here.`} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min. spend</th>
                <th className="p-3">Used</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {codes.map((d) => (
                <tr key={d.id} className={d.active ? "" : "opacity-50"}>
                  <td className="p-3 font-mono font-semibold">{d.code}</td>
                  <td className="p-3">{d.type === "percent" ? `${d.value}% off` : `${m(d.value)} off`}</td>
                  <td className="p-3 text-muted">{d.minSubtotal ? m(d.minSubtotal) : "—"}</td>
                  <td className="p-3 text-muted">
                    {d.usedCount}
                    {d.maxUses ? ` / ${d.maxUses}` : ""}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-3">
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
          <p className="mb-3 font-semibold">Create a code</p>
          <ActionForm action={saveDiscount} success="Code created" resetOnSuccess className="space-y-3">
            <Field label="Code">
              <input name="code" required placeholder="SUMMER20" className="input font-mono uppercase" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="type" className="input">
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </Field>
              <Field label="Value" hint="20 = 20% or 20.00">
                <input name="value" required inputMode="decimal" className="input" />
              </Field>
              <Field label={`Min. spend (${settings.currency})`}>
                <input name="minSubtotal" inputMode="decimal" placeholder="0" className="input" />
              </Field>
              <Field label="Max uses" hint="Blank = unlimited">
                <input name="maxUses" type="number" min={1} className="input" />
              </Field>
            </div>
            <SubmitButton className="btn btn-primary w-full">Create code</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
