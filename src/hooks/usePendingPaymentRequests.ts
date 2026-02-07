import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface PendingPaymentRequest {
  id: string;
  amount: number;
  reference: string | null;
  created_at: string;
  due_id: string | null;
  member: {
    id: string;
    name: string;
    name_bn: string | null;
    phone: string | null;
  };
  metadata: Record<string, unknown> | null;
}

export function usePendingPaymentRequests() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery<PendingPaymentRequest[]>({
    queryKey: ['pending-payment-requests', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, reference, created_at, due_id, metadata, member_id, members!inner(id, name, name_bn, phone)')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .eq('payment_type', 'online')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter only member-requested payments awaiting approval
      return (data || [])
        .filter((p: any) => {
          const meta = p.metadata as Record<string, unknown> | null;
          return meta?.member_requested && !meta?.admin_approved;
        })
        .map((p: any) => ({
          id: p.id,
          amount: Number(p.amount),
          reference: p.reference,
          created_at: p.created_at,
          due_id: p.due_id,
          member: {
            id: p.members?.id || p.member_id,
            name: p.members?.name || 'Unknown',
            name_bn: p.members?.name_bn || null,
            phone: p.members?.phone || null,
          },
          metadata: p.metadata as Record<string, unknown> | null,
        }));
    },
    enabled: !!tenantId,
    refetchInterval: 15000,
  });
}
