// WhatsApp Business Cloud API — Direct WhatsApp messaging for order/delivery/gift notifications
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

import crypto from 'crypto';
import { resilientFetch, assertOk } from '@/lib/http-client';

const WHATSAPP_BUSINESS_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN || '';
const WHATSAPP_BUSINESS_PHONE_NUMBER_ID = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID || '';
const WHATSAPP_BUSINESS_VERIFY_TOKEN = process.env.WHATSAPP_BUSINESS_VERIFY_TOKEN || '';
const WHATSAPP_BASE_URL = 'https://graph.facebook.com/v18.0';

const isConfigured = !!(WHATSAPP_BUSINESS_TOKEN && WHATSAPP_BUSINESS_PHONE_NUMBER_ID);

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/* Core Send Helper                                                           */
/* -------------------------------------------------------------------------- */

async function sendMessage(payload: Record<string, unknown>): Promise<WhatsAppMessageResult> {
  if (!isConfigured) {
    console.log('[WhatsApp] Not configured — message would have been sent:', JSON.stringify(payload).slice(0, 200));
    return { success: true, messageId: `mock-wa-${Date.now()}` };
  }

  try {
    const response = await resilientFetch(
      `${WHATSAPP_BASE_URL}/${WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_BUSINESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { provider: 'whatsapp-business' },
    );

    await assertOk(response, 'WhatsApp');

    const data = await response.json();

    if (data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    }

    return { success: false, error: data.error?.message || 'Unknown WhatsApp error' };
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return { success: false, error: String(error) };
  }
}

/* -------------------------------------------------------------------------- */
/* Send Template Message                                                      */
/* -------------------------------------------------------------------------- */

export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = 'en',
  components,
}: {
  to: string;   // E.164 format: 234XXXXXXXXXX (no +)
  templateName: string;
  languageCode?: string;
  components?: Array<Record<string, unknown>>;
}): Promise<WhatsAppMessageResult> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components || [],
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Send Text Message                                                          */
/* -------------------------------------------------------------------------- */

export async function sendTextMessage({
  to,
  text,
  previewUrl = false,
}: {
  to: string;
  text: string;
  previewUrl?: boolean;
}): Promise<WhatsAppMessageResult> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text, preview_url: previewUrl },
  });
}

/* -------------------------------------------------------------------------- */
/* Send Image Message                                                         */
/* -------------------------------------------------------------------------- */

export async function sendImageMessage({
  to,
  imageUrl,
  caption,
}: {
  to: string;
  imageUrl: string;
  caption?: string;
}): Promise<WhatsAppMessageResult> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption || '',
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Send Document Message                                                     */
/* -------------------------------------------------------------------------- */

export async function sendDocumentMessage({
  to,
  documentUrl,
  filename,
  caption,
}: {
  to: string;
  documentUrl: string;
  filename?: string;
  caption?: string;
}): Promise<WhatsAppMessageResult> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      link: documentUrl,
      filename: filename || 'document.pdf',
      caption: caption || '',
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Send Location Message                                                     */
/* -------------------------------------------------------------------------- */

export async function sendLocationMessage({
  to,
  latitude,
  longitude,
  name,
  address,
}: {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}): Promise<WhatsAppMessageResult> {
  return sendMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'location',
    location: {
      latitude,
      longitude,
      name: name || '',
      address: address || '',
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Pre-built Template: Order Confirmation                                     */
/* -------------------------------------------------------------------------- */

export async function sendOrderConfirmation({
  to,
  customerName,
  orderId,
  total,
  estimatedDelivery,
}: {
  to: string;
  customerName: string;
  orderId: string;
  total: string;   // formatted e.g. "₦5,400"
  estimatedDelivery: string;
}): Promise<WhatsAppMessageResult> {
  // Try WhatsApp template first; fall back to text message
  const templateResult = await sendTemplateMessage({
    to,
    templateName: 'order_confirmation',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: orderId },
          { type: 'text', text: total },
          { type: 'text', text: estimatedDelivery },
        ],
      },
    ],
  });

  if (templateResult.success) return templateResult;

  // Fallback to plain text if template not approved
  return sendTextMessage({
    to,
    text: `🌙 Assalamu Alaikum ${customerName}! Your SwiftRamadan order #${orderId} (${total}) has been confirmed. Estimated delivery: ${estimatedDelivery}. JazakAllah Khair! 🕌`,
  });
}

/* -------------------------------------------------------------------------- */
/* Pre-built Template: Delivery Update                                        */
/* -------------------------------------------------------------------------- */

export async function sendDeliveryUpdate({
  to,
  customerName,
  orderId,
  status,
  riderName,
  estimatedTime,
}: {
  to: string;
  customerName: string;
  orderId: string;
  status: 'assigned' | 'in_transit' | 'delivered';
  riderName?: string;
  estimatedTime?: string;
}): Promise<WhatsAppMessageResult> {
  const statusMessages: Record<string, string> = {
    assigned: `Your rider ${riderName || 'has been assigned'}`,
    in_transit: `Your order is on the way! ${riderName ? `Rider: ${riderName}` : ''}`,
    delivered: 'Your order has been delivered! Enjoy your meal 🌙',
  };

  const templateResult = await sendTemplateMessage({
    to,
    templateName: 'delivery_update',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: customerName },
          { type: 'text', text: orderId },
          { type: 'text', text: status },
          { type: 'text', text: statusMessages[status] || '' },
          { type: 'text', text: estimatedTime || '' },
        ],
      },
    ],
  });

  if (templateResult.success) return templateResult;

  return sendTextMessage({
    to,
    text: `🌙 SwiftRamadan Update: ${statusMessages[status]} (Order #${orderId})${estimatedTime ? ` — ETA: ${estimatedTime}` : ''}`,
  });
}

/* -------------------------------------------------------------------------- */
/* Pre-built Template: Gift Card Notification                                 */
/* -------------------------------------------------------------------------- */

export async function sendGiftCardNotification({
  to,
  recipientName,
  senderName,
  amount,
  code,
  message,
}: {
  to: string;
  recipientName: string;
  senderName: string;
  amount: string;
  code: string;
  message?: string;
}): Promise<WhatsAppMessageResult> {
  const templateResult = await sendTemplateMessage({
    to,
    templateName: 'gift_card_notification',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: recipientName },
          { type: 'text', text: senderName },
          { type: 'text', text: amount },
          { type: 'text', text: code },
        ],
      },
    ],
  });

  if (templateResult.success) return templateResult;

  return sendTextMessage({
    to,
    text: `🌙 ${recipientName}, you received a SwiftRamadan gift card from ${senderName}! Amount: ${amount}. Code: ${code}${message ? ` Message: "${message}"` : ''}. Use it at checkout! 🎁`,
  });
}

/* -------------------------------------------------------------------------- */
/* Webhook Signature Verification                                             */
/* -------------------------------------------------------------------------- */

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
): boolean {
  if (!WHATSAPP_BUSINESS_VERIFY_TOKEN) {
    console.warn('[WhatsApp] Webhook verification token not configured — rejecting webhook');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', WHATSAPP_BUSINESS_VERIFY_TOKEN)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signatureHeader),
  );
}

/* -------------------------------------------------------------------------- */
/* Webhook Challenge Verification (for initial setup)                         */
/* -------------------------------------------------------------------------- */

export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string,
): string | null {
  if (mode === 'subscribe' && token === WHATSAPP_BUSINESS_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}
