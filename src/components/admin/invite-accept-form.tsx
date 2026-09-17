"use client";

import { acceptInvitation } from "@/actions/users";
import { authClient } from "@/lib/auth-client";
import {
  setClientMarkerCookie,
  STAFF_MARKER_COOKIE,
} from "@/lib/auth/marker-cookies";
import type { AppRole } from "@/lib/authz";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function InviteAcceptForm({
  token,
  email,
  role,
}: {
  token: string;
  email: string;
  role: AppRole;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await acceptInvitation({ token, name, password });
    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const signIn = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signIn.error) {
      setError(
        signIn.error.message ??
          "Account created. Sign in at /admin/login, then open Security to enable 2FA.",
      );
      return;
    }

    setClientMarkerCookie(STAFF_MARKER_COOKIE);
    router.replace("/admin/security?enroll=1");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-md space-y-5">
      <div>
        <p className="text-sm text-muted">Invited as</p>
        <p className="mt-1 font-medium capitalize text-foreground">{role}</p>
      </div>
      <div>
        <p className="text-sm text-muted">Email</p>
        <p className="mt-1 font-medium text-foreground">{email}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Your name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClassName}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Password (min 12 characters)
        </label>
        <input
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClassName}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          type="password"
          required
          minLength={12}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={fieldClassName}
          autoComplete="new-password"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
