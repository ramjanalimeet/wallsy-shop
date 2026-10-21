"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

type State = { ok?: boolean; error?: string } | null;

export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Form wired to a server action that returns {ok} or {error}, with inline feedback. */
export function ActionForm({
  action,
  children,
  success = "Saved",
  resetOnSuccess = false,
  className,
}: {
  action: (state: State, form: FormData) => Promise<State>;
  children: React.ReactNode;
  success?: string;
  resetOnSuccess?: boolean;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state?.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ {success}</p>}
    </form>
  );
}

export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
