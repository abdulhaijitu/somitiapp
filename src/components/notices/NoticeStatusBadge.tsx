import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Send } from 'lucide-react';

interface NoticeStatusBadgeProps {
  status: 'draft' | 'published';
}

export function NoticeStatusBadge({ status }: NoticeStatusBadgeProps) {
  const { language } = useLanguage();

  if (status === 'published') {
    return (
      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
        <Send className="h-3 w-3 mr-1" />
        {language === 'bn' ? 'প্রকাশিত' : 'Published'}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-muted text-muted-foreground">
      <FileText className="h-3 w-3 mr-1" />
      {language === 'bn' ? 'ড্রাফট' : 'Draft'}
    </Badge>
  );
}
