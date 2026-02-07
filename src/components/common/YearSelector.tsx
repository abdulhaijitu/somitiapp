import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function YearSelector({ years, selectedYear, onYearChange }: YearSelectorProps) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Select
        value={String(selectedYear)}
        onValueChange={(v) => onYearChange(Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {language === 'bn' ? `${year} সাল` : `Year ${year}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-1.5 pb-1">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`
              shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all
              ${selectedYear === year
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            {year}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
