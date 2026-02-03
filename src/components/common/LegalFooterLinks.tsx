import { memo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LegalFooterLinksProps {
  className?: string;
  separator?: string;
}

export const LegalFooterLinks = memo(function LegalFooterLinks({ 
  className,
  separator = '|'
}: LegalFooterLinksProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 text-xs text-muted-foreground", className)}>
      <Link 
        to="/terms" 
        className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
      >
        Terms of Service
      </Link>
      <span className="text-muted-foreground/50">{separator}</span>
      <Link 
        to="/privacy" 
        className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
      >
        Privacy Policy
      </Link>
    </div>
  );
});
