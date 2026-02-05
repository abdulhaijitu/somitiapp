import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotices } from '@/hooks/useNotices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTableSkeleton } from '@/components/common/DataTableSkeleton';
import { Bell, Calendar, Pin, User } from 'lucide-react';

export function MemberNoticesPage() {
  const { language } = useLanguage();
  const { notices, isLoading, fetchNotices } = useNotices();

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Sort notices: pinned first, then by published date
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    const dateA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime();
    const dateB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime();
    return dateB - dateA;
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
      {isLoading ? (
        <DataTableSkeleton columns={1} rows={3} />
      ) : sortedNotices.length === 0 ? (
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
                notice.is_pinned ? 'border-primary/30 bg-primary/5' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {/* Pin indicator */}
                  {notice.is_pinned && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Pin className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold font-bengali leading-tight">
                        {language === 'bn' && notice.title_bn ? notice.title_bn : notice.title}
                      </CardTitle>
                      {notice.is_pinned && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {language === 'bn' ? 'পিন করা' : 'Pinned'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(notice.published_at || notice.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={notice.is_pinned ? 'pl-14' : ''}>
                <p className="text-foreground/80 font-bengali leading-relaxed whitespace-pre-wrap">
                  {language === 'bn' && notice.content_bn ? notice.content_bn : notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
