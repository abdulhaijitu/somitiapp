import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Loader2, Send, Trash2, MessageSquare, ChevronDown, User } from 'lucide-react';
import type { NoticeComment } from '@/hooks/useNoticeComments';

interface DiscussionThreadProps {
  comments: NoticeComment[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  currentUserId: string | null;
  onAddComment: (comment: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  onLoadMore: () => void;
  disabled?: boolean;
}

const ROLE_LABELS: Record<string, { en: string; bn: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { en: 'Admin', bn: 'অ্যাডমিন', variant: 'default' },
  manager: { en: 'Manager', bn: 'ম্যানেজার', variant: 'secondary' },
  member: { en: 'Member', bn: 'সদস্য', variant: 'outline' },
  super_admin: { en: 'Super Admin', bn: 'সুপার অ্যাডমিন', variant: 'default' },
};

export function DiscussionThread({
  comments,
  total,
  hasMore,
  isLoading,
  isSubmitting,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onLoadMore,
  disabled = false,
}: DiscussionThreadProps) {
  const { language } = useLanguage();
  const { isAdmin } = useTenant();
  const [newComment, setNewComment] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    const success = await onAddComment(newComment.trim());
    if (success) setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (commentToDelete) {
      await onDeleteComment(commentToDelete);
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'bn') {
      return date.toLocaleString('bn-BD', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    return date.toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {language === 'bn' ? 'আলোচনা' : 'Discussion'}
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>
          )}
        </h3>
      </div>

      {/* Comments list */}
      {isLoading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {language === 'bn' ? 'এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করুন!' : 'No comments yet. Be the first to comment!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg border border-border p-3 transition-colors ${
                comment.user_id === currentUserId ? 'bg-primary/5' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-sm">{comment.user_name}</span>
                  <Badge variant={ROLE_LABELS[comment.user_role]?.variant || 'outline'} className="text-xs px-1.5 py-0">
                    {language === 'bn'
                      ? ROLE_LABELS[comment.user_role]?.bn || comment.user_role
                      : ROLE_LABELS[comment.user_role]?.en || comment.user_role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteClick(comment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground/80 whitespace-pre-wrap pl-9">
                {comment.comment}
              </p>
            </div>
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {language === 'bn' ? 'আরো লোড করুন' : 'Load More'}
            </Button>
          )}
        </div>
      )}

      {/* Comment input */}
      {!disabled && (
        <div className="flex gap-2 items-end pt-2 border-t border-border">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'bn' ? 'আপনার মন্তব্য লিখুন... (Ctrl+Enter পাঠাতে)' : 'Write your comment... (Ctrl+Enter to send)'}
            rows={2}
            className="flex-1 resize-none"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={language === 'bn' ? 'মন্তব্য মুছুন' : 'Delete Comment'}
        description={language === 'bn' ? 'আপনি কি নিশ্চিত এই মন্তব্য মুছে ফেলতে চান?' : 'Are you sure you want to delete this comment?'}
        confirmLabel={language === 'bn' ? 'মুছুন' : 'Delete'}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
