import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NoticeComment {
  id: string;
  notice_id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export function useNoticeComments(noticeId: string | null) {
  const [comments, setComments] = useState<NoticeComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const fetchComments = useCallback(async (pageNum = 1, append = false) => {
    if (!noticeId) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('manage-notice-comments', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });

      // Use fetch directly for GET with query params
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-notice-comments?notice_id=${noticeId}&page=${pageNum}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch comments');

      if (append) {
        setComments(prev => [...prev, ...(data.comments || [])]);
      } else {
        setComments(data.comments || []);
      }
      setTotal(data.total || 0);
      setPage(pageNum);
      setHasMore(data.has_more || false);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [noticeId]);

  const addComment = useCallback(async (comment: string): Promise<boolean> => {
    if (!noticeId) return false;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('manage-notice-comments', {
        method: 'POST',
        body: { notice_id: noticeId, comment },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? response.data.message_bn : response.data.message,
      });

      await fetchComments(1);
      return true;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'মন্তব্য যোগ করতে ব্যর্থ' : 'Failed to add comment'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [noticeId, toast, language, fetchComments]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-notice-comments?id=${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment');

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? data.message_bn : data.message,
      });

      await fetchComments(1);
      return true;
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, language, fetchComments]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchComments(page + 1, true);
    }
  }, [hasMore, isLoading, page, fetchComments]);

  return {
    comments,
    total,
    hasMore,
    isLoading,
    isSubmitting,
    fetchComments,
    addComment,
    deleteComment,
    loadMore,
  };
}
