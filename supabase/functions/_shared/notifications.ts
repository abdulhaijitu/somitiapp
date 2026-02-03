/**
 * Notification Service - handles both SMS and in-app notifications
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createSmsProvider, messageTemplates, SmsMessage } from "./sms-providers.ts";

export type NotificationType = 
  | 'otp'
  | 'payment_success'
  | 'payment_failed'
  | 'payment_reminder'
  | 'dues_reminder'
  | 'system_alert'
  | 'admin_alert';

export interface NotificationPayload {
  tenantId: string;
  memberId?: string;
  userId?: string;
  type: NotificationType;
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  data?: Record<string, unknown>;
  sendSms?: boolean;
  phoneNumber?: string;
  idempotencyKey?: string;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const rateLimitConfigs: Record<NotificationType, RateLimitConfig> = {
  otp: { maxRequests: 3, windowMinutes: 5 },
  payment_success: { maxRequests: 10, windowMinutes: 60 },
  payment_failed: { maxRequests: 10, windowMinutes: 60 },
  payment_reminder: { maxRequests: 2, windowMinutes: 1440 }, // 2 per day
  dues_reminder: { maxRequests: 2, windowMinutes: 1440 },
  system_alert: { maxRequests: 5, windowMinutes: 60 },
  admin_alert: { maxRequests: 10, windowMinutes: 60 }
};

/**
 * Check SMS rate limit
 */
async function checkSmsRateLimit(
  supabase: SupabaseClient,
  phoneNumber: string,
  type: NotificationType
): Promise<{ allowed: boolean; retryAfterMinutes?: number }> {
  const config = rateLimitConfigs[type];
  const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);

  // Get or create rate limit record
  const { data: existing } = await supabase
    .from('sms_rate_limits')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('notification_type', type)
    .single();

  if (!existing) {
    // First request - create record
    await supabase.from('sms_rate_limits').insert({
      phone_number: phoneNumber,
      notification_type: type,
      request_count: 1,
      window_start: new Date().toISOString()
    });
    return { allowed: true };
  }

  const recordWindowStart = new Date(existing.window_start);
  
  if (recordWindowStart < windowStart) {
    // Window expired - reset counter
    await supabase
      .from('sms_rate_limits')
      .update({
        request_count: 1,
        window_start: new Date().toISOString()
      })
      .eq('id', existing.id);
    return { allowed: true };
  }

  if (existing.request_count >= config.maxRequests) {
    // Rate limited
    const minutesRemaining = Math.ceil(
      (recordWindowStart.getTime() + config.windowMinutes * 60 * 1000 - Date.now()) / 60000
    );
    return { allowed: false, retryAfterMinutes: minutesRemaining };
  }

  // Increment counter
  await supabase
    .from('sms_rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('id', existing.id);

  return { allowed: true };
}

/**
 * Check idempotency to prevent duplicate SMS
 */
async function checkIdempotency(
  supabase: SupabaseClient,
  idempotencyKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('sms_logs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .single();

  return !data; // Return true if no existing record (can proceed)
}

/**
 * Log SMS attempt
 */
async function logSms(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    memberId?: string;
    phoneNumber: string;
    type: NotificationType;
    message: string;
    provider?: string;
    providerMessageId?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    errorMessage?: string;
    idempotencyKey?: string;
    cost?: number;
  }
): Promise<void> {
  await supabase.from('sms_logs').insert({
    tenant_id: params.tenantId,
    member_id: params.memberId,
    phone_number: params.phoneNumber,
    notification_type: params.type,
    message: params.message,
    provider: params.provider,
    provider_message_id: params.providerMessageId,
    status: params.status,
    error_message: params.errorMessage,
    idempotency_key: params.idempotencyKey,
    cost: params.cost,
    sent_at: params.status === 'sent' ? new Date().toISOString() : null
  });
}

/**
 * Create in-app notification
 */
async function createInAppNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload
): Promise<void> {
  await supabase.from('notifications').insert({
    tenant_id: payload.tenantId,
    user_id: payload.userId,
    member_id: payload.memberId,
    notification_type: payload.type,
    title: payload.title,
    title_bn: payload.titleBn,
    message: payload.message,
    message_bn: payload.messageBn,
    data: payload.data || {}
  });
}

/**
 * Send notification (both SMS and in-app)
 */
export async function sendNotification(
  supabase: SupabaseClient,
  payload: NotificationPayload
): Promise<{ success: boolean; smsResult?: { sent: boolean; error?: string }; inAppCreated: boolean }> {
  let smsResult: { sent: boolean; error?: string } | undefined;
  let inAppCreated = false;

  // Create in-app notification
  try {
    await createInAppNotification(supabase, payload);
    inAppCreated = true;
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }

  // Send SMS if requested
  if (payload.sendSms && payload.phoneNumber) {
    // Check idempotency
    if (payload.idempotencyKey) {
      const canProceed = await checkIdempotency(supabase, payload.idempotencyKey);
      if (!canProceed) {
        smsResult = { sent: false, error: 'Duplicate request' };
        return { success: inAppCreated, smsResult, inAppCreated };
      }
    }

    // Check rate limit
    const rateLimitCheck = await checkSmsRateLimit(supabase, payload.phoneNumber, payload.type);
    if (!rateLimitCheck.allowed) {
      smsResult = { 
        sent: false, 
        error: `Rate limited. Try again in ${rateLimitCheck.retryAfterMinutes} minutes` 
      };
      
      await logSms(supabase, {
        tenantId: payload.tenantId,
        memberId: payload.memberId,
        phoneNumber: payload.phoneNumber,
        type: payload.type,
        message: payload.messageBn || payload.message,
        status: 'failed',
        errorMessage: 'Rate limited',
        idempotencyKey: payload.idempotencyKey
      });
      
      return { success: inAppCreated, smsResult, inAppCreated };
    }

    // Send SMS
    try {
      const smsProvider = createSmsProvider();
      const smsMessage: SmsMessage = {
        to: payload.phoneNumber,
        message: payload.messageBn || payload.message, // Prefer Bangla
        tenantId: payload.tenantId,
        memberId: payload.memberId,
        notificationType: payload.type
      };

      const result = await smsProvider.send(smsMessage);
      
      await logSms(supabase, {
        tenantId: payload.tenantId,
        memberId: payload.memberId,
        phoneNumber: payload.phoneNumber,
        type: payload.type,
        message: smsMessage.message,
        provider: result.provider,
        providerMessageId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error,
        idempotencyKey: payload.idempotencyKey,
        cost: result.cost
      });

      smsResult = { sent: result.success, error: result.error };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      await logSms(supabase, {
        tenantId: payload.tenantId,
        memberId: payload.memberId,
        phoneNumber: payload.phoneNumber,
        type: payload.type,
        message: payload.messageBn || payload.message,
        status: 'failed',
        errorMessage: errorMsg,
        idempotencyKey: payload.idempotencyKey
      });

      smsResult = { sent: false, error: errorMsg };
    }
  }

  return { 
    success: inAppCreated || (smsResult?.sent ?? false), 
    smsResult, 
    inAppCreated 
  };
}

/**
 * Get tenant notification settings
 */
export async function getNotificationSettings(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching notification settings:', error);
    return null;
  }

  // Return defaults if no settings exist
  return data || {
    payment_success_sms: true,
    payment_failed_sms: true,
    dues_reminder_enabled: true,
    dues_reminder_day: 1,
    overdue_reminder_enabled: true,
    overdue_reminder_frequency_days: 7,
    admin_alert_on_failed_payment: true,
    admin_alert_on_high_overdue: true,
    high_overdue_threshold: 5
  };
}

export { messageTemplates };
