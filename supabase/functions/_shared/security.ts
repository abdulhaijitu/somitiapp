// Shared security utilities for Edge Functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting using in-memory store (per function instance)
// For production, consider using Redis or Supabase
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 60000, maxRequests: 5 },     // 5 per minute
  otp: { windowMs: 60000, maxRequests: 3 },        // 3 per minute
  payment: { windowMs: 60000, maxRequests: 10 },   // 10 per minute
  api: { windowMs: 60000, maxRequests: 100 },      // 100 per minute
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

export function checkRateLimit(
  key: string, 
  type: keyof typeof RATE_LIMITS = 'api'
): RateLimitResult {
  const config = RATE_LIMITS[type];
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: entry.resetAt - now 
    };
  }

  entry.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - entry.count, 
    resetIn: entry.resetAt - now 
  };
}

export function rateLimitResponse(resetIn: number): Response {
  const retryAfter = Math.ceil(resetIn / 1000);
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      retryAfter 
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      } 
    }
  );
}

// Authentication context
export interface AuthContext {
  userId: string;
  email?: string;
  tenantId?: string;
  roles: string[];
  isSuperAdmin: boolean;
}

export interface SecurityCheckResult {
  success: boolean;
  error?: string;
  status?: number;
  context?: AuthContext;
  supabase?: SupabaseClient;
}

/**
 * Comprehensive security check for Edge Functions
 * - Validates auth token
 * - Resolves user's tenant (server-side only - never trust client)
 * - Checks roles and permissions
 * - Validates tenant status and subscription
 */
export async function performSecurityCheck(
  req: Request,
  options: {
    requireAuth?: boolean;
    requireTenant?: boolean;
    allowedRoles?: string[];
    checkSubscription?: boolean;
    rateLimitType?: keyof typeof RATE_LIMITS;
  } = {}
): Promise<SecurityCheckResult> {
  const {
    requireAuth = true,
    requireTenant = true,
    allowedRoles,
    checkSubscription = true,
    rateLimitType = 'api'
  } = options;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Get client IP for rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // Rate limit check
  const rateLimit = checkRateLimit(`${clientIp}:${rateLimitType}`, rateLimitType);
  if (!rateLimit.allowed) {
    return { 
      success: false, 
      error: 'Too many requests. Please try again later.', 
      status: 429 
    };
  }

  // Check authorization header
  const authHeader = req.headers.get('Authorization');
  
  if (requireAuth) {
    if (!authHeader?.startsWith('Bearer ')) {
      return { success: false, error: 'Authorization required', status: 401 };
    }
  } else if (!authHeader) {
    // No auth required and no header - return minimal context
    return { 
      success: true, 
      context: { userId: '', roles: [], isSuperAdmin: false },
      supabase: createClient(supabaseUrl, supabaseServiceKey)
    };
  }

  // Validate token
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader! } }
  });

  const token = authHeader!.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return { success: false, error: 'Invalid or expired token', status: 401 };
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string;
  
  // Create service client for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user's roles and tenant - SERVER-SIDE RESOLUTION ONLY
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role, tenant_id')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    return { success: false, error: 'Failed to verify permissions', status: 500 };
  }

  const roles = (userRoles || []).map(r => r.role);
  const isSuperAdmin = roles.includes('super_admin');
  
  // Determine tenant from user roles (server-side only - never from client)
  const tenantRoles = userRoles?.filter(r => r.tenant_id) || [];
  const tenantId = tenantRoles.length > 0 ? tenantRoles[0].tenant_id : undefined;

  // Build auth context
  const context: AuthContext = {
    userId,
    email,
    tenantId,
    roles,
    isSuperAdmin
  };

  // Check tenant requirement
  if (requireTenant && !tenantId && !isSuperAdmin) {
    return { 
      success: false, 
      error: 'Access denied. No tenant association found.', 
      status: 403 
    };
  }

  // Check role requirements
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = isSuperAdmin || roles.some(r => allowedRoles.includes(r));
    if (!hasRequiredRole) {
      return { 
        success: false, 
        error: 'Insufficient permissions for this action', 
        status: 403 
      };
    }
  }

  // Validate tenant subscription
  if (checkSubscription && tenantId) {
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_tenant_subscription', { _tenant_id: tenantId });

    if (validationError) {
      console.error('Tenant validation error:', validationError);
      return { success: false, error: 'Failed to validate tenant status', status: 500 };
    }

    if (!validationResult?.valid) {
      return { 
        success: false, 
        error: validationResult?.error || 'Your subscription has expired or tenant is inactive', 
        status: 403 
      };
    }
  }

  return { success: true, context, supabase };
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string, 
  status: number = 400,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      ...details
    }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Create a standardized success response
 */
export function successResponse(
  data: Record<string, unknown>,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Log security event for audit trail
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  event: {
    action: string;
    entity_type: string;
    entity_id?: string;
    user_id?: string;
    details?: Record<string, unknown>;
    ip_address?: string;
  }
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      user_id: event.user_id,
      details: event.details,
      ip_address: event.ip_address
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging failure shouldn't break main flow
  }
}

/**
 * Generate idempotency key for operations
 */
export function generateIdempotencyKey(
  operation: string, 
  ...params: (string | number)[]
): string {
  const data = [operation, ...params].join(':');
  // Simple hash for idempotency
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `idem:${operation}:${Math.abs(hash).toString(36)}`;
}

/**
 * Check idempotency to prevent duplicate operations
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  key: string,
  expiresInSeconds: number = 3600
): Promise<{ isDuplicate: boolean; existingResult?: unknown }> {
  // Store idempotency in a simple way using payment_logs or a dedicated table
  // For now, return false to allow operation
  // In production, implement with Redis or a dedicated idempotency table
  return { isDuplicate: false };
}
