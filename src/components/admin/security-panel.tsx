"use client";

import { authClient } from "@/lib/auth-client";
import { logSecurityEvent } from "@/actions/security";
import { qrImageUrl } from "@/lib/security/qr";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SecurityPanel({
  twoFactorEnabled,
  email,
  promptEnroll = false,
}: {
  twoFactorEnabled: boolean;
  email: string;
  promptEnroll?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function enableTwoFactor() {
    setLoading("enable");
    const result = await authClient.twoFactor.enable({ password });
    setLoading(null);

    if (result.error) {
      toast(result.error.message ?? "Could not enable 2FA", "error");
      return;
    }

    if (!result.data) {
      toast("Could not enable 2FA", "error");
      return;
    }

    setTotpURI(null);
    setBackupCodes(null);
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    await logSecurityEvent({ action: "two_factor_enable" });
    toast("Scan the QR code, then verify a code to finish setup");
  }

  async function verifyTwoFactor() {
    setLoading("verify");
    const result = await authClient.twoFactor.verifyTotp({
      code: verifyCode.trim(),
    });
    setLoading(null);

    if (result.error) {
      toast(result.error.message ?? "Invalid code", "error");
      return;
    }

    await logSecurityEvent({ action: "two_factor_verify" });
    toast("Two-factor authentication is active");
    setPassword("");
    setVerifyCode("");
    router.refresh();
    if (promptEnroll) {
      router.replace("/admin");
    }
  }

  async function disableTwoFactor() {
    setLoading("disable");
    const result = await authClient.twoFactor.disable({ password });
    setLoading(null);

    if (result.error) {
      toast(result.error.message ?? "Could not disable 2FA", "error");
      return;
    }

    setTotpURI(null);
    setBackupCodes(null);
    await logSecurityEvent({ action: "two_factor_disable" });
    toast("Two-factor authentication disabled");
    router.refresh();
  }

  async function changePassword() {
    if (newPassword.length < 12) {
      toast("New password must be at least 12 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }

    setLoading("password");
    const result = await authClient.changePassword({
      currentPassword: password,
      newPassword,
      revokeOtherSessions: true,
    });
    setLoading(null);

    if (result.error) {
      toast(result.error.message ?? "Could not change password", "error");
      return;
    }

    await logSecurityEvent({ action: "password_change" });
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast("Password updated. Other sessions were signed out.");
  }

  async function signOutEverywhere() {
    setLoading("revoke");
    const result = await authClient.revokeOtherSessions();
    setLoading(null);

    if (result.error) {
      toast(result.error.message ?? "Could not revoke sessions", "error");
      return;
    }

    await logSecurityEvent({ action: "session_revoke" });
    toast("Signed out of all other sessions");
  }

  function downloadBackupCodes() {
    if (!backupCodes?.length) return;
    const blob = new Blob(
      [
        `Kavcom Expert backup codes for ${email}\n`,
        `Generated: ${new Date().toISOString()}\n\n`,
        ...backupCodes.map((code) => `${code}\n`),
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kavcom-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-default border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Two-factor authentication
        </h2>
        <p className="mt-2 text-sm text-muted">
          Status:{" "}
          <span className="font-medium text-foreground">
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-foreground">
            Current password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClassName}
            autoComplete="current-password"
          />
        </div>

        {!twoFactorEnabled && !totpURI ? (
          <button
            type="button"
            disabled={!password || loading !== null}
            onClick={() => void enableTwoFactor()}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-60"
          >
            {loading === "enable" ? "Starting…" : "Enable 2FA"}
          </button>
        ) : null}

        {totpURI ? (
          <div className="mt-6 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl(totpURI)}
              alt="Scan with authenticator app"
              width={180}
              height={180}
              className="rounded-default border border-border bg-background p-2"
            />
            <p className="break-all font-mono text-xs text-muted">{totpURI}</p>
            {backupCodes ? (
              <div className="rounded-default border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Backup codes (save these)
                  </p>
                  <button
                    type="button"
                    onClick={downloadBackupCodes}
                    className="text-sm font-medium text-accent"
                  >
                    Download
                  </button>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-foreground">
                  {backupCodes.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Enter a code to activate
              </label>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className={fieldClassName}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <button
                type="button"
                disabled={!verifyCode || loading !== null}
                onClick={() => void verifyTwoFactor()}
                className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-60"
              >
                {loading === "verify" ? "Verifying…" : "Verify & activate"}
              </button>
            </div>
          </div>
        ) : null}

        {twoFactorEnabled ? (
          <button
            type="button"
            disabled={!password || loading !== null}
            onClick={() => void disableTwoFactor()}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-default border border-danger/30 px-5 text-sm font-medium text-danger disabled:opacity-60"
          >
            {loading === "disable" ? "Disabling…" : "Disable 2FA"}
          </button>
        ) : null}
      </section>

      <section className="rounded-default border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Change password
        </h2>
        <p className="mt-2 text-sm text-muted">
          Changing your password signs out all other sessions.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClassName}
            autoComplete="current-password"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={fieldClassName}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClassName}
            autoComplete="new-password"
          />
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void changePassword()}
            className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-60"
          >
            {loading === "password" ? "Updating…" : "Update password"}
          </button>
        </div>
      </section>

      <section className="rounded-default border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Sessions
        </h2>
        <p className="mt-2 text-sm text-muted">
          Sign out of every device except this one.
        </p>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void signOutEverywhere()}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-default border border-border px-5 text-sm font-medium text-foreground disabled:opacity-60"
        >
          {loading === "revoke" ? "Signing out…" : "Sign out everywhere"}
        </button>
      </section>
    </div>
  );
}
