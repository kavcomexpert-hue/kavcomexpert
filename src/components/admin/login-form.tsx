"use client";

import { authClient } from "@/lib/auth-client";
import { setClientMarkerCookie, STAFF_MARKER_COOKIE } from "@/lib/auth/marker-cookies";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "credentials" | "two-factor";

const GENERIC_ERROR = "Invalid email or password";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/admin";
  }
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const sessionBlip = searchParams.get("error") === "session";
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    sessionBlip
      ? "Database connection timed out. Sign in again, or refresh and retry."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(GENERIC_ERROR);
        return;
      }

      if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      ) {
        setStep("two-factor");
        return;
      }

      setClientMarkerCookie(STAFF_MARKER_COOKIE);
      router.push(nextPath);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const trimmed = code.trim();

    try {
      const result =
        trimmed.length === 6
          ? await authClient.twoFactor.verifyTotp({ code: trimmed })
          : await authClient.twoFactor.verifyBackupCode({ code: trimmed });

      if (result.error) {
        setError(GENERIC_ERROR);
        return;
      }

      setClientMarkerCookie(STAFF_MARKER_COOKIE);
      router.push(nextPath);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  if (step === "two-factor") {
    return (
      <form onSubmit={handleTwoFactor} className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="text-sm font-medium text-foreground">
            Authentication code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={16}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\s/g, ""))
            }
            placeholder="6-digit code"
            className="h-11 rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <p className="text-xs text-muted">
            Enter the 6-digit code from your authenticator app. Backup codes
            also work.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || code.trim().length < 6}
          className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setCode("");
            setError(null);
          }}
          className="text-sm text-muted hover:text-foreground"
        >
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentials} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 rounded-default border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
