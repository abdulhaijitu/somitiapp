import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isPromptVisible: boolean;
  showPrompt: () => void;
  hidePrompt: () => void;
  installApp: () => Promise<boolean>;
  dismissForNow: () => void;
}

const STORAGE_KEY = 'pwa_install_preference';
const DISMISS_DURATION_DAYS = 14;
const MIN_INTERACTIONS = 3;
const INTERACTION_KEY = 'pwa_interaction_count';

// Check if user has dismissed the prompt recently
function hasRecentlyDismissed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const { dismissedAt, installed } = JSON.parse(stored);
    
    // If already installed, never show
    if (installed) return true;
    
    // Check if 14 days have passed
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < DISMISS_DURATION_DAYS;
    }
    
    return false;
  } catch {
    return false;
  }
}

// Check if app is already installed as PWA
function isAppInstalled(): boolean {
  // Check display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari
  if ((navigator as any).standalone === true) return true;
  return false;
}

// Check if device is mobile
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Track user interactions
function incrementInteraction(): number {
  try {
    const count = parseInt(sessionStorage.getItem(INTERACTION_KEY) || '0', 10);
    const newCount = count + 1;
    sessionStorage.setItem(INTERACTION_KEY, String(newCount));
    return newCount;
  } catch {
    return 0;
  }
}

function getInteractionCount(): number {
  try {
    return parseInt(sessionStorage.getItem(INTERACTION_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

export function usePWAInstall(isLoggedIn: boolean = false): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const hasShownPrompt = useRef(false);

  // Capture beforeinstallprompt event
  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      // Store installed state
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ installed: true }));
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Track page interactions and auto-show prompt when conditions are met
  useEffect(() => {
    if (!isLoggedIn || !canInstall || isInstalled || hasShownPrompt.current) return;
    if (!isMobileDevice()) return;
    if (hasRecentlyDismissed()) return;

    // Track navigation/interactions
    const count = incrementInteraction();
    
    // Show prompt after MIN_INTERACTIONS
    if (count >= MIN_INTERACTIONS) {
      // Small delay to not interrupt user flow
      const timer = setTimeout(() => {
        if (!hasShownPrompt.current) {
          setIsPromptVisible(true);
          hasShownPrompt.current = true;
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, canInstall, isInstalled]);

  const showPrompt = useCallback(() => {
    if (canInstall && !isInstalled && !hasRecentlyDismissed()) {
      setIsPromptVisible(true);
    }
  }, [canInstall, isInstalled]);

  const hidePrompt = useCallback(() => {
    setIsPromptVisible(false);
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      // Show the browser install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setDeferredPrompt(null);
        setIsPromptVisible(false);
        
        // Store installed state
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ installed: true }));
        } catch {}
        
        return true;
      } else {
        // User dismissed browser prompt
        setIsPromptVisible(false);
        return false;
      }
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissForNow = useCallback(() => {
    setIsPromptVisible(false);
    
    // Store dismissal with timestamp
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dismissedAt: new Date().toISOString(),
        installed: false,
      }));
    } catch {}
  }, []);

  return {
    canInstall,
    isInstalled,
    isPromptVisible,
    showPrompt,
    hidePrompt,
    installApp,
    dismissForNow,
  };
}

// Hook to track if we should show the prompt on specific pages
export function usePWAPromptEligibility(pathname: string): boolean {
  // Don't show on these routes
  const excludedPaths = [
    '/login',
    '/member/login',
    '/super-admin/login',
    '/forgot-password',
    '/reset-password',
    '/payment-success',
    '/payment-cancelled',
  ];

  return !excludedPaths.some(path => pathname.includes(path));
}
