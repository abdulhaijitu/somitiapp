import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, errorResponse, successResponse } from "../_shared/security.ts";
import { sendNotification, getNotificationSettings, messageTemplates } from "../_shared/notifications.ts";

/**
 * Send Reminder Edge Function
 * Scheduled job to send dues and overdue reminders
 * Called via pg_cron or external scheduler
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST from scheduler or admin
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { tenantId, reminderType = 'all' } = body;

    // Get active tenants with active subscriptions
    let tenantsQuery = supabase
      .from('tenants')
      .select(`
        id, 
        name, 
        name_bn,
        subscriptions!inner(status, end_date)
      `)
      .eq('status', 'active')
      .eq('subscriptions.status', 'active')
      .gt('subscriptions.end_date', new Date().toISOString());

    if (tenantId) {
      tenantsQuery = tenantsQuery.eq('id', tenantId);
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery;

    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return errorResponse('Failed to fetch tenants', 500);
    }

    const results = {
      processedTenants: 0,
      duesRemindersSent: 0,
      overdueRemindersSent: 0,
      errors: [] as string[]
    };

    const today = new Date();
    const dayOfMonth = today.getDate();

    for (const tenant of tenants || []) {
      try {
        const settings = await getNotificationSettings(supabase, tenant.id);
        const somitiName = tenant.name_bn || tenant.name;

        // Send dues reminders on configured day
        if (
          (reminderType === 'all' || reminderType === 'dues') &&
          settings?.dues_reminder_enabled &&
          settings?.dues_reminder_day === dayOfMonth
        ) {
          // Get members with pending dues
          const { data: pendingPayments } = await supabase
            .from('payments')
            .select(`
              id,
              amount,
              period_month,
              period_year,
              member_id,
              members!inner(id, name, phone, status)
            `)
            .eq('tenant_id', tenant.id)
            .eq('status', 'pending')
            .eq('members.status', 'active');

          // Group by member to avoid duplicate reminders
          const memberDues = new Map<string, { memberId: string; phone: string; totalDue: number; name: string }>();
          
          for (const payment of pendingPayments || []) {
            const member = (payment.members as unknown) as { id: string; name: string; phone: string; status: string };
            if (!member || !member.phone) continue;

            if (memberDues.has(member.id)) {
              memberDues.get(member.id)!.totalDue += Number(payment.amount);
            } else {
              memberDues.set(member.id, {
                memberId: member.id,
                phone: member.phone,
                totalDue: Number(payment.amount),
                name: member.name
              });
            }
          }

          for (const [memberId, dues] of memberDues) {
            const monthName = today.toLocaleString('bn-BD', { month: 'long' });
            const templates = messageTemplates.duesReminder(dues.totalDue, somitiName, monthName);

            await sendNotification(supabase, {
              tenantId: tenant.id,
              memberId,
              type: 'dues_reminder',
              title: 'Dues Reminder',
              titleBn: 'বকেয়ার রিমাইন্ডার',
              message: templates.en,
              messageBn: templates.bn,
              data: { totalDue: dues.totalDue },
              sendSms: true,
              phoneNumber: dues.phone,
              idempotencyKey: `dues-${memberId}-${today.getFullYear()}-${today.getMonth()}-${dayOfMonth}`
            });

            results.duesRemindersSent++;
          }
        }

        // Send overdue reminders
        if (
          (reminderType === 'all' || reminderType === 'overdue') &&
          settings?.overdue_reminder_enabled
        ) {
          const overdueThresholdDays = Number(settings?.overdue_reminder_frequency_days) || 7;
          const overdueDate = new Date();
          overdueDate.setDate(overdueDate.getDate() - overdueThresholdDays);

          // Get overdue payments
          const { data: overduePayments } = await supabase
            .from('payments')
            .select(`
              id,
              amount,
              created_at,
              member_id,
              members!inner(id, name, phone, status)
            `)
            .eq('tenant_id', tenant.id)
            .eq('status', 'pending')
            .eq('members.status', 'active')
            .lt('created_at', overdueDate.toISOString());

          // Group by member
          const memberOverdue = new Map<string, { 
            memberId: string; 
            phone: string; 
            totalOverdue: number; 
            oldestDate: Date;
            name: string 
          }>();
          
          for (const payment of overduePayments || []) {
            const member = (payment.members as unknown) as { id: string; name: string; phone: string; status: string };
            if (!member || !member.phone) continue;

            const paymentDate = new Date(payment.created_at);
            
            if (memberOverdue.has(member.id)) {
              const existing = memberOverdue.get(member.id)!;
              existing.totalOverdue += Number(payment.amount);
              if (paymentDate < existing.oldestDate) {
                existing.oldestDate = paymentDate;
              }
            } else {
              memberOverdue.set(member.id, {
                memberId: member.id,
                phone: member.phone,
                totalOverdue: Number(payment.amount),
                oldestDate: paymentDate,
                name: member.name
              });
            }
          }

          for (const [memberId, overdue] of memberOverdue) {
            const daysOverdue = Math.floor(
              (today.getTime() - overdue.oldestDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            const templates = messageTemplates.overdueReminder(overdue.totalOverdue, somitiName, daysOverdue);

            await sendNotification(supabase, {
              tenantId: tenant.id,
              memberId,
              type: 'dues_reminder',
              title: 'Overdue Payment Reminder',
              titleBn: 'বিলম্বিত পেমেন্ট রিমাইন্ডার',
              message: templates.en,
              messageBn: templates.bn,
              data: { totalOverdue: overdue.totalOverdue, daysOverdue },
              sendSms: true,
              phoneNumber: overdue.phone,
              idempotencyKey: `overdue-${memberId}-${today.getFullYear()}-${today.getMonth()}-${Math.floor(dayOfMonth / Number(overdueThresholdDays))}`
            });

            results.overdueRemindersSent++;
          }

          // Check for high overdue count and alert admin
          if (settings?.admin_alert_on_high_overdue) {
            const threshold = Number(settings?.high_overdue_threshold) || 5;
            
            if (memberOverdue.size >= threshold) {
              const { data: adminRoles } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('tenant_id', tenant.id)
                .eq('role', 'admin');

              for (const adminRole of adminRoles || []) {
                await sendNotification(supabase, {
                  tenantId: tenant.id,
                  userId: adminRole.user_id,
                  type: 'admin_alert',
                  title: 'High Overdue Count Alert',
                  titleBn: 'অতিরিক্ত বকেয়া সতর্কতা',
                  message: `${memberOverdue.size} members have overdue payments.`,
                  messageBn: `${memberOverdue.size} জন সদস্যের পেমেন্ট বকেয়া আছে।`,
                  data: { overdueCount: memberOverdue.size, threshold }
                });
              }
            }
          }
        }

        results.processedTenants++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Tenant ${tenant.id}: ${errorMsg}`);
        console.error(`Error processing tenant ${tenant.id}:`, error);
      }
    }

    return successResponse(results);

  } catch (error) {
    console.error('Error in send-reminder:', error);
    return errorResponse('Internal server error', 500);
  }
});
