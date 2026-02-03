import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  initializeGA, 
  trackPageView, 
  shouldEnableAnalytics, 
  shouldTrackRoute,
  GSC_VERIFICATION_CODE 
} from '@/lib/analytics';

/**
 * Analytics Provider Component
 * Handles GA4 initialization and page view tracking
 * Only tracks on public pages, respects privacy settings
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Initialize GA4 on mount (only in production, on public routes)
  useEffect(() => {
    if (shouldEnableAnalytics() && shouldTrackRoute(location.pathname)) {
      initializeGA();
    }
  }, []);
  
  // Track page views on route change
  useEffect(() => {
    if (shouldEnableAnalytics() && shouldTrackRoute(location.pathname)) {
      // Small delay to ensure page title is updated
      const timer = setTimeout(() => {
        trackPageView(location.pathname);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);
  
  return <>{children}</>;
}

/**
 * GSC Verification Meta Tag Component
 * Injects Google Search Console verification meta tag
 */
export function GSCVerification() {
  useEffect(() => {
    if (!GSC_VERIFICATION_CODE) {
      return;
    }
    
    // Check if already exists
    const existingMeta = document.querySelector('meta[name="google-site-verification"]');
    if (existingMeta) {
      existingMeta.setAttribute('content', GSC_VERIFICATION_CODE);
      return;
    }
    
    // Create new meta tag
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = GSC_VERIFICATION_CODE;
    document.head.appendChild(meta);
    
    return () => {
      const metaToRemove = document.querySelector('meta[name="google-site-verification"]');
      if (metaToRemove) {
        metaToRemove.remove();
      }
    };
  }, []);
  
  return null;
}

/**
 * Combined Analytics & GSC component for App.tsx
 */
export function AnalyticsSetup() {
  return (
    <>
      <GSCVerification />
    </>
  );
}
