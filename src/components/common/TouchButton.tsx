import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * TouchButton - A button optimized for touch interactions
 * Features:
 * - Minimum 44px touch target
 * - Press feedback (scale down on active)
 * - Hover only on desktop
 * - Proper disabled states
 */
export const TouchButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Minimum touch target
          "min-h-[44px] min-w-[44px]",
          // Press feedback
          "active:scale-[0.97] transition-transform duration-100",
          // Hover only on devices that support it
          "[@media(hover:hover)]:hover:opacity-90",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

/**
 * TouchIconButton - Icon-only button with proper touch target
 */
export const TouchIconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(
          // Minimum touch target for icon buttons
          "h-11 w-11",
          // Press feedback
          "active:scale-90 transition-transform duration-100",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

TouchIconButton.displayName = 'TouchIconButton';
