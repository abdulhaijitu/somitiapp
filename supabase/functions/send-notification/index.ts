import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, errorResponse, successResponse } from "../_shared/security.ts";
import { sendNotification, getNotificationSettings, messageTemplates, NotificationType } from "../_shared/notifications.ts";

/**
 * Send Notification Edge Function
 * Handles payment notifications, reminders, and alerts
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      type,
      tenantId,
      memberId,
      userId,
      paymentId,
      amount,
      phoneNumber,
      language = 'bn',
      customMessage,
      idempotencyKey
    } = body;

    if (!type || !tenantId) {
      return errorResponse('Missing required fields: type, tenantId', 400);
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, name_bn, status')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return errorResponse('Tenant not found', 404);
    }

    if (tenant.status !== 'active') {
      return errorResponse('Tenant is not active', 403);
    }

    // Get notification settings
    const settings = await getNotificationSettings(supabase, tenantId);
    const somitiName = language === 'bn' && tenant.name_bn ? tenant.name_bn : tenant.name;

    // Get member phone if not provided
    let recipientPhone = phoneNumber;
    if (!recipientPhone && memberId) {
      const { data: member } = await supabase
        .from('members')
        .select('phone')
        .eq('id', memberId)
        .single();
      recipientPhone = member?.phone;
    }

    let title = '';
    let titleBn = '';
    let message = '';
    let messageBn = '';
    let shouldSendSms = false;

    // Build notification based on type
    switch (type as NotificationType) {
      case 'payment_success': {
        const date = new Date().toLocaleDateString('bn-BD');
        const templates = messageTemplates.paymentSuccess(amount || 0, somitiName, date);
        title = 'Payment Successful';
        titleBn = 'পেমেন্ট সফল';
        message = templates.en;
        messageBn = templates.bn;
        shouldSendSms = (settings?.payment_success_sms as boolean) ?? true;
        break;
      }
      
      case 'payment_failed': {
        const templates = messageTemplates.paymentFailed(amount || 0, somitiName);
        title = 'Payment Failed';
        titleBn = 'পেমেন্ট ব্যর্থ';
        message = templates.en;
        messageBn = templates.bn;
        shouldSendSms = (settings?.payment_failed_sms as boolean) ?? true;
        
        // Also notify admin if enabled
        if (settings?.admin_alert_on_failed_payment) {
          // Get admin users for this tenant
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('tenant_id', tenantId)
            .eq('role', 'admin');

          for (const adminRole of adminRoles || []) {
            await sendNotification(supabase, {
              tenantId,
              userId: adminRole.user_id,
              type: 'admin_alert',
              title: 'Payment Failed Alert',
              titleBn: 'পেমেন্ট ব্যর্থ সতর্কতা',
              message: `A payment of ৳${amount} failed for a member.`,
              messageBn: `একজন সদস্যের ৳${amount} টাকা পেমেন্ট ব্যর্থ হয়েছে।`,
              data: { paymentId, memberId, amount }
            });
          }
        }
        break;
      }
      
      case 'dues_reminder': {
        const monthName = new Date().toLocaleString('bn-BD', { month: 'long' });
        const templates = messageTemplates.duesReminder(amount || 0, somitiName, monthName);
        title = 'Dues Reminder';
        titleBn = 'বকেয়ার রিমাইন্ডার';
        message = templates.en;
        messageBn = templates.bn;
        shouldSendSms = (settings?.dues_reminder_enabled as boolean) ?? true;
        break;
      }
      
      case 'payment_reminder': {
        const date = new Date().toLocaleDateString('bn-BD');
        const templates = messageTemplates.paymentConfirmation(amount || 0, somitiName, date);
        title = 'Payment Recorded';
        titleBn = 'পেমেন্ট রেকর্ড করা হয়েছে';
        message = templates.en;
        messageBn = templates.bn;
        shouldSendSms = true;
        break;
      }
      
      case 'admin_alert': {
        title = 'Admin Alert';
        titleBn = 'অ্যাডমিন সতর্কতা';
        message = customMessage || 'You have a new alert';
        messageBn = customMessage || 'আপনার একটি নতুন সতর্কতা আছে';
        shouldSendSms = false; // Admin alerts are in-app only by default
        break;
      }
      
      case 'system_alert': {
        title = 'System Notification';
        titleBn = 'সিস্টেম নোটিফিকেশন';
        message = customMessage || 'System notification';
        messageBn = customMessage || 'সিস্টেম নোটিফিকেশন';
        shouldSendSms = false;
        break;
      }
      
      default:
        return errorResponse(`Unknown notification type: ${type}`, 400);
    }

    // Send the notification
    const result = await sendNotification(supabase, {
      tenantId,
      memberId,
      userId,
      type: type as NotificationType,
      title,
      titleBn,
      message,
      messageBn,
      data: { paymentId, amount },
      sendSms: shouldSendSms && !!recipientPhone,
      phoneNumber: recipientPhone,
      idempotencyKey: idempotencyKey || `${type}-${memberId || userId}-${Date.now()}`
    });

    return successResponse({
      success: result.success,
      inAppCreated: result.inAppCreated,
      smsSent: result.smsResult?.sent,
      smsError: result.smsResult?.error
    });

  } catch (error) {
    console.error('Error in send-notification:', error);
    return errorResponse('Internal server error', 500);
  }
});
