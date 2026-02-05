import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { List, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Section } from '@/hooks/useSectionNavigation';

interface SectionNavigationProps {
  sections: Section[];
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
  className?: string;
}

function SectionList({
  sections,
  activeSection,
  onSectionClick,
}: Omit<SectionNavigationProps, 'className'>) {
  const { language } = useLanguage();

  if (sections.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        {language === 'bn' 
          ? 'কোনো সেকশন নেই। হেডিং যোগ করুন।' 
          : 'No sections found. Add headings to create sections.'}
      </div>
    );
  }

  return (
    <nav className="space-y-1 p-2">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            section.level === 1 && 'font-semibold',
            section.level === 2 && 'pl-6 font-medium',
            section.level === 3 && 'pl-9 text-muted-foreground',
            activeSection === section.id && 'bg-primary/10 text-primary border-l-2 border-primary'
          )}
        >
          <span className="flex items-center gap-2">
            {section.level > 1 && (
              <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
            )}
            <span className="truncate">{section.title}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}

// Desktop sidebar navigation
export function SectionNavigationSidebar({
  sections,
  activeSection,
  onSectionClick,
  className,
}: SectionNavigationProps) {
  const { language } = useLanguage();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-6 self-start',
        'border border-border rounded-lg bg-card',
        'max-h-[calc(100vh-120px)]',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <List className="h-4 w-4" />
          {language === 'bn' ? 'বিষয়সূচি' : 'Contents'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sections.length} {language === 'bn' ? 'টি সেকশন' : 'sections'}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <SectionList
          sections={sections}
          activeSection={activeSection}
          onSectionClick={onSectionClick}
        />
      </ScrollArea>
    </aside>
  );
}

// Mobile sheet navigation
export function SectionNavigationMobile({
  sections,
  activeSection,
  onSectionClick,
}: Omit<SectionNavigationProps, 'className'>) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleSectionClick = (sectionId: string) => {
    onSectionClick(sectionId);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={sections.length === 0}
          >
            <List className="h-4 w-4" />
            {language === 'bn' ? 'বিষয়সূচি' : 'Sections'}
            {sections.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                {sections.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              {language === 'bn' ? 'বিষয়সূচি' : 'Contents'}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <SectionList
              sections={sections}
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
