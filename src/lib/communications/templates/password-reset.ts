// Password Reset Email Template — Aurora Luxe branded

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function passwordResetTemplate(data: {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(56,189,248,0.15),rgba(16,224,122,0.08));padding:32px 24px;text-align:center;">
        <div style="font-size:42px;margin-bottom:8px;">🔐</div>
        <h1 style="color:${BLUE};font-size:22px;font-weight:800;margin:0 0 4px;">Reset Your Password</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">SwiftRamadan Account</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 16px;">
          Salam ${data.name},
        </p>

        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 24px;">
          We received a request to reset your SwiftRamadan password. Click the button below to create a new password.
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${data.resetUrl}" style="display:inline-block;background:${BLUE};color:#fff;font-weight:700;font-size:14px;padding:14px 36px;border-radius:8px;text-decoration:none;">Reset Password</a>
        </div>

        <!-- Fallback Link -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 6px;">If the button doesn't work, copy and paste this link:</p>
          <p style="color:${BLUE};font-size:12px;word-break:break-all;margin:0;">${data.resetUrl}</p>
        </div>

        <!-- Expiry Warning -->
        <div style="background:rgba(245,196,81,0.08);border:1px solid rgba(245,196,81,0.2);border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
          <p style="color:${GOLD};font-size:13px;font-weight:600;margin:0;">⏳ This link expires in ${data.expiresInMinutes} minutes</p>
        </div>

        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      </div>
    </div>
  `;

  const text = `
Salam ${data.name},

We received a request to reset your SwiftRamadan password.

Reset your password by visiting this link:
${data.resetUrl}

This link expires in ${data.expiresInMinutes} minutes.

If you didn't request this, you can safely ignore this email. Your password will remain unchanged.

SwiftRamadan — Smart Kitchen & Halal Delivery 🕌
  `.trim();

  return {
    subject: `🔐 Reset Your Password | SwiftRamadan`,
    html,
    text,
  };
}
