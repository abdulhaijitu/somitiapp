import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Calendar, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const notices = [
  {
    id: '1',
    title: 'বার্ষিক সাধারণ সভা',
    titleEn: 'Annual General Meeting',
    content: 'সকল সদস্যদের উপস্থিতি কাম্য। সভা ২০ জানুয়ারি সন্ধ্যা ৬টায় অনুষ্ঠিত হবে।',
    contentEn: 'All members are requested to attend. Meeting will be held on January 20 at 6 PM.',
    date: '2024-01-10',
    isPinned: true,
    author: 'Admin'
  },
  {
    id: '2',
    title: 'Monthly Payment Reminder',
    titleEn: 'Monthly Payment Reminder',
    content: 'Please clear your January dues by the 25th to avoid late fees.',
    contentEn: 'Please clear your January dues by the 25th to avoid late fees.',
    date: '2024-01-08',
    isPinned: false,
    author: 'Manager'
  },
  {
    id: '3',
    title: 'নতুন সদস্য নিবন্ধন',
    titleEn: 'New Member Registration',
    content: 'নতুন সদস্য নিবন্ধন এখন খোলা আছে। আগ্রহীরা যোগাযোগ করুন।',
    contentEn: 'New member registration is now open. Interested members please contact.',
    date: '2024-01-05',
    isPinned: false,
    author: 'Admin'
  },
];

export function NoticesPage() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.notices')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Important announcements and updates
          </p>
        </div>
        <Button className="gap-2 bg-gradient-primary hover:opacity-90">
          <Plus className="h-4 w-4" />
          New Notice
        </Button>
      </div>

      <div className="space-y-4">
        {notices.map((notice) => (
          <Card key={notice.id} className={`border-border ${notice.isPinned ? 'border-primary/30 bg-primary/5' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-lg font-bengali">
                      {language === 'bn' ? notice.title : notice.titleEn}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {notice.date}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {notice.author}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-bengali">
                {language === 'bn' ? notice.content : notice.contentEn}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
