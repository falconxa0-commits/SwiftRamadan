import { sendSMS, sendWhatsApp } from './twilio';
import { sendTermiiSMS, sendTermiiOTP } from './termii';
import { sendEmail, sendOTPEmail } from './resend';
import {
  sendTextMessage as sendWhatsAppText,
  sendOrderConfirmation as sendWhatsAppOrderConfirmation,
  sendDeliveryUpdate as sendWhatsAppDeliveryUpdate,
  sendGiftCardNotification as sendWhatsAppGiftCard,
  sendTemplateMessage,
  sendImageMessage,
  sendDocumentMessage,
  sendLocationMessage,
  verifyWebhookSignature,
} from './whatsapp-business';
import { normalizeNigerianPhone, isValidNigerianPhone, routeCommunication, inferMessageType, withRetry } from './retry';

// Unified OTP sender — tries SMS (Termii for Nigeria) + Email as fallback
export async function sendOTP({
  email,
  phone,
  code,
  name,
}: {
  email: string;
  phone?: string;
  code: string;
  name: string;
}): Promise<{ sent: boolean; channels: string[] }> {
  const channels: string[] = [];

  // Try SMS first (Termii is better for Nigerian numbers)
  if (phone) {
    const normalizedPhone = phone.startsWith('+') ? phone.substring(1) : phone.startsWith('0') ? `234${phone.substring(1)}` : phone;
    const smsResult = await sendTermiiOTP({ to: normalizedPhone, pin: code });
    if (smsResult.success) channels.push('sms');
  }

  // Always send email as well
  const emailResult = await sendOTPEmail({ to: email, code, name });
  if (emailResult.success) channels.push('email');

  return { sent: channels.length > 0, channels };
}

// Send order notification via smart routing: WhatsApp → SMS → Email
export async function sendOrderNotification({
  userId,
  email,
  phone,
  title,
  message,
}: {
  userId: string;
  email: string;
  phone?: string;
  title: string;
  message: string;
}): Promise<{ channels: string[] }> {
  const channels: string[] = [];
  const routing = routeCommunication({
    phone,
    messageType: inferMessageType(message),
  });

  // Try WhatsApp first for Nigerian numbers
  if (routing.preferredChannel === 'whatsapp' && phone) {
    try {
      const normalized = normalizeNigerianPhone(phone);
      const waResult = await withRetry(() => sendWhatsAppText({ to: normalized, text: `${title}: ${message}` }));
      if (waResult.success) channels.push('whatsapp');
    } catch {
      console.warn('[Comms] WhatsApp failed, falling back to SMS');
    }
  }

  // SMS notification (Termii for Nigerian numbers, Twilio as alternative)
  if (!channels.includes('whatsapp') && phone) {
    const normalizedPhone = phone.startsWith('+') ? phone.substring(1) : phone.startsWith('0') ? `234${phone.substring(1)}` : phone;
    const smsResult = await sendTermiiSMS({ to: normalizedPhone, message: `${title}: ${message}` });
    if (smsResult.success) channels.push('sms');
  }

  // Email notification
  const emailResult = await sendEmail({
    to: email,
    subject: title,
    html: `<div style="font-family:sans-serif;padding:20px;"><h2>${title}</h2><p>${message}</p></div>`,
  });
  if (emailResult.success) channels.push('email');

  return { channels };
}

// Send WhatsApp gift card
export async function sendGiftCardWhatsApp({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<{ success: boolean }> {
  // Try WhatsApp Business Cloud API first
  try {
    const normalized = normalizeNigerianPhone(phone);
    const result = await sendWhatsAppText({ to: normalized, text: message });
    if (result.success) return { success: true };
  } catch {
    // Fall back to Twilio WhatsApp
  }

  const result = await sendWhatsApp({ to: phone, body: message });
  return { success: result.success };
}

// Smart notification routing: WhatsApp → SMS → Email for Nigerian numbers
export async function smartNotify({
  email,
  phone,
  whatsappMessage,
  smsMessage,
  emailSubject,
  emailHtml,
  emailText,
  messageType = 'transactional',
}: {
  email: string;
  phone?: string;
  whatsappMessage?: string;
  smsMessage?: string;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
  messageType?: 'transactional' | 'promotional';
}): Promise<{ channels: string[]; errors: string[] }> {
  const channels: string[] = [];
  const errors: string[] = [];
  const routing = routeCommunication({ phone, messageType });

  // 1. WhatsApp (for Nigerian numbers)
  if (routing.channels.includes('whatsapp') && phone && whatsappMessage) {
    try {
      const normalized = normalizeNigerianPhone(phone);
      const result = await sendWhatsAppText({ to: normalized, text: whatsappMessage });
      if (result.success) {
        channels.push('whatsapp');
      } else {
        errors.push(result.error || 'WhatsApp failed');
      }
    } catch (error) {
      errors.push(String(error));
    }
  }

  // 2. SMS (Termii DND bypass for Nigerian numbers)
  if (!channels.includes('whatsapp') && phone && smsMessage) {
    try {
      const normalized = normalizeNigerianPhone(phone);
      const result = await sendTermiiSMS({
        to: normalized,
        message: smsMessage,
      });
      if (result.success) {
        channels.push('sms');
      } else {
        errors.push(result.error || 'SMS failed');
      }
    } catch (error) {
      errors.push(String(error));
    }
  }

  // 3. Email (always attempt)
  if (emailSubject && (emailHtml || emailText)) {
    try {
      const result = await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml || `<p>${emailText}</p>`,
      });
      if (result.success) {
        channels.push('email');
      } else {
        errors.push(result.error || 'Email failed');
      }
    } catch (error) {
      errors.push(String(error));
    }
  }

  return { channels, errors };
}

// Re-export all individual provider functions
export { sendSMS, sendWhatsApp, sendTermiiSMS, sendTermiiOTP, sendEmail, sendOTPEmail };

// Re-export WhatsApp Business functions
export {
  sendWhatsAppText,
  sendWhatsAppOrderConfirmation,
  sendWhatsAppDeliveryUpdate,
  sendWhatsAppGiftCard,
  sendTemplateMessage as sendWhatsAppTemplate,
  sendImageMessage as sendWhatsAppImage,
  sendDocumentMessage as sendWhatsAppDocument,
  sendLocationMessage as sendWhatsAppLocation,
  verifyWebhookSignature as verifyWhatsAppWebhook,
};

// Re-export retry / routing utilities
export { normalizeNigerianPhone, isValidNigerianPhone, routeCommunication, inferMessageType, withRetry };
