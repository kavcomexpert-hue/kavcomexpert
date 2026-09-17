import { PageHeader } from "@/components/admin/page-header";
import { SecurityPanel } from "@/components/admin/security-panel";
import { requirePageSession } from "@/lib/admin/session";

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ enroll?: string }>;
}) {
  const session = await requirePageSession();
  const params = await searchParams;
  const enroll = params.enroll === "1";

  const twoFactorEnabled = Boolean(
    (session.user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security"
        description="Two-factor authentication, password, and session controls."
      />
      {enroll && !twoFactorEnabled ? (
        <div className="rounded-default border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          Finish setup by enabling two-factor authentication below, then continue
          to the dashboard.
        </div>
      ) : null}
      <SecurityPanel
        twoFactorEnabled={twoFactorEnabled}
        email={session.user.email}
        promptEnroll={enroll && !twoFactorEnabled}
      />
    </div>
  );
}
