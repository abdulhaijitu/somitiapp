import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Edit } from 'lucide-react';

export function ConstitutionPage() {
  const { t, language } = useLanguage();

  const sections = [
    {
      id: '1',
      title: language === 'bn' ? 'প্রস্তাবনা' : 'Preamble',
      content: language === 'bn' 
        ? 'এই সমিতি গঠিত হয়েছে সদস্যদের সামাজিক ও আর্থিক উন্নয়নের জন্য।'
        : 'This somiti has been formed for the social and financial development of its members.'
    },
    {
      id: '2',
      title: language === 'bn' ? 'সদস্যপদ' : 'Membership',
      content: language === 'bn'
        ? 'যেকোনো বাংলাদেশি নাগরিক এই সমিতির সদস্য হতে পারবেন। সদস্য হতে হলে মাসিক চাঁদা প্রদান করতে হবে।'
        : 'Any Bangladeshi citizen can become a member of this somiti. Members must pay monthly contributions.'
    },
    {
      id: '3',
      title: language === 'bn' ? 'কার্যনির্বাহী পরিষদ' : 'Executive Committee',
      content: language === 'bn'
        ? 'কার্যনির্বাহী পরিষদ সভাপতি, সাধারণ সম্পাদক, কোষাধ্যক্ষ এবং ৫ জন সদস্য নিয়ে গঠিত হবে।'
        : 'The executive committee shall consist of President, General Secretary, Treasurer and 5 members.'
    },
    {
      id: '4',
      title: language === 'bn' ? 'আর্থিক ব্যবস্থাপনা' : 'Financial Management',
      content: language === 'bn'
        ? 'সকল আয়-ব্যয়ের হিসাব সঠিকভাবে সংরক্ষণ করতে হবে এবং বার্ষিক সভায় উপস্থাপন করতে হবে।'
        : 'All income and expenses must be properly recorded and presented at the annual meeting.'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.constitution')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Rules and regulations of the somiti
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Constitution
        </Button>
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
              <p className="text-sm text-muted-foreground">
                Last updated: January 1, 2024
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className={`p-6 ${index !== sections.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {section.id}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground font-bengali">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground font-bengali leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
