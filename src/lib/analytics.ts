/**
 * Google Analytics (GA4) Integration
 * Privacy-safe, environment-aware, white-label analytics
 * GDPR-compliant with cookie consent integration
 */

import { config } from './config';
import { isAnalyticsAllowed } from './cookie-consent';

// GA4 Measurement ID from environment
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// GSC Verification Code from environment
export const GSC_VERIFICATION_CODE = import.meta.env.VITE_GSC_VERIFICATION_CODE;

// Check if analytics should be enabled
export function shouldEnableAnalytics(): boolean {
  // Only enable in production
  if (!config.isProduction) {
    return false;
  }
  
  // Must have a valid measurement ID
  if (!GA_MEASUREMENT_ID) {
    return false;
  }
  
  // Respect Do Not Track preference
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
    return false;
  }
  
  // GDPR: Check cookie consent
  if (!isAnalyticsAllowed()) {
    return false;
  }
  
  return true;
}

// Routes where analytics should be loaded (public pages only)
const TRACKED_ROUTES = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/install',
  '/login',
  '/member-login',
  '/member/login',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/pitch',
  '/mobile-roadmap',
];

// Check if current route should be tracked
export function shouldTrackRoute(pathname: string): boolean {
  // Never track private routes
  const privatePatterns = [
    '/dashboard',
    '/super-admin',
    '/member/',
    '/admin',
    '/settings',
    '/reset-password',
  ];
  
  if (privatePatterns.some(pattern => pathname.startsWith(pattern))) {
    return false;
  }
  
  // Only track explicitly allowed routes or landing-like pages
  return TRACKED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Initialize GA4
export function initializeGA(): void {
  if (!shouldEnableAnalytics() || !GA_MEASUREMENT_ID) {
    return;
  }
  
  // Check if already initialized
  if (window.gtag) {
    return;
  }
  
  // Create gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  
  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Privacy settings
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // Don't send page views automatically - we'll control them
    send_page_view: false,
  });
}

// Track page view (privacy-safe)
export function trackPageView(path: string, title?: string): void {
  if (!shouldEnableAnalytics() || !shouldTrackRoute(path)) {
    return;
  }
  
  if (!window.gtag) {
    initializeGA();
  }
  
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

// Track events (privacy-safe)
export type EventCategory = 'engagement' | 'auth' | 'navigation' | 'cta';

interface TrackEventOptions {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
}

export function trackEvent({ category, action, label, value }: TrackEventOptions): void {
  if (!shouldEnableAnalytics()) {
    return;
  }
  
  // Never track from private pages
  if (typeof window !== 'undefined' && !shouldTrackRoute(window.location.pathname)) {
    return;
  }
  
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Pre-defined safe events
export const AnalyticsEvents = {
  // Landing page
  ctaClick: (buttonName: string) => trackEvent({
    category: 'cta',
    action: 'cta_click',
    label: buttonName,
  }),
  
  // Auth events (no sensitive data)
  loginAttempt: () => trackEvent({
    category: 'auth',
    action: 'login_attempt',
  }),
  
  loginSuccess: () => trackEvent({
    category: 'auth',
    action: 'login_success',
  }),
  
  loginFailure: () => trackEvent({
    category: 'auth',
    action: 'login_failure',
  }),
  
  // Navigation
  navClick: (destination: string) => trackEvent({
    category: 'navigation',
    action: 'nav_click',
    label: destination,
  }),
  
  // General engagement
  scrollDepth: (percentage: number) => trackEvent({
    category: 'engagement',
    action: 'scroll_depth',
    value: percentage,
  }),
  
  timeOnPage: (seconds: number) => trackEvent({
    category: 'engagement',
    action: 'time_on_page',
    value: seconds,
  }),
};

// Type declarations for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
