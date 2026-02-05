import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { useConstitution } from '@/hooks/useConstitution';
import { useSectionNavigation } from '@/hooks/useSectionNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor, HtmlContent } from '@/components/editor';
import { SectionNavigationSidebar, SectionNavigationMobile } from '@/components/constitution';
import { BookOpen, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';

export function ConstitutionPage() {
  const { t, language } = useLanguage();
  const { isAdmin } = useTenant();
  const { constitution, isLoading, isSaving, updateConstitution } = useConstitution();
  
  const [isEditing, setIsEditing] = useState(false);
  const [contentEn, setContentEn] = useState('');
  const [contentBn, setContentBn] = useState('');
  
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine which content to use for navigation based on current language
  const currentContent = language === 'bn' && contentBn ? contentBn : contentEn;
  const displayContent = language === 'bn' && constitution?.content_bn 
    ? constitution.content_bn 
    : constitution?.content;

  const { sections, activeSection, scrollToSection } = useSectionNavigation({
    containerRef: contentContainerRef,
    htmlContent: isEditing ? currentContent : displayContent,
    editorContent: isEditing ? currentContent : undefined,
  });

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
    const strippedContent = contentEn.replace(/<[^>]*>/g, '').trim();
    if (!strippedContent) {
      return;
    }
    
    const success = await updateConstitution(contentEn, contentBn);
    if (success) {
      setIsEditing(false);
    }
  };

  const isContentValid = contentEn.replace(/<[^>]*>/g, '').trim().length > 0;

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
        <div className="flex gap-6">
          <Skeleton className="hidden lg:block h-[400px] w-64 flex-shrink-0" />
          <Card className="flex-1">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.constitution')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'bn' ? 'সমিতির নিয়ম-নীতি ও পরিচালনা পদ্ধতি' : 'Rules and regulations of the somiti'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile section navigation */}
          <SectionNavigationMobile
            sections={sections}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
          
          {isAdmin && !isEditing && (
            <Button variant="outline" className="gap-2" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
              {language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Constitution'}
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !isContentValid}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving 
                  ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
                  : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content with navigation */}
      <div className="flex gap-6 items-start">
        {/* Desktop section navigation */}
        <SectionNavigationSidebar
          sections={sections}
          activeSection={activeSection}
          onSectionClick={scrollToSection}
        />

        {/* Constitution content */}
        <Card className="flex-1 border-border">
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
          <CardContent className="p-4 sm:p-6" ref={contentContainerRef}>
            {isEditing ? (
              <div className="space-y-6">
                {/* English Constitution Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'bn' ? 'ইংরেজি সংবিধান' : 'English Constitution'}
                  </label>
                  <RichTextEditor
                    content={contentEn}
                    onChange={setContentEn}
                    disabled={isSaving}
                    placeholder="Enter constitution content in English..."
                  />
                </div>

                {/* Bengali Constitution Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'bn' ? 'বাংলা সংবিধান' : 'Bengali Constitution'}
                  </label>
                  <RichTextEditor
                    content={contentBn}
                    onChange={setContentBn}
                    disabled={isSaving}
                    placeholder="বাংলায় সংবিধান লিখুন..."
                    className="font-bengali"
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-4xl">
                {displayContent && displayContent.trim() !== '' && displayContent !== '<p></p>' ? (
                  <div className="font-bengali">
                    <HtmlContent html={displayContent} />
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
    </div>
  );
}
