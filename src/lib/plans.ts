/**
 * Subscription Plans & Feature Gating Utilities
 * Server-calculated limits with graceful UI feedback
 */

import { supabase } from '@/integrations/supabase/client';

export type SubscriptionPlan = 'starter' | 'standard' | 'premium' | 'custom';

export interface PlanConfig {
  id: string;
  plan: SubscriptionPlan;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  max_members: number;
  max_members_unlimited: boolean;
  online_payments_enabled: boolean;
  sms_monthly_quota: number;
  report_history_months: number;
  advanced_reports: boolean;
  early_access_features: boolean;
  monthly_price: number;
  yearly_price: number | null;
  is_popular: boolean;
  sort_order: number;
}

export interface PlanLimits {
  max_members: number;
  max_members_base: number;
  max_members_addon: number;
  sms_quota: number;
  sms_quota_base: number;
  sms_quota_addon: number;
  online_payments: boolean;
  advanced_reports: boolean;
  report_history_months: number;
  early_access: boolean;
}

export interface PlanUsage {
  member_count: number;
  sms_used: number;
  sms_reset_at: string;
}

export interface TenantPlanInfo {
  plan: SubscriptionPlan;
  plan_name: string;
  plan_name_bn: string | null;
  subscription_status: string;
  subscription_end_date: string;
  limits: PlanLimits;
  usage: PlanUsage;
  error?: string;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit_type: string;
  current_usage?: number;
  max_limit?: number;
  message?: string;
  message_bn?: string;
  plan: SubscriptionPlan;
  error?: string;
}

export type LimitType = 'add_member' | 'send_sms' | 'online_payment' | 'advanced_reports';

// Feature labels for UI
export const planFeatures = {
  starter: {
    highlights: [
      { en: 'Up to 25 members', bn: '২৫ সদস্য পর্যন্ত' },
      { en: 'Offline payments only', bn: 'শুধুমাত্র অফলাইন পেমেন্ট' },
      { en: '50 SMS/month', bn: '৫০ SMS/মাস' },
      { en: '3 months report history', bn: '৩ মাসের রিপোর্ট' },
    ],
    limitations: [
      { en: 'No online payments', bn: 'অনলাইন পেমেন্ট নেই' },
      { en: 'Basic reports only', bn: 'শুধুমাত্র বেসিক রিপোর্ট' },
    ]
  },
  standard: {
    highlights: [
      { en: 'Up to 100 members', bn: '১০০ সদস্য পর্যন্ত' },
      { en: 'Online + Offline payments', bn: 'অনলাইন + অফলাইন পেমেন্ট' },
      { en: '200 SMS/month', bn: '২০০ SMS/মাস' },
      { en: '12 months report history', bn: '১২ মাসের রিপোর্ট' },
    ],
    limitations: [
      { en: 'No advanced reports', bn: 'অ্যাডভান্সড রিপোর্ট নেই' },
    ]
  },
  premium: {
    highlights: [
      { en: 'Up to 500 members', bn: '৫০০ সদস্য পর্যন্ত' },
      { en: 'All payment options', bn: 'সব পেমেন্ট অপশন' },
      { en: '500 SMS/month', bn: '৫০০ SMS/মাস' },
      { en: '3 years report history', bn: '৩ বছরের রিপোর্ট' },
      { en: 'Advanced analytics', bn: 'অ্যাডভান্সড অ্যানালিটিক্স' },
      { en: 'Early access to features', bn: 'নতুন ফিচারে আর্লি অ্যাক্সেস' },
    ],
    limitations: []
  },
  custom: {
    highlights: [
      { en: 'Unlimited members', bn: 'আনলিমিটেড সদস্য' },
      { en: 'Custom pricing', bn: 'কাস্টম প্রাইসিং' },
      { en: 'Dedicated support', bn: 'ডেডিকেটেড সাপোর্ট' },
    ],
    limitations: []
  }
};

/**
 * Fetch all available plans
 */
export async function fetchPlans(): Promise<PlanConfig[]> {
  const { data, error } = await supabase
    .from('plan_configs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data as unknown as PlanConfig[];
}

/**
 * Get tenant's current plan information with limits and usage
 * Uses database function for server-side calculation
 */
export async function getTenantPlanInfo(tenantId: string): Promise<TenantPlanInfo> {
  const { data, error } = await supabase
    .rpc('get_tenant_plan_limits', { _tenant_id: tenantId });

  if (error) throw error;
  return data as unknown as TenantPlanInfo;
}

/**
 * Check if tenant can perform a specific action
 * Returns allowed status with user-friendly messages
 */
export async function checkTenantLimit(
  tenantId: string, 
  limitType: LimitType
): Promise<LimitCheckResult> {
  const { data, error } = await supabase
    .rpc('check_tenant_limit', { 
      _tenant_id: tenantId, 
      _limit_type: limitType 
    });

  if (error) throw error;
  return data as unknown as LimitCheckResult;
}

/**
 * Calculate usage percentage for progress bars
 */
export function calculateUsagePercentage(current: number, max: number): number {
  if (max === 0 || max === 999999) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

/**
 * Get usage status color based on percentage
 */
export function getUsageStatus(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage < 70) return 'success';
  if (percentage < 90) return 'warning';
  return 'danger';
}

/**
 * Format price in BDT
 */
export function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('bn-BD')}`;
}

/**
 * Check if plan upgrade is needed based on limit
 */
export function needsUpgrade(result: LimitCheckResult): boolean {
  return !result.allowed && !result.error;
}

/**
 * Get upgrade recommendation based on current plan
 */
export function getUpgradeRecommendation(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
  switch (currentPlan) {
    case 'starter': return 'standard';
    case 'standard': return 'premium';
    case 'premium': return 'custom';
    default: return null;
  }
}
