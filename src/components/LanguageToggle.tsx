import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {language === 'en' ? 'বাংলা' : 'English'}
      </span>
    </Button>
  );
}
