import { NavLink } from '@/components/NavLink';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  key: string;
  label: string;
  labelBn: string;
  icon: LucideIcon;
  href: string;
  end?: boolean;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  const { language } = useLanguage();
  
  // Only show on mobile (handled via CSS)
  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "border-t border-border bg-card/95 backdrop-blur-lg",
        "safe-area-bottom",
        className
      )}
    >
      <div className="flex items-stretch justify-around">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.href}
            end={item.end}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1",
              "text-muted-foreground transition-colors duration-200",
              "min-h-[56px] min-w-[56px]", // Minimum touch target
              "active:scale-95 active:bg-muted/50" // Press feedback
            )}
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "relative flex items-center justify-center",
                  "h-6 w-6"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-tight text-center truncate max-w-full px-0.5",
                  "font-bengali"
                )}>
                  {language === 'bn' ? item.labelBn : item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/**
 * Hook to detect if we should show bottom nav
 * Returns true on mobile, false on tablet/desktop
 */
export function useShowBottomNav() {
  // This is CSS-driven, but we provide a hook for content padding calculations
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}
