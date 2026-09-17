import { Resend } from "resend";

type LeadNotificationInput = {
  source: string;
  name?: string | null;
  email: string;
  company?: string | null;
  message?: string | null;
  path?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendLeadNotification(
  input: LeadNotificationInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL || process.env.ADMIN_SEED_EMAIL;

  if (!apiKey || !to) {
    return;
  }

  const resend = new Resend(apiKey);
  const rows = [
    ["Source", input.source],
    ["Name", input.name?.trim() || "N/A"],
    ["Email", input.email],
    ["Company", input.company?.trim() || "N/A"],
    ["Path", input.path?.trim() || "N/A"],
    ["Message", input.message?.trim() || "N/A"],
  ];

  const html = `
    <h2>New lead from ${escapeHtml(input.source)}</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="font-weight:600;">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `New lead: ${input.source}`,
    html,
  });
}
