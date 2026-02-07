import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotices, type Notice } from '@/hooks/useNotices';
import { useNoticeComments } from '@/hooks/useNoticeComments';
import { useNoticeDecision } from '@/hooks/useNoticeDecision';
import { DiscussionThread } from '@/components/notices/DiscussionThread';
import { DecisionSection } from '@/components/notices/DecisionSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTableSkeleton } from '@/components/common/DataTableSkeleton';
import { ArrowLeft, Calendar, Pin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function MemberNoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { notices, isLoading: noticesLoading, fetchNotices } = useNotices();
  const { comments, total, hasMore, isLoading: commentsLoading, isSubmitting, fetchComments, addComment, deleteComment, loadMore } = useNoticeComments(id || null);
  const { decision, isLoading: decisionLoading, isSaving: decisionSaving, fetchDecision, saveDecision } = useNoticeDecision(id || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    fetchNotices();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, [fetchNotices]);

  useEffect(() => {
    if (notices.length > 0 && id) {
      const found = notices.find(n => n.id === id);
      setNotice(found || null);
    }
  }, [notices, id]);

  useEffect(() => {
    if (id) {
      fetchComments();
      fetchDecision();
    }
  }, [id, fetchComments, fetchDecision]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'bn') {
      return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (noticesLoading) {
    return <DataTableSkeleton columns={1} rows={3} />;
  }

  if (!notice) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === 'bn' ? 'ফিরে যান' : 'Go Back'}
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          {language === 'bn' ? 'নোটিশ পাওয়া যায়নি' : 'Notice not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {language === 'bn' ? 'নোটিশ বোর্ডে ফিরুন' : 'Back to Notice Board'}
      </Button>

      {/* Notice */}
      <Card className={notice.is_pinned ? 'border-primary/30 bg-primary/5' : ''}>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {notice.is_pinned && <Pin className="h-4 w-4 text-primary" />}
              <CardTitle className="text-xl font-bengali lg:text-2xl">
                {language === 'bn' && notice.title_bn ? notice.title_bn : notice.title}
              </CardTitle>
              {notice.is_pinned && (
                <Badge variant="secondary">{language === 'bn' ? 'পিন করা' : 'Pinned'}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(notice.published_at || notice.created_at)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80 font-bengali leading-relaxed whitespace-pre-wrap">
            {language === 'bn' && notice.content_bn ? notice.content_bn : notice.content}
          </p>
        </CardContent>
      </Card>

      {/* Decision */}
      <Card>
        <CardContent className="pt-6">
          <DecisionSection
            decision={decision}
            isLoading={decisionLoading}
            isSaving={decisionSaving}
            onSave={saveDecision}
          />
        </CardContent>
      </Card>

      {/* Discussion */}
      <Card>
        <CardContent className="pt-6">
          <DiscussionThread
            comments={comments}
            total={total}
            hasMore={hasMore}
            isLoading={commentsLoading}
            isSubmitting={isSubmitting}
            currentUserId={currentUserId}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>
    </div>
  );
}
