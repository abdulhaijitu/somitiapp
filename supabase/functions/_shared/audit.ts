// Audit logging utilities for Edge Functions
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export type AuditAction = 
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_INVALIDATED'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_VERIFIED'
  | 'WEBHOOK_RECEIVED'
  | 'MEMBER_CREATED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_STATUS_CHANGED'
  | 'REPORT_GENERATED'
  | 'TENANT_SUSPENDED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'ADMIN_ACTION';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditEntry {
  action: AuditAction;
  entity_type: 'user' | 'member' | 'payment' | 'tenant' | 'subscription' | 'system';
  entity_id?: string;
  user_id?: string;
  tenant_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  severity?: AuditSeverity;
}

/**
 * Log an audit event
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry
): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      user_id: entry.user_id,
      details: {
        ...entry.details,
        tenant_id: entry.tenant_id,
        severity: entry.severity || 'info',
        timestamp: new Date().toISOString()
      },
      ip_address: entry.ip_address
    });

    if (error) {
      console.error('Audit log insert error:', error);
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  supabase: SupabaseClient,
  params: {
    action: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILED' | 'AUTH_LOGOUT' | 'AUTH_SESSION_INVALIDATED';
    user_id?: string;
    email?: string;
    ip_address?: string;
    reason?: string;
  }
): Promise<void> {
  await logAudit(supabase, {
    action: params.action,
    entity_type: 'user',
    entity_id: params.user_id,
    user_id: params.user_id,
    ip_address: params.ip_address,
    severity: params.action === 'AUTH_LOGIN_FAILED' ? 'warning' : 'info',
    details: {
      email: params.email,
      reason: params.reason
    }
  });
}

/**
 * Log security violation
 */
export async function logSecurityViolation(
  supabase: SupabaseClient,
  params: {
    action: 'PERMISSION_DENIED' | 'RATE_LIMIT_EXCEEDED';
    user_id?: string;
    tenant_id?: string;
    ip_address?: string;
    resource?: string;
    attempted_action?: string;
  }
): Promise<void> {
  await logAudit(supabase, {
    action: params.action,
    entity_type: 'system',
    user_id: params.user_id,
    tenant_id: params.tenant_id,
    ip_address: params.ip_address,
    severity: 'warning',
    details: {
      resource: params.resource,
      attempted_action: params.attempted_action
    }
  });
}

/**
 * Log payment event
 */
export async function logPaymentEvent(
  supabase: SupabaseClient,
  params: {
    action: 'PAYMENT_INITIATED' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'PAYMENT_VERIFIED' | 'WEBHOOK_RECEIVED';
    payment_id: string;
    tenant_id: string;
    user_id?: string;
    amount?: number;
    previous_status?: string;
    new_status?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  // Use payment_logs for payment-specific events
  try {
    await supabase.from('payment_logs').insert({
      payment_id: params.payment_id,
      tenant_id: params.tenant_id,
      action: params.action,
      previous_status: params.previous_status,
      new_status: params.new_status,
      performed_by: params.user_id,
      details: {
        amount: params.amount,
        ...params.details
      }
    });
  } catch (error) {
    console.error('Failed to log payment event:', error);
  }

  // Also log to main audit for critical events
  if (['PAYMENT_FAILED', 'WEBHOOK_RECEIVED'].includes(params.action)) {
    await logAudit(supabase, {
      action: params.action,
      entity_type: 'payment',
      entity_id: params.payment_id,
      tenant_id: params.tenant_id,
      user_id: params.user_id,
      severity: params.action === 'PAYMENT_FAILED' ? 'error' : 'info',
      details: params.details
    });
  }
}

/**
 * Log admin action
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    tenant_id?: string;
    action_description: string;
    entity_type: AuditEntry['entity_type'];
    entity_id?: string;
    ip_address?: string;
    before_state?: Record<string, unknown>;
    after_state?: Record<string, unknown>;
  }
): Promise<void> {
  await logAudit(supabase, {
    action: 'ADMIN_ACTION',
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    user_id: params.user_id,
    tenant_id: params.tenant_id,
    ip_address: params.ip_address,
    severity: 'info',
    details: {
      description: params.action_description,
      before: params.before_state,
      after: params.after_state
    }
  });
}
