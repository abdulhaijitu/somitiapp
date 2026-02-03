import { memo } from 'react';
import { cn } from '@/lib/utils';

interface DeveloperCreditProps {
  className?: string;
}

export const DeveloperCredit = memo(function DeveloperCredit({ className }: DeveloperCreditProps) {
  return (
    <footer 
      className={cn(
        "py-3 px-4 text-center text-xs text-muted-foreground/70",
        "border-t border-border/50 bg-background/50",
        className
      )}
    >
      <p>
        Design & Developed by{' '}
        <a
          href="http://creationtechbd.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Creation Tech
        </a>
      </p>
    </footer>
  );
});
