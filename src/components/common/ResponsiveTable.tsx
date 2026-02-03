import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  header: string;
  headerBn?: string;
  // Render function for table cell
  render: (item: T, index: number) => React.ReactNode;
  // Render function for mobile card (optional, uses render if not provided)
  renderMobile?: (item: T, index: number) => React.ReactNode;
  // Whether to hide on mobile card view
  hideOnMobile?: boolean;
  // Whether this is a primary field (shown prominently on mobile)
  isPrimary?: boolean;
  // Column width class
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string;
  language?: 'en' | 'bn';
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  // Mobile card layout options
  mobileCardTitle?: (item: T) => React.ReactNode;
  mobileCardSubtitle?: (item: T) => React.ReactNode;
  mobileCardActions?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

function ResponsiveTableInner<T>({
  data,
  columns,
  keyExtractor,
  language = 'en',
  isLoading = false,
  loadingRows = 5,
  emptyState,
  onRowClick,
  mobileCardTitle,
  mobileCardSubtitle,
  mobileCardActions,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  // Loading skeleton
  if (isLoading) {
    return isMobile ? (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="h-12 px-4 text-left text-sm font-medium text-muted-foreground">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border">
                  {columns.map((col) => (
                    <td key={col.key} className="p-4">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <Card 
            key={keyExtractor(item, index)}
            className={cn(
              "overflow-hidden transition-all duration-200",
              onRowClick && "cursor-pointer active:scale-[0.98] hover:shadow-md"
            )}
            onClick={onRowClick ? () => onRowClick(item, index) : undefined}
          >
            <CardContent className="p-4">
              {/* Card header with title/subtitle */}
              {(mobileCardTitle || mobileCardSubtitle) && (
                <div className="mb-3">
                  {mobileCardTitle && (
                    <div className="font-semibold text-foreground font-bengali">
                      {mobileCardTitle(item)}
                    </div>
                  )}
                  {mobileCardSubtitle && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {mobileCardSubtitle(item)}
                    </div>
                  )}
                </div>
              )}

              {/* Card content - non-primary, non-hidden columns */}
              <div className="space-y-2">
                {columns
                  .filter(col => !col.hideOnMobile && !col.isPrimary)
                  .map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground font-bengali shrink-0">
                        {language === 'bn' && col.headerBn ? col.headerBn : col.header}:
                      </span>
                      <span className="text-right font-medium">
                        {col.renderMobile ? col.renderMobile(item, index) : col.render(item, index)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Card actions */}
              {mobileCardActions && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                  {mobileCardActions(item, index)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={cn(
                    "h-12 px-4 text-left text-sm font-medium text-muted-foreground whitespace-nowrap",
                    col.className
                  )}
                >
                  {language === 'bn' && col.headerBn ? col.headerBn : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr 
                key={keyExtractor(item, index)}
                className={cn(
                  "border-t border-border transition-colors duration-150",
                  "hover:bg-muted/50",
                  onRowClick && "cursor-pointer"
                )}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("p-4 text-sm", col.className)}>
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Memoized version for performance
export const ResponsiveTable = memo(ResponsiveTableInner) as typeof ResponsiveTableInner;
