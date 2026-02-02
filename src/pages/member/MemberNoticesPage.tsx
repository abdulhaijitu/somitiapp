import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Bell, Calendar, Pin, User } from 'lucide-react';

// Sample notices - in production, these would come from the database
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
    content: 'অনুগ্রহ করে জানুয়ারি মাসের বকেয়া ২৫ তারিখের মধ্যে পরিশোধ করুন।',
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

export function MemberNoticesPage() {
  const { language } = useLanguage();

  // Sort notices: pinned first, then by date
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === 'bn') {
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString('bn-BD', options);
    }
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl font-bengali">
          {language === 'bn' ? 'নোটিশ বোর্ড' : 'Notice Board'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' 
            ? 'সমিতির গুরুত্বপূর্ণ ঘোষণা ও আপডেট' 
            : 'Important announcements and updates from your somiti'}
        </p>
      </div>

      {/* Notices List */}
      {sortedNotices.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={language === 'bn' ? 'কোনো নোটিশ নেই' : 'No Notices'}
          description={language === 'bn' 
            ? 'এই মুহূর্তে কোনো নোটিশ নেই।' 
            : 'There are no notices at this time.'}
        />
      ) : (
        <div className="space-y-4">
          {sortedNotices.map((notice, index) => (
            <Card 
              key={notice.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                notice.isPinned ? 'border-primary/30 bg-primary/5' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {/* Pin indicator */}
                  {notice.isPinned && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Pin className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold font-bengali leading-tight">
                        {language === 'bn' ? notice.title : notice.titleEn}
                      </CardTitle>
                      {notice.isPinned && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {language === 'bn' ? 'পিন করা' : 'Pinned'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(notice.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {notice.author}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={notice.isPinned ? 'pl-14' : ''}>
                <p className="text-foreground/80 font-bengali leading-relaxed">
                  {language === 'bn' ? notice.content : notice.contentEn}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
