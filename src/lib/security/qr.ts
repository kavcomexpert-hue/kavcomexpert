/**
 * QR image URL for TOTP enrollment (otpauth URI).
 * Host is allowed under CSP report-only img-src.
 */
export function qrImageUrl(data: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
