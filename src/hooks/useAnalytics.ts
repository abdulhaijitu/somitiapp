import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  AnalyticsEvents, 
  trackEvent, 
  shouldEnableAnalytics, 
  shouldTrackRoute,
  EventCategory 
} from '@/lib/analytics';

/**
 * Hook for tracking analytics events
 * Only works on public pages and in production
 */
export function useAnalytics() {
  const location = useLocation();
  
  // Check if tracking is allowed for current page
  const isTrackingAllowed = useCallback(() => {
    return shouldEnableAnalytics() && shouldTrackRoute(location.pathname);
  }, [location.pathname]);
  
  // Generic event tracking
  const track = useCallback((
    category: EventCategory,
    action: string,
    label?: string,
    value?: number
  ) => {
    if (!isTrackingAllowed()) return;
    trackEvent({ category, action, label, value });
  }, [isTrackingAllowed]);
  
  // Pre-defined event helpers
  const trackCTA = useCallback((buttonName: string) => {
    if (!isTrackingAllowed()) return;
    AnalyticsEvents.ctaClick(buttonName);
  }, [isTrackingAllowed]);
  
  const trackLoginAttempt = useCallback(() => {
    if (!isTrackingAllowed()) return;
    AnalyticsEvents.loginAttempt();
  }, [isTrackingAllowed]);
  
  const trackLoginSuccess = useCallback(() => {
    if (!isTrackingAllowed()) return;
    AnalyticsEvents.loginSuccess();
  }, [isTrackingAllowed]);
  
  const trackLoginFailure = useCallback(() => {
    if (!isTrackingAllowed()) return;
    AnalyticsEvents.loginFailure();
  }, [isTrackingAllowed]);
  
  const trackNavigation = useCallback((destination: string) => {
    if (!isTrackingAllowed()) return;
    AnalyticsEvents.navClick(destination);
  }, [isTrackingAllowed]);
  
  return {
    track,
    trackCTA,
    trackLoginAttempt,
    trackLoginSuccess,
    trackLoginFailure,
    trackNavigation,
    isTrackingAllowed,
  };
}

/**
 * Hook for tracking scroll depth
 * Tracks 25%, 50%, 75%, 100% scroll milestones
 */
export function useScrollTracking() {
  const location = useLocation();
  const trackedMilestones = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    if (!shouldEnableAnalytics() || !shouldTrackRoute(location.pathname)) {
      return;
    }
    
    // Reset milestones on page change
    trackedMilestones.current.clear();
    
    const milestones = [25, 50, 75, 100];
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !trackedMilestones.current.has(milestone)) {
          trackedMilestones.current.add(milestone);
          AnalyticsEvents.scrollDepth(milestone);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
}

/**
 * Hook for tracking time on page
 * Reports time spent when user leaves the page
 */
export function useTimeOnPageTracking() {
  const location = useLocation();
  const startTime = useRef<number>(Date.now());
  
  useEffect(() => {
    if (!shouldEnableAnalytics() || !shouldTrackRoute(location.pathname)) {
      return;
    }
    
    // Reset timer on page change
    startTime.current = Date.now();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
        if (timeSpent > 5) { // Only track if > 5 seconds
          AnalyticsEvents.timeOnPage(timeSpent);
        }
      }
    };
    
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent > 5) {
        AnalyticsEvents.timeOnPage(timeSpent);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);
}
