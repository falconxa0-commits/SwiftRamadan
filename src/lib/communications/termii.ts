// Termii — Nigerian SMS gateway (better local delivery than Twilio)
// Docs: https://developers.termii.com/

const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'SwiftRmdn';
const TERMII_BASE_URL = 'https://api.ng.termii.com/api';

export async function sendTermiiSMS({
  to, // Nigerian format: 234XXXXXXXXXX
  message,
  type = 'plain',
}: {
  to: string;
  message: string;
  type?: 'plain' | 'unicode';
}): Promise<{ success: boolean; messageId?: string | null; error?: string }> {
  if (!TERMII_API_KEY) {
    return { success: false, error: 'Termii not configured', messageId: null };
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to,
        from: TERMII_SENDER_ID,
        sms: message,
        type,
        channel: 'dnd', // Uses DND bypass route in Nigeria
      }),
    });

    const data = await response.json();
    if (data.message_id) {
      return { success: true, messageId: data.message_id };
    }
    return { success: false, error: data.message || 'Failed to send' };
  } catch (error) {
    console.error('[Termii] SMS error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendTermiiOTP({
  to,
  pin,
  message = 'Your SwiftRamadan verification code is < {{code}} >. Valid for 5 minutes.',
}: {
  to: string;
  pin: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!TERMII_API_KEY) {
    return { success: false, error: 'Termii not configured' };
  }

  try {
    const finalMessage = message.replace('{{code}}', pin);
    const result = await sendTermiiSMS({ to, message: finalMessage });
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
