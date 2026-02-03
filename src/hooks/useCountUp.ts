import { useState, useEffect, useRef, RefObject } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

interface UseCountUpReturn {
  count: number;
  formattedCount: string;
  ref: RefObject<HTMLDivElement>;
  isVisible: boolean;
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
}: UseCountUpOptions): UseCountUpReturn {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when element is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Animate the count when visible
  useEffect(() => {
    if (!isVisible || hasAnimated) return;

    setHasAnimated(true);
    const startTime = Date.now();
    const difference = end - start;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = start + difference * easeOutCubic;
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, hasAnimated, start, end, duration]);

  const formattedCount = `${prefix}${count.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;

  return { count, formattedCount, ref, isVisible };
}
