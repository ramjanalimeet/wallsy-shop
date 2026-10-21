"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm({ withEmail }: { withEmail: boolean }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      {withEmail && <input name="email" type="email" required autoFocus autoComplete="username" placeholder="Email" className="input" />}
      <input name="password" type="password" required autoFocus={!withEmail} autoComplete="current-password" placeholder="Password" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
