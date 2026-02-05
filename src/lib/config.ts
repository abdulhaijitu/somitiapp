/**
 * Environment Configuration
 * Centralized configuration for development vs production environments
 */

export type Environment = 'development' | 'production';

// Determine current environment
export const getEnvironment = (): Environment => {
  const mode = import.meta.env.MODE;
  // Check for production mode or production domain
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProduction = mode === 'production' || 
    hostname.includes('somitiapp.com') ||
    hostname.endsWith('.app'); // Covers preview/staging domains
  
  return isProduction ? 'production' : 'development';
};

export const config = {
  // Environment info
  env: getEnvironment(),
  isDevelopment: getEnvironment() === 'development',
  isProduction: getEnvironment() === 'production',
  
  // App info
  appName: 'Somiti',
  appNameBn: 'সমিতি',
  
  // Domain configuration
  domain: {
    base: 'somitiapp.com',
    preview: 'somitiapp.app', // Preview/staging domain
    get current() {
      return window.location.hostname;
    },
    get isSubdomain() {
      return this.current.split('.').length > 2;
    },
    get subdomain() {
      const parts = this.current.split('.');
      return parts.length > 2 ? parts[0] : null;
    }
  },
  
  // Feature flags (toggle risky features)
  features: {
    onlinePayments: true,
    smsNotifications: true,
    memberPortal: true,
    reports: true,
    // Can be disabled in emergency
    get paymentsEnabled() {
      return this.onlinePayments;
    },
    get smsEnabled() {
      return this.smsNotifications;
    }
  },
  
  // Subscription settings
  subscription: {
    gracePeriodDays: 7, // Days after expiry before complete lockout
    warningDays: 7, // Days before expiry to show warning
    autoSuspendOnExpiry: true
  },
  
  // Rate limiting (client-side awareness)
  limits: {
    maxMembersPerPage: 50,
    maxPaymentsPerPage: 50,
    maxExportRows: 1000,
    smsPerDay: 100
  },
  
  // Debug settings
  debug: {
    // Only log in development
    get enabled() {
      return getEnvironment() === 'development';
    },
    logApiCalls: false,
    logStateChanges: false
  }
};

// Type-safe logger that only works in development
export const devLog = (...args: unknown[]) => {
  if (config.debug.enabled) {
    console.log('[DEV]', ...args);
  }
};

export const devWarn = (...args: unknown[]) => {
  if (config.debug.enabled) {
    console.warn('[DEV]', ...args);
  }
};

export const devError = (...args: unknown[]) => {
  // Always log errors, but with context
  if (config.debug.enabled) {
    console.error('[DEV]', ...args);
  } else {
    // In production, you might send to error tracking service
    console.error('[ERROR]', ...args);
  }
};

// Soft delete utilities
export const softDeleteRecord = async (
  table: string,
  id: string,
  supabaseClient: unknown
) => {
  // This is a pattern - actual implementation depends on table structure
  // Tables with deleted_at column use this approach
  devLog(`Soft deleting ${table}:${id}`);
  return { table, id };
};

export default config;
