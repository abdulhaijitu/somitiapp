import { cn } from '@/lib/utils';

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Safely renders HTML content with proper styling for rich text display.
 * Used for read-only viewing of constitution and other HTML documents.
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html || html.trim() === '' || html === '<p></p>') {
    return null;
  }

  return (
    <div
      className={cn(
        'prose prose-sm sm:prose-base dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:text-foreground',
        'prose-p:text-foreground prose-p:leading-relaxed',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
        'prose-a:text-primary prose-a:underline',
        // Table styling
        '[&_table]:border-collapse [&_table]:w-full [&_table]:border [&_table]:border-border',
        '[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-border [&_td]:p-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
