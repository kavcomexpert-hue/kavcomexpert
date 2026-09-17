"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type AuditRow = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

export function AuditLogTable({
  rows,
  actionFilter,
  entityTypeFilter,
  userFilter,
  actionOptions,
  entityOptions,
  userOptions,
}: {
  rows: AuditRow[];
  actionFilter: string | null;
  entityTypeFilter: string | null;
  userFilter: string | null;
  actionOptions: string[];
  entityOptions: string[];
  userOptions: UserOption[];
}) {
  const router = useRouter();

  function updateFilters(next: {
    action?: string;
    entityType?: string;
    userId?: string;
  }) {
    const params = new URLSearchParams();
    const action = next.action ?? actionFilter ?? "";
    const entityType = next.entityType ?? entityTypeFilter ?? "";
    const userId = next.userId ?? userFilter ?? "";
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    if (userId) params.set("userId", userId);
    const qs = params.toString();
    router.push(qs ? `/admin/audit-log?${qs}` : "/admin/audit-log");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter ?? ""}
          onChange={(e) => updateFilters({ action: e.target.value })}
          className="h-10 rounded-default border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">All actions</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        <select
          value={entityTypeFilter ?? ""}
          onChange={(e) => updateFilters({ entityType: e.target.value })}
          className="h-10 rounded-default border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">All entities</option>
          {entityOptions.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
        <select
          value={userFilter ?? ""}
          onChange={(e) => updateFilters({ userId: e.target.value })}
          className="h-10 rounded-default border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">All users</option>
          {userOptions.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
        {actionFilter || entityTypeFilter || userFilter ? (
          <Link
            href="/admin/audit-log"
            className="inline-flex h-10 items-center text-sm text-accent"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-default border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted"
                >
                  No audit events yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.action}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.entityType}
                    {row.entityId ? (
                      <span className="ml-1 font-mono text-xs">
                        {row.entityId.slice(0, 8)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.userName || row.userEmail ? (
                      <span>
                        <span className="text-foreground">
                          {row.userName ?? "Unknown"}
                        </span>
                        {row.userEmail ? (
                          <span className="ml-1 font-mono text-xs">
                            {row.userEmail}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="font-mono text-xs">
                        {row.userId?.slice(0, 8) ?? "-"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {row.ip ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
