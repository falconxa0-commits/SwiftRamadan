// Vendor Order Notification Email Template — Aurora Luxe branded

import { formatNaira } from '@/lib/format';

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function vendorOrderTemplate(data: {
  vendorName: string;
  customerName: string;
  orderId: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  deliveryAddress: string;
  customerPhone?: string;
  notes?: string;
}): { subject: string; html: string; text: string } {
  const formattedTotal = formatNaira(data.total);
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;color:rgba(255,255,255,0.9);font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06);">${item.name}</td>
        <td style="padding:10px 12px;color:rgba(255,255,255,0.6);font-size:14px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">x${item.qty}</td>
        <td style="padding:10px 12px;color:${GOLD};font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">${formatNaira(item.price)}</td>
      </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(16,224,122,0.18),rgba(245,196,81,0.08));padding:32px 24px;text-align:center;">
        <div style="font-size:42px;margin-bottom:8px;">🏪</div>
        <h1 style="color:${GREEN};font-size:22px;font-weight:800;margin:0 0 4px;">New Order!</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">Get it ready, ${data.vendorName}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <!-- Order ID -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">ORDER ID</p>
            <p style="color:${BLUE};font-size:16px;font-weight:700;margin:0;">#${data.orderId}</p>
          </div>
          <div style="text-align:right;">
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">CUSTOMER</p>
            <p style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:600;margin:0;">${data.customerName}</p>
          </div>
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
        <div style="background:rgba(16,224,122,0.08);border:1px solid rgba(16,224,122,0.2);border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">TOTAL</p>
          <p style="color:${GREEN};font-size:24px;font-weight:900;margin:0;">${formattedTotal}</p>
        </div>

        <!-- Delivery Address -->
        <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;margin-bottom:16px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">DELIVERY ADDRESS</p>
          <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0;">📍 ${data.deliveryAddress}</p>
        </div>

        ${data.customerPhone ? `
          <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">CUSTOMER PHONE</p>
            <p style="color:${BLUE};font-size:14px;margin:0;">${data.customerPhone}</p>
          </div>
        ` : ''}

        ${data.notes ? `
          <div style="background:rgba(245,196,81,0.06);border:1px solid rgba(245,196,81,0.15);border-radius:10px;padding:14px;margin-bottom:16px;">
            <p style="color:${GOLD};font-size:11px;margin:0 0 4px;">📝 SPECIAL NOTES</p>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">${data.notes}</p>
          </div>
        ` : ''}

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="#" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Accept Order</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Vendor Dashboard 🏪</p>
      </div>
    </div>
  `;

  const text = `
🏪 New Order — #${data.orderId}

Customer: ${data.customerName}
${data.customerPhone ? `Phone: ${data.customerPhone}` : ''}

Items:
${data.items.map((item) => `- ${item.name} x${item.qty} — ${formatNaira(item.price)}`).join('\n')}

Total: ${formattedTotal}
Delivery: ${data.deliveryAddress}
${data.notes ? `Notes: ${data.notes}` : ''}

Accept this order in your vendor dashboard!

SwiftRamadan — Vendor Dashboard 🏪
  `.trim();

  return {
    subject: `🏪 New Order #${data.orderId} — ${formattedTotal} | SwiftRamadan Vendor`,
    html,
    text,
  };
}
