import { Resend } from "resend";

type ConfirmationInput = {
  name: string;
  email: string;
  bookingUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendHoustonCpaConfirmation(
  input: ConfirmationInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const first = input.name.trim().split(/\s+/)[0] || "there";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: input.email,
    subject: "We got your note. Next step: book the fit call",
    html: `
      <p>Hi ${escapeHtml(first)},</p>
      <p>Thanks for reaching out about marketing and back office support for your Houston CPA firm.</p>
      <p>A strategist typically replies within one business day. If you have not booked yet, grab a 20 minute fit call here:</p>
      <p><a href="${escapeHtml(input.bookingUrl)}">${escapeHtml(input.bookingUrl)}</a></p>
      <p>No payment is taken before that call.</p>
      <p>— Kavcom Expert</p>
    `,
  });
}
