import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

// Standardized error messages for different error types
const ERROR_MESSAGES: Record<string, string> = {
  'PGRST301': 'Access denied. Please check your permissions.',
  'PGRST116': 'The requested resource was not found.',
  'PGRST204': 'No data returned from the request.',
  '23505': 'This record already exists.',
  '23503': 'Cannot complete this action due to related data.',
  '23502': 'Required information is missing.',
  '42501': 'You do not have permission to perform this action.',
  'network_error': 'Unable to connect. Please check your internet connection.',
  'timeout': 'The request took too long. Please try again.',
  'rate_limited': 'Too many requests. Please wait a moment and try again.',
  'subscription_expired': 'Your subscription has expired. Please renew to continue.',
  'tenant_suspended': 'Your organization has been suspended. Please contact support.',
  'unauthorized': 'Please sign in to continue.',
  'forbidden': 'You do not have permission to access this resource.',
  'server_error': 'Something went wrong on our end. Please try again later.',
  'default': 'An unexpected error occurred. Please try again.'
};

export interface ApiError {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
}

export function getErrorMessage(error: ApiError | Error | unknown): string {
  if (!error) return ERROR_MESSAGES.default;

  // Handle Supabase errors
  if (typeof error === 'object' && error !== null) {
    const err = error as ApiError;
    
    // Check for known error codes
    if (err.code && ERROR_MESSAGES[err.code]) {
      return ERROR_MESSAGES[err.code];
    }

    // Check for HTTP status-based errors
    if (err.status) {
      switch (err.status) {
        case 401: return ERROR_MESSAGES.unauthorized;
        case 403: return ERROR_MESSAGES.forbidden;
        case 404: return ERROR_MESSAGES.PGRST116;
        case 429: return ERROR_MESSAGES.rate_limited;
        case 500:
        case 502:
        case 503:
        case 504:
          return ERROR_MESSAGES.server_error;
      }
    }

    // Check for specific error messages
    if (err.message) {
      const msg = err.message.toLowerCase();
      
      if (msg.includes('subscription') || msg.includes('expired')) {
        return ERROR_MESSAGES.subscription_expired;
      }
      if (msg.includes('suspended')) {
        return ERROR_MESSAGES.tenant_suspended;
      }
      if (msg.includes('permission') || msg.includes('denied')) {
        return ERROR_MESSAGES.PGRST301;
      }
      if (msg.includes('network') || msg.includes('fetch')) {
        return ERROR_MESSAGES.network_error;
      }
      if (msg.includes('timeout')) {
        return ERROR_MESSAGES.timeout;
      }
      
      // Return sanitized message (avoid exposing internal details)
      if (!msg.includes('error') && msg.length < 100) {
        return err.message;
      }
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      return ERROR_MESSAGES.network_error;
    }
  }

  return ERROR_MESSAGES.default;
}

export function useApiErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, context?: string) => {
    const message = getErrorMessage(error);
    
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);

    toast({
      title: 'Error',
      description: message,
      variant: 'destructive'
    });

    return message;
  }, [toast]);

  const handleSuccess = useCallback((message: string, title?: string) => {
    toast({
      title: title || 'Success',
      description: message
    });
  }, [toast]);

  return { handleError, handleSuccess };
}

// Type-safe wrapper for async operations with error handling
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  return operation().catch((error) => {
    console.error('Operation failed:', error);
    onError?.(error);
    return null;
  });
}
