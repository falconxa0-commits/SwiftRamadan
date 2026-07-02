// Twilio — SMS & WhatsApp Business API
// Docs: https://www.twilio.com/docs/sms

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_BASE_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;

export async function sendSMS({
  to,
  body,
}: {
  to: string; // E.164 format: +234XXXXXXXXXX
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('[Twilio] Not configured — SMS would have been sent to:', to);
    return { success: true, messageId: `mock-sms-${Date.now()}` };
  }

  try {
    const response = await fetch(`${TWILIO_BASE_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: body,
      }),
    });

    const data = await response.json();
    if (data.error_code) {
      return { success: false, error: data.error_message };
    }
    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('[Twilio] SMS error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendWhatsApp({
  to,
  body,
  templateSid,
  templateParams,
}: {
  to: string;
  body?: string;
  templateSid?: string;
  templateParams?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log('[Twilio] WhatsApp not configured — would send to:', to);
    return { success: true, messageId: `mock-wa-${Date.now()}` };
  }

  try {
    const params: Record<string, string> = {
      To: `whatsapp:${to}`,
      From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
    };

    if (templateSid) {
      params.ContentSid = templateSid;
      if (templateParams) {
        params.ContentVariables = JSON.stringify(templateParams);
      }
    } else {
      params.Body = body || '';
    }

    const response = await fetch(`${TWILIO_BASE_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      },
      body: new URLSearchParams(params),
    });

    const data = await response.json();
    if (data.error_code) {
      return { success: false, error: data.error_message };
    }
    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('[Twilio] WhatsApp error:', error);
    return { success: false, error: String(error) };
  }
}
