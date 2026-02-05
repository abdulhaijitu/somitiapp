import { useLanguage } from '@/contexts/LanguageContext';
import { useConstitution } from '@/hooks/useConstitution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HtmlContent } from '@/components/editor';
import { BookOpen, Scale } from 'lucide-react';
import { format } from 'date-fns';

export function MemberConstitutionPage() {
  const { language } = useLanguage();
  const { constitution, isLoading } = useConstitution();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine content to display based on language preference
  const displayContent = language === 'bn' && constitution?.content_bn 
    ? constitution.content_bn 
    : constitution?.content;

  const hasContent = displayContent && displayContent.trim() !== '' && displayContent !== '<p></p>';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'সমিতির সংবিধান' : 'Somiti Constitution'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'সমিতির নিয়ম-নীতি ও পরিচালনা পদ্ধতি' 
            : 'Rules, regulations and governance of the somiti'}
        </p>
      </div>

      {/* Constitution Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Scale className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground font-bengali">
                {language === 'bn' ? 'সমিতির সংবিধান' : 'Somiti Constitution'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {constitution?.updated_at 
                  ? `${language === 'bn' ? 'সর্বশেষ আপডেট:' : 'Last updated:'} ${format(new Date(constitution.updated_at), 'PPP')}`
                  : (language === 'bn' ? 'কোনো তারিখ নেই' : 'No date available')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Constitution Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bengali">
            <BookOpen className="h-5 w-5" />
            {language === 'bn' ? 'সংবিধান' : 'Constitution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasContent ? (
            <div className="max-w-4xl font-bengali">
              <HtmlContent html={displayContent} />
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 font-bengali">
              {language === 'bn' 
                ? 'কোনো সংবিধান যোগ করা হয়নি।' 
                : 'No constitution has been added yet.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer Note */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center font-bengali">
            {language === 'bn' 
              ? 'এই সংবিধান সমিতির সকল সদস্যের জন্য বাধ্যতামূলক।' 
              : 'This constitution is binding for all members of the somiti.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
