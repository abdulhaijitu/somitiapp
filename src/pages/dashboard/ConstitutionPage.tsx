import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { useConstitution } from '@/hooks/useConstitution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';

export function ConstitutionPage() {
  const { t, language } = useLanguage();
  const { isAdmin } = useTenant();
  const { constitution, isLoading, isSaving, updateConstitution } = useConstitution();
  
  const [isEditing, setIsEditing] = useState(false);
  const [contentEn, setContentEn] = useState('');
  const [contentBn, setContentBn] = useState('');

  

  useEffect(() => {
    if (constitution) {
      setContentEn(constitution.content || '');
      setContentBn(constitution.content_bn || '');
    }
  }, [constitution]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (constitution) {
      setContentEn(constitution.content || '');
      setContentBn(constitution.content_bn || '');
    }
  };

  const handleSave = async () => {
    const success = await updateConstitution(contentEn, contentBn);
    if (success) {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.constitution')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'bn' ? 'সমিতির নিয়ম-নীতি ও পরিচালনা পদ্ধতি' : 'Rules and regulations of the somiti'}
          </p>
        </div>
        {isAdmin && !isEditing && (
          <Button variant="outline" className="gap-2" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
            {language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Constitution'}
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}
            </Button>
          </div>
        )}
      </div>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-bengali">
                {language === 'bn' ? 'সমিতির সংবিধান' : 'Somiti Constitution'}
              </CardTitle>
              {constitution?.updated_at && (
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'সর্বশেষ আপডেট:' : 'Last updated:'} {format(new Date(constitution.updated_at), 'PPP')}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="content-en">
                  {language === 'bn' ? 'ইংরেজি সংবিধান' : 'English Constitution'}
                </Label>
                <Textarea
                  id="content-en"
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                  placeholder="Enter constitution content in English..."
                  className="min-h-[200px]"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-bn">
                  {language === 'bn' ? 'বাংলা সংবিধান' : 'Bengali Constitution'}
                </Label>
                <Textarea
                  id="content-bn"
                  value={contentBn}
                  onChange={(e) => setContentBn(e.target.value)}
                  placeholder="বাংলায় সংবিধান লিখুন..."
                  className="min-h-[200px] font-bengali"
                  disabled={isSaving}
                />
              </div>
            </>
          ) : (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {constitution ? (
                <div className="whitespace-pre-wrap font-bengali leading-relaxed">
                  {language === 'bn' && constitution.content_bn 
                    ? constitution.content_bn 
                    : constitution.content || (language === 'bn' ? 'কোনো সংবিধান যোগ করা হয়নি।' : 'No constitution has been added yet.')}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {language === 'bn' 
                    ? 'কোনো সংবিধান যোগ করা হয়নি। সম্পাদনা করতে উপরের বোতামে ক্লিক করুন।' 
                    : 'No constitution has been added yet. Click the edit button above to add one.'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
