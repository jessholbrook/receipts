"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="form" style={{ maxWidth: 420 }}>
      <div className="field">
        <label htmlFor="passphrase">Moderator passphrase</label>
        <input id="passphrase" name="passphrase" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
