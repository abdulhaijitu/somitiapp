import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NoticeDecision {
  id: string;
  notice_id: string;
  tenant_id: string;
  status: 'approved' | 'rejected' | 'deferred';
  decision_text: string;
  decided_by: string;
  decided_by_name: string;
  decided_at: string;
  created_at: string;
  updated_at: string;
}

export function useNoticeDecision(noticeId: string | null) {
  const [decision, setDecision] = useState<NoticeDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const fetchDecision = useCallback(async () => {
    if (!noticeId) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-notice-decision?notice_id=${noticeId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch decision');

      setDecision(data.decision || null);
    } catch (error: any) {
      console.error('Error fetching decision:', error);
    } finally {
      setIsLoading(false);
    }
  }, [noticeId]);

  const saveDecision = useCallback(async (
    status: 'approved' | 'rejected' | 'deferred',
    decisionText: string
  ): Promise<boolean> => {
    if (!noticeId) return false;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('manage-notice-decision', {
        method: 'POST',
        body: { notice_id: noticeId, status, decision_text: decisionText },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      setDecision(response.data.decision);

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? response.data.message_bn : response.data.message,
      });

      return true;
    } catch (error: any) {
      console.error('Error saving decision:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'সিদ্ধান্ত সংরক্ষণ ব্যর্থ' : 'Failed to save decision'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [noticeId, toast, language]);

  return {
    decision,
    isLoading,
    isSaving,
    fetchDecision,
    saveDecision,
  };
}
