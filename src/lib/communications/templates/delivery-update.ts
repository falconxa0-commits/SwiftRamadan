// Delivery Update Email Template — Aurora Luxe branded

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  assigned: { icon: '🚴', label: 'Rider Assigned', color: BLUE },
  in_transit: { icon: '🛵', label: 'In Transit', color: GOLD },
  delivered: { icon: '✅', label: 'Delivered!', color: GREEN },
};

export function deliveryUpdateTemplate(data: {
  name: string;
  orderId: string;
  status: 'assigned' | 'in_transit' | 'delivered';
  riderName?: string;
  estimatedTime?: string;
  trackingUrl?: string;
}): { subject: string; html: string; text: string } {
  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.in_transit;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(56,189,248,0.12),rgba(16,224,122,0.08));padding:32px 24px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">${statusCfg.icon}</div>
        <h1 style="color:${statusCfg.color};font-size:22px;font-weight:800;margin:0 0 4px;">${statusCfg.label}</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">Order #${data.orderId}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 20px;">Salam ${data.name},</p>

        ${data.status === 'assigned' ? `
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 16px;">
            Your rider <strong style="color:${GOLD};">${data.riderName || 'has been assigned'}</strong> is on the way to pick up your order.
          </p>
        ` : ''}

        ${data.status === 'in_transit' ? `
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 16px;">
            Your order is on its way! ${data.riderName ? `Rider <strong style="color:${GOLD};">${data.riderName}</strong> is heading to you.` : ''}
          </p>
        ` : ''}

        ${data.status === 'delivered' ? `
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 16px;">
            Your order has been delivered! Enjoy your meal. 🌙
          </p>
        ` : ''}

        ${data.estimatedTime ? `
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center;margin-bottom:20px;">
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 4px;">ESTIMATED ARRIVAL</p>
            <p style="color:${GOLD};font-size:18px;font-weight:700;margin:0;">${data.estimatedTime}</p>
          </div>
        ` : ''}

        ${data.trackingUrl ? `
          <div style="text-align:center;margin-bottom:20px;">
            <a href="${data.trackingUrl}" style="display:inline-block;background:${BLUE};color:#fff;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Track Live</a>
          </div>
        ` : ''}

        <!-- Progress Steps -->
        <div style="display:flex;justify-content:center;gap:0;margin-top:16px;">
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;border-radius:50%;background:${GREEN};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:14px;">✓</div>
            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Confirmed</p>
          </div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;border-radius:50%;background:${data.status === 'assigned' || data.status === 'in_transit' || data.status === 'delivered' ? GREEN : 'rgba(255,255,255,0.1)'};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:14px;">${data.status !== 'assigned' ? '✓' : '🚴'}</div>
            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Assigned</p>
          </div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;border-radius:50%;background:${data.status === 'in_transit' || data.status === 'delivered' ? GREEN : 'rgba(255,255,255,0.1)'};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:14px;">${data.status === 'delivered' ? '✓' : '🛵'}</div>
            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">In Transit</p>
          </div>
          <div style="text-align:center;flex:1;">
            <div style="width:32px;height:32px;border-radius:50%;background:${data.status === 'delivered' ? GREEN : 'rgba(255,255,255,0.1)'};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:14px;">🏠</div>
            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Delivered</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      </div>
    </div>
  `;

  const statusLabel = STATUS_CONFIG[data.status]?.label || 'Update';
  const text = `
Salam ${data.name}! 🌙

${statusCfg.icon} ${statusLabel} — Order #${data.orderId}

${data.status === 'assigned' ? `Your rider ${data.riderName || ''} has been assigned and is heading to pick up your order.` : ''}
${data.status === 'in_transit' ? `Your order is on its way! ${data.riderName ? `Rider: ${data.riderName}` : ''}` : ''}
${data.status === 'delivered' ? 'Your order has been delivered! Enjoy your meal.' : ''}
${data.estimatedTime ? `Estimated arrival: ${data.estimatedTime}` : ''}

SwiftRamadan — Smart Kitchen & Halal Delivery 🕌
  `.trim();

  return {
    subject: `${statusCfg.icon} ${statusLabel} — Order #${data.orderId} | SwiftRamadan`,
    html,
    text,
  };
}
