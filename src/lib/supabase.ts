/**
 * Supabase Client — Push Notifications & Real-time
 * ────────────────────────────────────────────────
 * This module is ONLY used for push notifications and real-time features.
 * It requires the following environment variables to be set:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * If these are not configured, all Supabase clients will be null and
 * push notification / real-time features will be silently disabled.
 */
import { createClient } from '@supabase/supabase-js';

// Supabase configuration — replaces Firebase for push notifications + real-time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase instance (anon key — safe for browser)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-side Supabase instance (service role — admin access)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/** Push notification helper */
export async function sendPushNotification({
  userId,
  title,
  body,
  data,
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  if (!supabaseAdmin) {
    return { success: false, reason: 'no_supabase' };
  }

  try {
    // Store notification in Supabase
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      body,
      data: data || {},
      read: false,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    // In production, also trigger push via Supabase Edge Functions or FCM
    return { success: true };
  } catch (err) {
    console.error('[Supabase] Push notification error:', err);
    return { success: false, error: String(err) };
  }
}

/** Real-time subscription helper */
export function subscribeToChannel(
  channelName: string,
  event: string,
  callback: (payload: unknown) => void,
) {
  if (!supabase) return null;

  return supabase
    .channel(channelName)
    .on('postgres_changes', { event: event as 'INSERT' | 'UPDATE' | 'DELETE' | '*', schema: 'public' }, (payload) => {
      callback(payload);
    })
    .subscribe();
}

/** Store device token for push notifications */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'web' | 'ios' | 'android',
) {
  if (!supabaseAdmin) return { success: false, reason: 'no_supabase' };

  try {
    const { error } = await supabaseAdmin
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' },
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Supabase] Device token registration error:', err);
    return { success: false, error: String(err) };
  }
}
