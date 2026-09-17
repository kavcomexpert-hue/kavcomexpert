import { Resend } from "resend";

type InvitationEmailInput = {
  to: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";

  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  const resend = new Resend(apiKey);
  const expiresLabel = input.expiresAt.toUTCString();

  const html = `
    <h2>You're invited to Kavcom Expert</h2>
    <p>You've been invited as <strong>${escapeHtml(input.role)}</strong>.</p>
    <p>This link expires <strong>${escapeHtml(expiresLabel)}</strong> and can only be used once.</p>
    <p><a href="${escapeHtml(input.inviteUrl)}">Set your password and join</a></p>
    <p style="color:#666;font-size:12px;">If you did not expect this email, you can ignore it.</p>
  `;

  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: "Your Kavcom Expert invitation",
    html,
  });

  if (result.error) {
    return { sent: false, error: result.error.message };
  }

  return { sent: true };
}
