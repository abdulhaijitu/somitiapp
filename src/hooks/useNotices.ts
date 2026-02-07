import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Notice {
  id: string;
  tenant_id: string;
  title: string;
  title_bn: string | null;
  content: string;
  content_bn: string | null;
  status: 'draft' | 'published';
  is_pinned: boolean;
  created_by: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NoticePayload {
  id?: string;
  title: string;
  title_bn?: string;
  content: string;
  content_bn?: string;
  status?: 'draft' | 'published';
  is_pinned?: boolean;
}

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-notice', {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch notices');
      }

      setNotices(response.data.notices || []);
    } catch (error: any) {
      console.error('Error fetching notices:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'নোটিশ লোড করতে ব্যর্থ' : 'Failed to load notices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, language]);

  const saveNotice = useCallback(async (payload: NoticePayload): Promise<Notice | null> => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('manage-notice', {
        method: 'POST',
        body: payload,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save notice');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const message = language === 'bn' 
        ? response.data.message_bn 
        : response.data.message;

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: message,
      });

      // Refresh the list
      await fetchNotices();

      return response.data.notice;
    } catch (error: any) {
      console.error('Error saving notice:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'নোটিশ সংরক্ষণ করতে ব্যর্থ' : 'Failed to save notice'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [toast, language, fetchNotices]);

  const deleteNotice = useCallback(async (noticeId: string): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Single DELETE call using fetch with query param
      const deleteResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-notice?id=${noticeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await deleteResponse.json();

      if (!deleteResponse.ok) {
        throw new Error(data.error || 'Failed to delete notice');
      }

      const message = language === 'bn' 
        ? data.message_bn 
        : data.message;

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: message,
      });

      // Refresh the list
      await fetchNotices();

      return true;
    } catch (error: any) {
      console.error('Error deleting notice:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'নোটিশ মুছতে ব্যর্থ' : 'Failed to delete notice'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [toast, language, fetchNotices]);

  return {
    notices,
    isLoading,
    isSaving,
    fetchNotices,
    saveNotice,
    deleteNotice,
  };
}
