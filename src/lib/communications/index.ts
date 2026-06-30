import { sendSMS, sendWhatsApp } from './twilio';
import { sendTermiiSMS, sendTermiiOTP } from './termii';
import { sendEmail, sendOTPEmail } from './resend';

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

// Send order notification via all available channels
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
}): Promise<void> {
  // Email notification
  await sendEmail({
    to: email,
    subject: title,
    html: `<div style="font-family:sans-serif;padding:20px;"><h2>${title}</h2><p>${message}</p></div>`,
  });

  // SMS notification
  if (phone) {
    const normalizedPhone = phone.startsWith('+') ? phone.substring(1) : phone.startsWith('0') ? `234${phone.substring(1)}` : phone;
    await sendTermiiSMS({ to: normalizedPhone, message: `${title}: ${message}` });
  }
}

// Send WhatsApp gift card
export async function sendGiftCardWhatsApp({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<{ success: boolean }> {
  const result = await sendWhatsApp({ to: phone, body: message });
  return { success: result.success };
}

export { sendSMS, sendWhatsApp, sendTermiiSMS, sendEmail, sendOTPEmail };
