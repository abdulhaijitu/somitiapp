import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statCardVariants = cva(
  "relative overflow-hidden rounded-xl border p-6 transition-all duration-300 ease-out hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-card border-border hover:-translate-y-0.5",
        primary: "bg-primary text-primary-foreground border-primary hover:-translate-y-0.5",
        accent: "bg-accent/10 border-accent/20 hover:-translate-y-0.5",
        success: "bg-success/10 border-success/20 text-success hover:-translate-y-0.5",
        warning: "bg-warning/10 border-warning/20 text-warning hover:-translate-y-0.5",
        glass: "bg-card/80 backdrop-blur-xl border-border/50 hover:-translate-y-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  className,
  variant,
  title,
  value,
  subtitle,
  icon,
  trend,
  ...props
}: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ variant }), className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-sm font-medium",
            variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            variant === "primary" ? "text-primary-foreground" : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 pt-1">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "rounded-lg p-2.5",
            variant === "primary" 
              ? "bg-primary-foreground/10" 
              : "bg-primary/10"
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
