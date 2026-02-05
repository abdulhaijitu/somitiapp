import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { useNotices, type Notice } from '@/hooks/useNotices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { NoticeFormDialog, NoticeStatusBadge } from '@/components/notices';
import { DataTableSkeleton } from '@/components/common/DataTableSkeleton';
import { Bell, Plus, Calendar, Pin, Edit, Trash2, Send, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export function NoticesPage() {
  const { t, language } = useLanguage();
  const { isAdmin, isManager } = useTenant();
  const { notices, isLoading, isSaving, fetchNotices, saveNotice, deleteNotice } = useNotices();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreateNew = () => {
    setEditingNotice(null);
    setFormOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormOpen(true);
  };

  const handleDelete = (notice: Notice) => {
    setNoticeToDelete(notice);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (noticeToDelete) {
      await deleteNotice(noticeToDelete.id);
      setDeleteConfirmOpen(false);
      setNoticeToDelete(null);
    }
  };

  const handleSave = async (data: {
    id?: string;
    title: string;
    title_bn?: string;
    content: string;
    content_bn?: string;
    status: 'draft' | 'published';
    is_pinned: boolean;
  }): Promise<boolean> => {
    const result = await saveNotice(data);
    return result !== null;
  };

  const handleQuickPublish = async (notice: Notice) => {
    await saveNotice({
      id: notice.id,
      title: notice.title,
      title_bn: notice.title_bn || undefined,
      content: notice.content,
      content_bn: notice.content_bn || undefined,
      status: 'published',
      is_pinned: notice.is_pinned,
    });
  };

  const handleUnpublish = async (notice: Notice) => {
    await saveNotice({
      id: notice.id,
      title: notice.title,
      title_bn: notice.title_bn || undefined,
      content: notice.content,
      content_bn: notice.content_bn || undefined,
      status: 'draft',
      is_pinned: notice.is_pinned,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'bn') {
      return date.toLocaleDateString('bn-BD', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const canCreate = isAdmin || isManager;
  const canPublish = isAdmin;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.notices')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'bn' 
              ? 'গুরুত্বপূর্ণ ঘোষণা ও আপডেট পরিচালনা করুন' 
              : 'Manage important announcements and updates'
            }
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateNew} className="gap-2 bg-gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4" />
            {language === 'bn' ? 'নতুন নোটিশ' : 'New Notice'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <DataTableSkeleton columns={1} rows={3} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={language === 'bn' ? 'কোনো নোটিশ নেই' : 'No Notices'}
          description={
            language === 'bn' 
              ? canCreate 
                ? 'এখনো কোনো নোটিশ তৈরি করা হয়নি। প্রথম নোটিশ তৈরি করুন।' 
                : 'এই মুহূর্তে কোনো নোটিশ নেই।'
              : canCreate 
                ? 'No notices created yet. Create your first notice.'
                : 'There are no notices at this time.'
          }
          actionLabel={canCreate ? (language === 'bn' ? 'নোটিশ তৈরি করুন' : 'Create Notice') : undefined}
          onAction={canCreate ? handleCreateNew : undefined}
        />
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card 
              key={notice.id} 
              className={`border-border transition-all duration-200 hover:shadow-md ${
                notice.is_pinned ? 'border-primary/30 bg-primary/5' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.is_pinned && (
                        <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <CardTitle className="text-lg font-bengali">
                        {language === 'bn' && notice.title_bn ? notice.title_bn : notice.title}
                      </CardTitle>
                      <NoticeStatusBadge status={notice.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notice.status === 'published' && notice.published_at 
                          ? notice.published_at 
                          : notice.created_at
                        )}
                      </span>
                      {notice.status === 'draft' && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'bn' ? 'সর্বশেষ সংশোধন' : 'Last edited'}: {formatDate(notice.updated_at)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(isAdmin || (isManager && notice.status === 'draft')) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(notice)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </DropdownMenuItem>
                        
                        {isAdmin && notice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleQuickPublish(notice)}>
                            <Send className="h-4 w-4 mr-2" />
                            {language === 'bn' ? 'প্রকাশ করুন' : 'Publish'}
                          </DropdownMenuItem>
                        )}
                        
                        {isAdmin && notice.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleUnpublish(notice)}>
                            <Bell className="h-4 w-4 mr-2" />
                            {language === 'bn' ? 'ড্রাফটে ফেরান' : 'Unpublish'}
                          </DropdownMenuItem>
                        )}
                        
                        {isAdmin && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(notice)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-bengali whitespace-pre-wrap">
                  {language === 'bn' && notice.content_bn ? notice.content_bn : notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <NoticeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        notice={editingNotice}
        onSave={handleSave}
        isSaving={isSaving}
        canPublish={canPublish}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={language === 'bn' ? 'নোটিশ মুছে ফেলুন' : 'Delete Notice'}
        description={
          language === 'bn'
            ? `আপনি কি নিশ্চিত যে আপনি "${noticeToDelete?.title}" নোটিশটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`
            : `Are you sure you want to delete "${noticeToDelete?.title}"? This action cannot be undone.`
        }
        confirmLabel={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
