"use client";

import { useState } from "react";
import { addFinanceEntry } from "@/app/admin/actions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance-categories";
import { ActionForm, SubmitButton } from "./ActionForm";
import { Field } from "./ui";

export function FinanceEntryForm({ currency, today }: { currency: string; today: string }) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <ActionForm action={addFinanceEntry} success="Saved" resetOnSuccess className="space-y-3">
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f1efea] p-1 text-sm">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-lg py-2 font-medium capitalize ${type === t ? "bg-white shadow-sm" : "text-ink/60"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <Field label={`Amount (${currency})`}>
        <input name="amount" required inputMode="decimal" placeholder="0" className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select key={type} name="category" className="input">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input name="date" type="date" required defaultValue={today} className="input" />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input name="note" placeholder={type === "expense" ? "e.g. 50 A3 prints from Nilkhet" : "e.g. Sold 3 prints at a fair"} className="input" />
      </Field>
      <SubmitButton className="btn btn-primary w-full rounded-xl">{type === "expense" ? "Add expense" : "Add income"}</SubmitButton>
    </ActionForm>
  );
}
