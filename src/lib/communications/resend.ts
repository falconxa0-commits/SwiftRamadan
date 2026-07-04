// Resend — Transactional email API
// Docs: https://resend.com/docs

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_BASE_URL = 'https://api.resend.com';

export async function sendEmail({
  to,
  subject,
  html,
  from = 'SwiftRamadan <noreply@swiftramadan.com>',
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string | null; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[Resend] Not configured — email would send to:', to, 'Subject:', subject);
    return { success: false, error: 'Resend not configured', messageId: null };
  }

  try {
    const response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (data.id) {
      return { success: true, messageId: data.id };
    }
    return { success: false, error: data.message || 'Failed to send' };
  } catch (error) {
    console.error('[Resend] Email error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendOTPEmail({
  to,
  code,
  name,
}: {
  to: string;
  code: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #0B0D14; color: white; padding: 32px; border-radius: 16px;">
      <h1 style="color: #10E07A; font-size: 24px;">Salam, ${name}! 🌙</h1>
      <p style="color: rgba(255,255,255,0.8); font-size: 16px;">Your SwiftRamadan verification code is:</p>
      <div style="background: rgba(16,224,122,0.1); border: 2px solid rgba(16,224,122,0.3); border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #10E07A;">${code}</span>
      </div>
      <p style="color: rgba(255,255,255,0.5); font-size: 13px;">This code expires in 5 minutes. If you didn't request this, please ignore.</p>
      <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;" />
      <p style="color: rgba(255,255,255,0.3); font-size: 11px;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
    </div>
  `;

  const result = await sendEmail({
    to,
    subject: 'Your SwiftRamadan Verification Code',
    html,
  });

  return { success: result.success, error: result.error };
}
