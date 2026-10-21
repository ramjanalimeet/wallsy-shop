"use client";

import { useState } from "react";
import type { Faq, Trust } from "@/lib/content";

/** Editable list of FAQ questions and answers, saved as JSON in a hidden field. */
export function FaqEditor({ name, initial }: { name: string; initial: Faq[] }) {
  const [rows, setRows] = useState(initial);
  const set = (i: number, patch: Partial<Faq>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const n = [...r];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => r.q.trim()))} />
      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-line p-3">
          <div className="flex gap-2">
            <input value={r.q} onChange={(e) => set(i, { q: e.target.value })} placeholder="Question" className="input font-medium" />
            <div className="flex shrink-0 items-center gap-1 text-sm">
              {i > 0 && (
                <button type="button" onClick={() => move(i, -1)} className="rounded-md px-2 py-1 hover:bg-sand" title="Move up">
                  ↑
                </button>
              )}
              {i < rows.length - 1 && (
                <button type="button" onClick={() => move(i, 1)} className="rounded-md px-2 py-1 hover:bg-sand" title="Move down">
                  ↓
                </button>
              )}
              <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50">
                Remove
              </button>
            </div>
          </div>
          <textarea value={r.a} onChange={(e) => set(i, { a: e.target.value })} placeholder="Answer" rows={2} className="input mt-2" />
        </div>
      ))}
      <button type="button" onClick={() => setRows((r) => [...r, { q: "", a: "" }])} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-ink">
        + Add question
      </button>
    </div>
  );
}

/** The four trust badges under the home page hero. */
export function TrustEditor({ name, initial }: { name: string; initial: Trust[] }) {
  const [rows, setRows] = useState(initial);
  const icons = ["🚚", "🛡️", "↩️", "🍃"];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 rounded-xl border border-line p-3">
          <span className="pt-2 text-lg">{icons[i]}</span>
          <div className="flex-1 space-y-2">
            <input value={r.title} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Title" className="input font-medium" />
            <input value={r.text} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="Short text" className="input" />
          </div>
        </div>
      ))}
    </div>
  );
}
