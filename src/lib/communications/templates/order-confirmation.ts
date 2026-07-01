// Order Confirmation Email Template — Aurora Luxe branded

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function orderConfirmationTemplate(data: {
  name: string;
  orderId: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  estimatedDelivery: string;
}): { subject: string; html: string; text: string } {
  const formattedTotal = `₦${data.total.toLocaleString()}`;
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;color:rgba(255,255,255,0.9);font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06);">${item.name}</td>
        <td style="padding:10px 12px;color:rgba(255,255,255,0.6);font-size:14px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">x${item.qty}</td>
        <td style="padding:10px 12px;color:${GOLD};font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">₦${item.price.toLocaleString()}</td>
      </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(16,224,122,0.15),rgba(56,189,248,0.1));padding:32px 24px;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🌙</div>
        <h1 style="color:${GREEN};font-size:22px;font-weight:800;margin:0 0 4px;">Order Confirmed!</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">Assalamu Alaikum, ${data.name}</p>
      </div>

      <!-- Order Details -->
      <div style="padding:24px;">
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">ORDER ID</p>
          <p style="color:${BLUE};font-size:16px;font-weight:700;margin:0;">#${data.orderId}</p>
        </div>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr>
              <th style="padding:8px 12px;color:rgba(255,255,255,0.4);font-size:11px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Item</th>
              <th style="padding:8px 12px;color:rgba(255,255,255,0.4);font-size:11px;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Qty</th>
              <th style="padding:8px 12px;color:rgba(255,255,255,0.4);font-size:11px;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Total -->
        <div style="background:rgba(16,224,122,0.08);border:1px solid rgba(16,224,122,0.2);border-radius:10px;padding:16px;text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">TOTAL</p>
          <p style="color:${GREEN};font-size:28px;font-weight:900;margin:0;">${formattedTotal}</p>
        </div>

        <!-- Estimated Delivery -->
        <div style="text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 4px;">Estimated Delivery</p>
          <p style="color:${GOLD};font-size:15px;font-weight:600;margin:0;">🚴 ${data.estimatedDelivery}</p>
        </div>

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="#" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Track Order</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      </div>
    </div>
  `;

  const text = `
Salam ${data.name}! 🌙

Your SwiftRamadan order #${data.orderId} has been confirmed!

Items:
${data.items.map((item) => `- ${item.name} x${item.qty} — ₦${item.price.toLocaleString()}`).join('\n')}

Total: ${formattedTotal}
Estimated Delivery: ${data.estimatedDelivery}

JazakAllah Khair!
SwiftRamadan — Smart Kitchen & Halal Delivery 🕌
  `.trim();

  return {
    subject: `🌙 Order Confirmed — #${data.orderId} | SwiftRamadan`,
    html,
    text,
  };
}
