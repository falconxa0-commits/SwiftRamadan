// Welcome Email Template — Aurora Luxe branded

const BG = '#0B0D14';
const GREEN = '#10E07A';
const GOLD = '#F5C451';
const BLUE = '#38BDF8';

export function welcomeTemplate(data: {
  name: string;
  email: string;
  role: string;
}): { subject: string; html: string; text: string } {
  const roleLabel = data.role === 'vendor' ? 'Vendor' : data.role === 'rider' ? 'Rider' : 'Food Lover';
  const roleEmoji = data.role === 'vendor' ? '🏪' : data.role === 'rider' ? '🛵' : '🍽️';
  const roleDesc =
    data.role === 'vendor'
      ? 'Start listing your halal meals and reach thousands of hungry customers this Ramadan.'
      : data.role === 'rider'
        ? 'Start delivering iftar meals and earning with flexible hours.'
        : 'Explore the best halal meals, track prayer times, and enjoy seamless delivery this Ramadan.';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:${BG};border-radius:16px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(16,224,122,0.2),rgba(56,189,248,0.1));padding:40px 24px;text-align:center;">
        <div style="font-size:52px;margin-bottom:12px;">🌙</div>
        <h1 style="color:${GREEN};font-size:26px;font-weight:800;margin:0 0 4px;">Welcome, ${data.name}!</h1>
        <p style="color:${GOLD};font-size:14px;font-weight:600;margin:0;">${roleEmoji} ${roleLabel}</p>
      </div>

      <!-- Body -->
      <div style="padding:24px;">
        <p style="color:rgba(255,255,255,0.8);font-size:15px;margin:0 0 16px;">
          Assalamu Alaikum ${data.name}! 🌙
        </p>

        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 24px;">
          ${roleDesc}
        </p>

        <!-- Features -->
        <div style="margin-bottom:24px;">
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">🕌</span>
            <div>
              <p style="color:${GREEN};font-size:13px;font-weight:600;margin:0;">Prayer-Aware Delivery</p>
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:2px 0 0;">Meals timed around salah — never miss a prayer</p>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">🍳</span>
            <div>
              <p style="color:${GOLD};font-size:13px;font-weight:600;margin:0;">Smart Kitchen AI</p>
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:2px 0 0;">Get recipe suggestions from what's in your fridge</p>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">🎁</span>
            <div>
              <p style="color:${BLUE};font-size:13px;font-weight:600;margin:0;">Hasanat Rewards</p>
              <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:2px 0 0;">Earn spiritual &amp; loyalty points with every order</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="#" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Start Exploring</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">SwiftRamadan — Smart Kitchen &amp; Halal Delivery 🕌</p>
      </div>
    </div>
  `;

  const text = `
Assalamu Alaikum ${data.name}! 🌙

Welcome to SwiftRamadan as a ${roleLabel}!

${roleDesc}

Here's what you can do:
🕌 Prayer-Aware Delivery — Meals timed around salah
🍳 Smart Kitchen AI — Get recipe suggestions from your fridge
🎁 Hasanat Rewards — Earn spiritual & loyalty points with every order

Get started now!

SwiftRamadan — Smart Kitchen & Halal Delivery 🕌
  `.trim();

  return {
    subject: `🌙 Welcome to SwiftRamadan, ${data.name}! | Smart Kitchen & Halal Delivery`,
    html,
    text,
  };
}
