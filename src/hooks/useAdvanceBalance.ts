import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemberBalance {
  id: string;
  member_id: string;
  advance_balance: number;
  last_reconciled_at: string | null;
}

export function useAdvanceBalance(memberId: string | null, tenantId: string | null) {
  const [balance, setBalance] = useState<MemberBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!memberId || !tenantId) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('member_balances')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('member_id', memberId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setBalance(data);
    } catch (err) {
      console.error('Error fetching advance balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [memberId, tenantId]);

  return {
    balance,
    advanceBalance: balance ? Number(balance.advance_balance) : 0,
    loading,
    error,
    refetch: fetchBalance
  };
}

// Hook to get advance balances for multiple members (for admin views)
export function useAdvanceBalances(tenantId: string | null) {
  const [balances, setBalances] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!tenantId) {
      setBalances(new Map());
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('member_balances')
        .select('member_id, advance_balance')
        .eq('tenant_id', tenantId)
        .gt('advance_balance', 0);

      if (error) throw error;

      const balanceMap = new Map<string, number>();
      (data || []).forEach(b => {
        balanceMap.set(b.member_id, Number(b.advance_balance));
      });
      setBalances(balanceMap);
    } catch (err) {
      console.error('Error fetching advance balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [tenantId]);

  return {
    balances,
    getBalance: (memberId: string) => balances.get(memberId) || 0,
    loading,
    refetch: fetchBalances
  };
}
