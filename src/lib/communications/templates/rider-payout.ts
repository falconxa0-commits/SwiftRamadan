// Rider Payout Email Template — Aurora Luxe branded

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function riderPayoutTemplate(data: {
  riderName: string;
  amount: number;
  period: string;
  deliveries: number;
  bonusAmount?: number;
  bankName: string;
  accountNumber: string;
  payoutId: string;
}): { subject: string; html: string; text: string } {
  const formattedAmount = `₦${data.amount.toLocaleString()}`;
  const formattedBonus = data.bonusAmount ? `₦${data.bonusAmount.toLocaleString()}` : null;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(16,224,122,0.2),rgba(245,196,81,0.08));padding:32px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🛵💰</div>
        <h1 style="color:${GREEN};font-size:22px;font-weight:800;margin:0 0 4px;">Payout Processed!</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">${data.period}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 20px;">
          Salam ${data.riderName}! 🌙 Your earnings have been credited.
        </p>

        <!-- Payout Amount -->
        <div style="background:linear-gradient(135deg,rgba(16,224,122,0.12),rgba(16,224,122,0.04));border:2px solid rgba(16,224,122,0.3);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">PAYOUT AMOUNT</p>
          <p style="color:${GREEN};font-size:36px;font-weight:900;margin:0;">${formattedAmount}</p>
        </div>

        <!-- Stats -->
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px;text-align:center;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">DELIVERIES</p>
            <p style="color:${BLUE};font-size:20px;font-weight:700;margin:0;">${data.deliveries}</p>
          </div>
          ${formattedBonus ? `
            <div style="flex:1;background:rgba(245,196,81,0.06);border:1px solid rgba(245,196,81,0.15);border-radius:10px;padding:14px;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">BONUS</p>
              <p style="color:${GOLD};font-size:20px;font-weight:700;margin:0;">${formattedBonus}</p>
            </div>
          ` : ''}
        </div>

        <!-- Bank Details -->
        <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:16px;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 8px;">CREDITED TO</p>
          <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 4px;">${data.bankName}</p>
          <p style="color:${BLUE};font-size:14px;font-weight:600;margin:0;">${data.accountNumber}</p>
        </div>

        <!-- Payout ID -->
        <div style="text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">Payout ID: ${data.payoutId}</p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="#" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">View Earnings</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Rider Dashboard 🛵</p>
      </div>
    </div>
  `;

  const text = `
Salam ${data.riderName}! 🌙🛵💰

Your payout for ${data.period} has been processed!

Amount: ${formattedAmount}
Deliveries: ${data.deliveries}
${formattedBonus ? `Bonus: ${formattedBonus}` : ''}

Credited to: ${data.bankName} — ${data.accountNumber}
Payout ID: ${data.payoutId}

Keep up the great work! 🚀

SwiftRamadan — Rider Dashboard 🛵
  `.trim();

  return {
    subject: `💰 Payout: ${formattedAmount} processed! | SwiftRamadan Rider`,
    html,
    text,
  };
}
