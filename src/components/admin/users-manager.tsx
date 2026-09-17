"use client";

import {
  changeUserRole,
  deleteUser,
  inviteUser,
  revokeInvitation,
  setUserSuspended,
} from "@/actions/users";
import { useToast } from "@/components/ui/toast";
import type { AppRole } from "@/lib/authz";
import type {
  AdminUserListItem,
  PendingInvitation,
} from "@/lib/queries/admin-users";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "h-11 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const ROLES: AppRole[] = ["admin", "editor", "author"];

export function UsersManager({
  users,
  invitations,
  currentUserId,
}: {
  users: AdminUserListItem[];
  invitations: PendingInvitation[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("author");
  const [allowExternalEmail, setAllowExternalEmail] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy("invite");
    const result = await inviteUser({ email, role, allowExternalEmail });
    setBusy(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setEmail("");
    setAllowExternalEmail(false);
    toast(result.message ?? "Invitation sent");
    router.refresh();
  }

  async function handleRoleChange(userId: string, nextRole: AppRole) {
    setBusy(`role-${userId}`);
    const result = await changeUserRole({ userId, role: nextRole });
    setBusy(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Role updated");
    router.refresh();
  }

  async function handleSuspend(userId: string, suspended: boolean) {
    setBusy(`suspend-${userId}`);
    const result = await setUserSuspended({ userId, suspended });
    setBusy(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast(suspended ? "User suspended" : "User reactivated");
    router.refresh();
  }

  async function handleDelete(userId: string) {
    if (
      !window.confirm(
        "Delete this suspended user? Their content will be reassigned to an admin.",
      )
    ) {
      return;
    }
    setBusy(`delete-${userId}`);
    const result = await deleteUser({ userId });
    setBusy(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("User deleted");
    router.refresh();
  }

  async function handleRevoke(invitationId: string) {
    setBusy(`invite-${invitationId}`);
    const result = await revokeInvitation({ invitationId });
    setBusy(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Invitation revoked");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section className="rounded-default border border-border bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Invite user
        </h2>
        <p className="mt-2 text-sm text-muted">
          Invitation is the only way in. Signup stays disabled. Links expire in
          48 hours.
        </p>
        <form
          onSubmit={(e) => void handleInvite(e)}
          className="mt-4 space-y-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              placeholder="name@kavcomexpert.com"
            />
          </div>
          <div className="w-full space-y-2 sm:w-56">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className={fieldClassName}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted">
              {role === "admin"
                ? "Admin: users, settings, redirects, audit log, and CSV export, plus full content."
                : role === "editor"
                  ? "Editor: full content CRUD/publish, leads, menus, and SEO. No user/settings admin."
                  : "Author: own posts and case studies plus media. Cannot publish or manage site-wide content."}
            </p>
          </div>
          <button
            type="submit"
            disabled={busy !== null}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-60"
          >
            {busy === "invite" ? "Sending…" : "Send invite"}
          </button>
          </div>
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allowExternalEmail}
              onChange={(e) => setAllowExternalEmail(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border text-accent focus:ring-accent"
            />
            <span>
              Allow external email
              <span className="mt-0.5 block text-xs text-muted">
                Override the default company-domain restriction for this invite
                (contractors/clients). Logged in the audit trail.
              </span>
            </span>
          </label>
        </form>
      </section>

      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Pending invitations
          </h2>
          <div className="overflow-x-auto rounded-default border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-border">
                    <td className="px-4 py-3 text-foreground">{inv.email}</td>
                    <td className="px-4 py-3 capitalize text-muted">{inv.role}</td>
                    <td className="px-4 py-3 text-muted">
                      {dateFmt.format(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void handleRevoke(inv.id)}
                        className="text-sm font-medium text-danger"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Team
        </h2>
        <p className="text-xs text-muted">
          Roles: admin (users, settings, redirects, audit, export) · editor
          (full content CRUD/publish, leads, menus) · author (own posts and
          case studies + media; cannot publish).
        </p>
        <div className="overflow-x-auto rounded-default border border-border">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">2FA</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted">(you)</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={busy !== null || isSelf}
                        onChange={(e) =>
                          void handleRoleChange(
                            u.id,
                            e.target.value as AppRole,
                          )
                        }
                        className="h-9 rounded-default border border-border bg-background px-2 text-sm capitalize text-foreground"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {u.twoFactorEnabled ? "On" : "Off"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {u.lastActiveAt
                        ? dateFmt.format(u.lastActiveAt)
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.suspended
                            ? "bg-danger/10 text-danger"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {u.suspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        {!isSelf ? (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() =>
                              void handleSuspend(u.id, !u.suspended)
                            }
                            className="text-sm font-medium text-foreground"
                          >
                            {u.suspended ? "Reactivate" : "Suspend"}
                          </button>
                        ) : null}
                        {u.suspended && !isSelf ? (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => void handleDelete(u.id)}
                            className="text-sm font-medium text-danger"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
