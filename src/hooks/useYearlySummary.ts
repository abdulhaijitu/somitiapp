import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface YearlySummary {
  member_id: string;
  year: number;
  monthly_base: number;
  monthly_cap: number;
  monthly_dues_count: number;
  fund_raise_total: number;
  others_total: number;
  carry_forward_unpaid: number;
  yearly_cap: number;
  total_dues_generated: number;
  total_paid: number;
  outstanding_balance: number;
  remaining_allowance: number;
  cap_usage_percent: number;
  is_at_limit: boolean;
  is_near_limit: boolean;
}

export function useYearlySummary(
  memberId: string | null,
  tenantId: string | null,
  year?: number
) {
  const targetYear = year || new Date().getFullYear();

  return useQuery<YearlySummary | null>({
    queryKey: ['yearly-summary', memberId, tenantId, targetYear],
    queryFn: async () => {
      if (!memberId || !tenantId) return null;

      const { data, error } = await supabase.rpc('get_member_yearly_summary', {
        _member_id: memberId,
        _tenant_id: tenantId,
        _year: targetYear
      });

      if (error) {
        console.error('Error fetching yearly summary:', error);
        throw error;
      }

      const result = data as unknown as Record<string, unknown>;
      if (result?.error) return null;

      return result as unknown as YearlySummary;
    },
    enabled: !!memberId && !!tenantId
  });
}
