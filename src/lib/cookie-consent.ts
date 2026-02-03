/**
 * Cookie Consent Management
 * GDPR-compliant consent tracking for analytics and cookies
 */

export const CONSENT_STORAGE_KEY = 'somiti_cookie_consent';

export interface ConsentStatus {
  necessary: boolean; // Always true - required for app functionality
  analytics: boolean; // User can opt-out
  timestamp: number;  // When consent was given/updated
}

/**
 * Get current consent status from localStorage
 */
export function getConsentStatus(): ConsentStatus | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    const consent = JSON.parse(stored) as ConsentStatus;
    
    // Validate structure
    if (typeof consent.necessary !== 'boolean' || 
        typeof consent.analytics !== 'boolean' ||
        typeof consent.timestamp !== 'number') {
      return null;
    }
    
    return consent;
  } catch {
    return null;
  }
}

/**
 * Set consent status in localStorage
 */
export function setConsentStatus(consent: ConsentStatus): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Failed to save consent status:', error);
  }
}

/**
 * Check if analytics tracking is allowed
 */
export function isAnalyticsAllowed(): boolean {
  const consent = getConsentStatus();
  
  // If no consent given yet, don't track (GDPR default)
  if (!consent) return false;
  
  return consent.analytics === true;
}

/**
 * Reset consent (for testing or when user wants to reconfigure)
 */
export function resetConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if consent banner should be shown
 */
export function shouldShowConsentBanner(): boolean {
  return getConsentStatus() === null;
}

/**
 * Update only analytics consent
 */
export function updateAnalyticsConsent(enabled: boolean): void {
  const current = getConsentStatus();
  const newConsent: ConsentStatus = {
    necessary: true,
    analytics: enabled,
    timestamp: Date.now(),
  };
  
  if (current) {
    newConsent.necessary = current.necessary;
  }
  
  setConsentStatus(newConsent);
}
