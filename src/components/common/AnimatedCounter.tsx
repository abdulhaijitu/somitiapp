import { useCountUp } from '@/hooks/useCountUp';

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const { formattedCount, ref } = useCountUp({
    start,
    end,
    duration,
    decimals,
    prefix,
    suffix,
  });

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className}>
      {formattedCount}
    </span>
  );
}
