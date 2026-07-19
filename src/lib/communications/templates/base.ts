// Shared email template base — Aurora Luxe branding
// Dark bg #0B0D14, green #10E07A, gold #F5C451

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatPhone(phone: string): string {
  if (phone.startsWith('234')) return `+${phone}`;
  if (phone.startsWith('0')) return phone;
  return `+234${phone}`;
}

function baseStyles(): string {
  return `
    body { margin: 0; padding: 0; background: #0B0D14; }
    .email-wrapper { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0B0D14; color: #ffffff; }
    .header { text-align: center; padding: 32px 24px 16px; }
    .logo { font-size: 28px; font-weight: 900; color: #10E07A; text-decoration: none; }
    .logo span { color: #F5C451; }
    .content { padding: 0 24px; }
    .footer { text-align: center; padding: 24px; color: rgba(255,255,255,0.3); font-size: 12px; }
    .footer a { color: #10E07A; text-decoration: none; }
    .button { display: inline-block; background: #10E07A; color: #0B0D14; font-weight: 700; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; }
    .button-gold { background: #F5C451; }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 16px 0; }
    .highlight { color: #10E07A; }
    .gold { color: #F5C451; }
    .muted { color: rgba(255,255,255,0.5); }
    .small { font-size: 13px; }
    @media only screen and (max-width: 480px) {
      .content { padding: 0 16px; }
      .logo { font-size: 22px; }
    }
  `;
}

export function wrapEmail(innerHtml: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SwiftRamadan</title>
  ${preheader ? `<style> .preheader { display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; } </style>` : ''}
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="header">
      <a class="logo" href="#">🌙 Swift<span>Ramadan</span></a>
    </div>
    ${innerHtml}
    <hr class="divider" />
    <div class="footer">
      <p>SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      <p>Lagos, Nigeria &bull; <a href="#">Unsubscribe</a> &bull; <a href="#">Preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

export { baseStyles };
