import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Determines the range of years a member has been active,
 * using the earliest of: joined_at, first due year, or first payment year.
 */
export function useMemberYears(
  memberId: string | null | undefined,
  tenantId: string | null | undefined,
  joinedAt?: string | null,
  createdAt?: string | null
) {
  // Fetch earliest due/payment year from DB
  const { data: dbYears } = useQuery({
    queryKey: ['member-earliest-year', memberId, tenantId],
    queryFn: async () => {
      if (!memberId || !tenantId) return null;

      const [duesResult, paymentsResult] = await Promise.all([
        supabase
          .from('dues')
          .select('due_month')
          .eq('member_id', memberId)
          .eq('tenant_id', tenantId)
          .order('due_month', { ascending: true })
          .limit(1),
        supabase
          .from('payments')
          .select('payment_date, created_at')
          .eq('member_id', memberId)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: true })
          .limit(1)
      ]);

      let earliestDueYear: number | null = null;
      let earliestPaymentYear: number | null = null;

      if (duesResult.data?.[0]?.due_month) {
        earliestDueYear = new Date(duesResult.data[0].due_month).getFullYear();
      }

      if (paymentsResult.data?.[0]) {
        const p = paymentsResult.data[0];
        const dateStr = p.payment_date || p.created_at;
        if (dateStr) {
          earliestPaymentYear = new Date(dateStr).getFullYear();
        }
      }

      return { earliestDueYear, earliestPaymentYear };
    },
    enabled: !!memberId && !!tenantId,
    staleTime: 5 * 60 * 1000
  });

  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Gather all candidate years
    const candidates: number[] = [currentYear];

    if (joinedAt) candidates.push(new Date(joinedAt).getFullYear());
    if (createdAt) candidates.push(new Date(createdAt).getFullYear());
    if (dbYears?.earliestDueYear) candidates.push(dbYears.earliestDueYear);
    if (dbYears?.earliestPaymentYear) candidates.push(dbYears.earliestPaymentYear);

    const entryYear = Math.min(...candidates);

    const years: number[] = [];
    for (let y = entryYear; y <= currentYear; y++) {
      years.push(y);
    }

    return { years, currentYear, entryYear };
  }, [joinedAt, createdAt, dbYears, ]);
}
