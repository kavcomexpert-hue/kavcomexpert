import { AdminShell } from "@/components/admin/admin-shell";
import { getOptionalPageSession } from "@/lib/admin/session";
import { parseAppRole } from "@/lib/authz";
import { getSiteSettings } from "@/lib/queries/admin-content";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Soft read: Neon/Better Auth blips must never crash the whole admin shell.
  const session = await getOptionalPageSession();

  if (!session) {
    return children;
  }

  let maintenanceMode = false;
  try {
    const settings = await getSiteSettings();
    maintenanceMode = Boolean(settings?.maintenanceMode);
  } catch {
    maintenanceMode = false;
  }

  return (
    <AdminShell
      userEmail={session.user.email}
      role={parseAppRole(session.user.role)}
      maintenanceMode={maintenanceMode}
    >
      {children}
    </AdminShell>
  );
}
