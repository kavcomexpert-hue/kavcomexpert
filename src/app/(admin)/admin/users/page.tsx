import { PageHeader } from "@/components/admin/page-header";
import { UsersManager } from "@/components/admin/users-manager";
import { requireAdminPageSession } from "@/lib/admin/session";
import {
  getAdminUsers,
  getPendingInvitations,
} from "@/lib/queries/admin-users";

export default async function AdminUsersPage() {
  const session = await requireAdminPageSession();
  const [users, invitations] = await Promise.all([
    getAdminUsers(),
    getPendingInvitations(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Invite teammates, manage roles, and suspend accounts. Invitation is the only way in."
      />
      <UsersManager
        users={users}
        invitations={invitations}
        currentUserId={session.user.id}
      />
    </div>
  );
}
