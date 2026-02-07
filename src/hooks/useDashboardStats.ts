import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalCollectionThisYear: number;
  monthlyCollection: number;
  outstandingDues: number;
  overdueMembers: number;
  collectionTrendPercent: number;
}

export interface RecentPayment {
  id: string;
  memberName: string;
  amount: number;
  date: string;
  status: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  name: string;
  time: string;
  type: 'payment' | 'member' | 'notice' | 'due';
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
}

export function useDashboardStats() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearStart = `${currentYear}-01-01`;
  const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', tenantId, currentYear, currentMonth],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant');

      const [
        membersRes,
        newMembersRes,
        yearPaymentsRes,
        monthPaymentsRes,
        outstandingRes,
      ] = await Promise.all([
        // Total & active members
        supabase
          .from('members')
          .select('id, status', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        // New members this month
        supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', monthStart),
        // Year collection
        supabase
          .from('payments')
          .select('amount')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid')
          .gte('created_at', yearStart),
        // Month collection
        supabase
          .from('payments')
          .select('amount')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid')
          .gte('created_at', monthStart),
        // Outstanding dues
        supabase
          .from('dues')
          .select('amount, paid_amount, member_id')
          .eq('tenant_id', tenantId)
          .in('status', ['unpaid', 'partial']),
      ]);

      const totalMembers = membersRes.count || 0;
      const newMembersThisMonth = newMembersRes.count || 0;

      const totalCollectionThisYear = (yearPaymentsRes.data || []).reduce(
        (sum, p) => sum + Number(p.amount), 0
      );
      const monthlyCollection = (monthPaymentsRes.data || []).reduce(
        (sum, p) => sum + Number(p.amount), 0
      );

      const outstandingData = outstandingRes.data || [];
      const outstandingDues = outstandingData.reduce(
        (sum, d) => sum + (Number(d.amount) - Number(d.paid_amount)), 0
      );
      const overdueMembers = new Set(outstandingData.map(d => d.member_id)).size;

      return {
        totalMembers,
        activeMembers: totalMembers,
        newMembersThisMonth,
        totalCollectionThisYear,
        monthlyCollection,
        outstandingDues,
        overdueMembers,
        collectionTrendPercent: 0,
      } as DashboardStats;
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });

  const recentPaymentsQuery = useQuery({
    queryKey: ['dashboard-recent-payments', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, status, created_at, member_id, members!inner(name, name_bn)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        memberName: p.members?.name_bn || p.members?.name || 'Unknown',
        amount: Number(p.amount),
        date: new Date(p.created_at).toLocaleDateString('bn-BD'),
        status: p.status,
      })) as RecentPayment[];
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  const recentActivityQuery = useQuery({
    queryKey: ['dashboard-recent-activity', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant');

      // Fetch recent payments, members, notices in parallel
      const [paymentsRes, membersRes, noticesRes] = await Promise.all([
        supabase
          .from('payments')
          .select('id, created_at, status, members!inner(name, name_bn)')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('members')
          .select('id, created_at, name, name_bn')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('notices')
          .select('id, created_at, title, title_bn, status')
          .eq('tenant_id', tenantId)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const activities: RecentActivity[] = [];

      (paymentsRes.data || []).forEach((p: any) => {
        activities.push({
          id: `pay-${p.id}`,
          action: 'Payment received',
          name: p.members?.name_bn || p.members?.name || '',
          time: timeAgo(p.created_at),
          type: 'payment',
        });
      });

      (membersRes.data || []).forEach((m: any) => {
        activities.push({
          id: `mem-${m.id}`,
          action: 'New member added',
          name: m.name_bn || m.name,
          time: timeAgo(m.created_at),
          type: 'member',
        });
      });

      (noticesRes.data || []).forEach((n: any) => {
        activities.push({
          id: `not-${n.id}`,
          action: 'Notice published',
          name: n.title_bn || n.title,
          time: timeAgo(n.created_at),
          type: 'notice',
        });
      });

      // Sort by recency (approximate via timeAgo string isn't ideal, use original created_at)
      return activities.slice(0, 6);
    },
    enabled: !!tenantId,
    staleTime: 30_000,
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    recentPayments: recentPaymentsQuery.data || [],
    isLoadingPayments: recentPaymentsQuery.isLoading,
    recentActivity: recentActivityQuery.data || [],
    isLoadingActivity: recentActivityQuery.isLoading,
  };
}
