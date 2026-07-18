// Gift Card Email Template — Aurora Luxe branded

import { formatNaira } from '@/lib/format';

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function giftCardTemplate(data: {
  recipientName: string;
  senderName: string;
  amount: number;
  code: string;
  message?: string;
  expiresAt?: string;
}): { subject: string; html: string; text: string } {
  const formattedAmount = formatNaira(data.amount);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(245,196,81,0.2),rgba(16,224,122,0.1));padding:32px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🎁</div>
        <h1 style="color:${GOLD};font-size:22px;font-weight:800;margin:0 0 4px;">You Got a Gift Card!</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">From ${data.senderName}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 20px;">
          Salam ${data.recipientName}! 🌙
        </p>

        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 24px;">
          <strong style="color:${GOLD};">${data.senderName}</strong> sent you a SwiftRamadan gift card!
        </p>

        <!-- Gift Card Amount -->
        <div style="background:linear-gradient(135deg,rgba(245,196,81,0.12),rgba(245,196,81,0.04));border:2px solid rgba(245,196,81,0.3);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">GIFT AMOUNT</p>
          <p style="color:${GOLD};font-size:36px;font-weight:900;margin:0;">${formattedAmount}</p>
        </div>

        <!-- Gift Code -->
        <div style="background:rgba(16,224,122,0.08);border:1px dashed rgba(16,224,122,0.4);border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 6px;">YOUR CODE</p>
          <p style="color:${GREEN};font-size:24px;font-weight:800;letter-spacing:4px;margin:0;">${data.code}</p>
        </div>

        ${data.message ? `
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 6px;">MESSAGE FROM ${data.senderName.toUpperCase()}</p>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;font-style:italic;margin:0;">"${data.message}"</p>
          </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="#" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Redeem Now</a>
        </div>

        ${data.expiresAt ? `
          <p style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center;margin-top:16px;">Expires: ${data.expiresAt}</p>
        ` : ''}
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      </div>
    </div>
  `;

  const text = `
Salam ${data.recipientName}! 🌙🎁

${data.senderName} sent you a SwiftRamadan gift card!

Amount: ${formattedAmount}
Code: ${data.code}
${data.message ? `Message: "${data.message}"` : ''}
${data.expiresAt ? `Expires: ${data.expiresAt}` : ''}

Use this code at checkout to redeem your gift card!

SwiftRamadan — Smart Kitchen & Halal Delivery 🕌
  `.trim();

  return {
    subject: `🎁 You received a ${formattedAmount} gift card from ${data.senderName}! | SwiftRamadan`,
    html,
    text,
  };
}
