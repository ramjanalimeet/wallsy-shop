"use client";

import { createContext, useActionState, useContext, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";

type State = { ok?: boolean; error?: string } | null;

const PendingContext = createContext(false);

export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const inActionForm = useContext(PendingContext);
  const { pending } = useFormStatus();
  const busy = inActionForm || pending;
  return (
    <button disabled={busy} className={className}>
      {busy ? "Saving…" : children}
    </button>
  );
}

/**
 * Form wired to a server action that returns {ok} or {error}, with inline feedback.
 * Submits via onSubmit (not the form `action` prop) so React doesn't clear what was
 * typed when the server sends back an error.
 */
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
  const [state, formAction, pending] = useActionState(action, null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <PendingContext.Provider value={pending}>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => formAction(data));
        }}
      >
        {children}
        {state?.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.ok && !pending && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ {success}</p>}
      </form>
    </PendingContext.Provider>
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
