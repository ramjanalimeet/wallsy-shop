"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary rounded-xl px-5 py-2.5">
      Print / Save as PDF
    </button>
  );
}
