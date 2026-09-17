import { PageHeader } from "@/components/admin/page-header";
import { AuditLogTable } from "@/components/admin/audit-log-table";
import { requireAdminPageSession } from "@/lib/admin/session";
import { getDb } from "@/lib/db";
import { auditLog, user } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";

type SearchParams = Promise<{
  action?: string;
  entityType?: string;
  userId?: string;
}>;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminPageSession();

  const params = await searchParams;
  const action = params.action?.trim() || null;
  const entityType = params.entityType?.trim() || null;
  const userId = params.userId?.trim() || null;

  const filters = [];
  if (action) filters.push(eq(auditLog.action, action));
  if (entityType) filters.push(eq(auditLog.entityType, entityType));
  if (userId) filters.push(eq(auditLog.userId, userId));

  const rows = await getDb()
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      userName: user.name,
      userEmail: user.email,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      meta: auditLog.meta,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userId, user.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  const actionOptions = await getDb()
    .selectDistinct({ action: auditLog.action })
    .from(auditLog)
    .orderBy(auditLog.action);

  const entityOptions = await getDb()
    .selectDistinct({ entityType: auditLog.entityType })
    .from(auditLog)
    .orderBy(auditLog.entityType);

  const userIdRows = await getDb()
    .selectDistinct({ userId: auditLog.userId })
    .from(auditLog)
    .where(isNotNull(auditLog.userId));

  const distinctUserIds = userIdRows
    .map((row) => row.userId)
    .filter((id): id is string => Boolean(id));

  const userOptions =
    distinctUserIds.length > 0
      ? await getDb()
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(inArray(user.id, distinctUserIds))
          .orderBy(user.name)
      : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        description="Mutating admin actions and security events. Entries older than 90 days are removed automatically."
      />
      <AuditLogTable
        rows={rows.map((row) => ({
          ...row,
          createdAt: row.createdAt?.toISOString() ?? "",
          meta: row.meta as Record<string, unknown> | null,
        }))}
        actionFilter={action}
        entityTypeFilter={entityType}
        userFilter={userId}
        actionOptions={actionOptions.map((r) => r.action)}
        entityOptions={entityOptions.map((r) => r.entityType)}
        userOptions={userOptions}
      />
    </div>
  );
}
