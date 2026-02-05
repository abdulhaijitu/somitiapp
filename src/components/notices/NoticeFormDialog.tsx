import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Send, Save } from 'lucide-react';
import type { Notice } from '@/hooks/useNotices';

interface NoticeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notice?: Notice | null;
  onSave: (data: {
    id?: string;
    title: string;
    title_bn?: string;
    content: string;
    content_bn?: string;
    status: 'draft' | 'published';
    is_pinned: boolean;
  }) => Promise<boolean>;
  isSaving: boolean;
  canPublish: boolean;
}

export function NoticeFormDialog({
  open,
  onOpenChange,
  notice,
  onSave,
  isSaving,
  canPublish,
}: NoticeFormDialogProps) {
  const { language, t } = useLanguage();
  const [title, setTitle] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [content, setContent] = useState('');
  const [contentBn, setContentBn] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    if (notice) {
      setTitle(notice.title || '');
      setTitleBn(notice.title_bn || '');
      setContent(notice.content || '');
      setContentBn(notice.content_bn || '');
      setIsPinned(notice.is_pinned || false);
    } else {
      setTitle('');
      setTitleBn('');
      setContent('');
      setContentBn('');
      setIsPinned(false);
    }
    setErrors({});
  }, [notice, open]);

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = language === 'bn' ? 'শিরোনাম আবশ্যক' : 'Title is required';
    }
    
    if (!content.trim()) {
      newErrors.content = language === 'bn' ? 'বিষয়বস্তু আবশ্যক' : 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!validate()) return;

    const success = await onSave({
      id: notice?.id,
      title: title.trim(),
      title_bn: titleBn.trim() || undefined,
      content: content.trim(),
      content_bn: contentBn.trim() || undefined,
      status,
      is_pinned: isPinned,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const isEditing = !!notice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? (language === 'bn' ? 'নোটিশ সম্পাদনা' : 'Edit Notice')
              : (language === 'bn' ? 'নতুন নোটিশ' : 'New Notice')
            }
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'নোটিশের তথ্য পূরণ করুন। ড্রাফট সংরক্ষণ করুন বা সরাসরি প্রকাশ করুন।'
              : 'Fill in the notice details. Save as draft or publish directly.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit('draft'); }} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {language === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'} *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'bn' ? 'ইংরেজি শিরোনাম লিখুন' : 'Enter English title'}
              disabled={isSaving}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Title Bangla */}
          <div className="space-y-2">
            <Label htmlFor="titleBn">
              {language === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}
            </Label>
            <Input
              id="titleBn"
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              placeholder={language === 'bn' ? 'বাংলা শিরোনাম লিখুন' : 'Enter Bengali title'}
              className="font-bengali"
              disabled={isSaving}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {language === 'bn' ? 'বিষয়বস্তু (ইংরেজি)' : 'Content (English)'} *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={language === 'bn' ? 'ইংরেজি বিষয়বস্তু লিখুন' : 'Enter English content'}
              rows={4}
              disabled={isSaving}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* Content Bangla */}
          <div className="space-y-2">
            <Label htmlFor="contentBn">
              {language === 'bn' ? 'বিষয়বস্তু (বাংলা)' : 'Content (Bengali)'}
            </Label>
            <Textarea
              id="contentBn"
              value={contentBn}
              onChange={(e) => setContentBn(e.target.value)}
              placeholder={language === 'bn' ? 'বাংলা বিষয়বস্তু লিখুন' : 'Enter Bengali content'}
              rows={4}
              className="font-bengali"
              disabled={isSaving}
            />
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isPinned" className="cursor-pointer">
              {language === 'bn' ? 'পিন করুন' : 'Pin this notice'}
            </Label>
            <Switch
              id="isPinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
              disabled={isSaving}
            />
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {language === 'bn' ? 'ড্রাফট সংরক্ষণ' : 'Save Draft'}
          </Button>

          {canPublish && (
            <Button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={isSaving}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {language === 'bn' ? 'প্রকাশ করুন' : 'Publish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
