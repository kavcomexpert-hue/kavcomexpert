import { InviteAcceptForm } from "@/components/admin/invite-accept-form";
import { getInvitationPreview } from "@/actions/users";
import Link from "next/link";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitationPreview(token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-foreground">
            Kavcom Expert
          </p>
          <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
            Accept invitation
          </h1>
        </div>

        {preview.valid ? (
          <InviteAcceptForm
            token={token}
            email={preview.email}
            role={preview.role}
          />
        ) : (
          <div className="rounded-default border border-border bg-surface p-6 text-center">
            <p className="text-sm text-danger">{preview.error}</p>
            <Link
              href="/admin/login"
              className="mt-4 inline-flex text-sm font-medium text-accent"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
