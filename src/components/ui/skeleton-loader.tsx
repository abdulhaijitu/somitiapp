import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "chart";
  count?: number;
}

export function SkeletonLoader({ 
  className, 
  variant = "card",
  count = 1 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        );
      case "text":
        return (
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        );
      case "avatar":
        return (
          <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
        );
      case "chart":
        return (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-48 w-full bg-muted animate-pulse rounded-lg" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
}
