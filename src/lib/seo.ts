/**
 * SEO Configuration & Utilities
 * Centralized branding and SEO metadata management for white-label support
 */

export interface BrandConfig {
  appName: string;
  appNameBn: string;
  tagline: string;
  taglineBn: string;
  description: string;
  descriptionBn: string;
  domain: string;
  logo: string;
  favicon: string;
  ogImage: string;
  twitterHandle?: string;
  themeColor: string;
  keywords: string[];
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  structuredData?: object;
}

/**
 * Default brand configuration
 * This can be extended to support tenant-level branding in the future
 */
export const defaultBrandConfig: BrandConfig = {
  appName: 'Somiti',
  appNameBn: 'সমিতি',
  tagline: 'Association Management Platform',
  taglineBn: 'সমিতি ব্যবস্থাপনা প্ল্যাটফর্ম',
  description: 'Modern SaaS platform for managing somitis and associations in Bangladesh. Member management, payment tracking, and financial reports all in one place.',
  descriptionBn: 'বাংলাদেশে সমিতি ও সংগঠন পরিচালনার জন্য আধুনিক SaaS প্ল্যাটফর্ম। সদস্য ব্যবস্থাপনা, পেমেন্ট ট্র্যাকিং এবং আর্থিক রিপোর্ট এক জায়গায়।',
  domain: 'somitiapp.com',
  logo: '/logo.svg',
  favicon: '/favicon.ico',
  ogImage: '/og-image.png',
  twitterHandle: '@somitiapp',
  themeColor: '#0ea5e9',
  keywords: [
    'somiti',
    'association management',
    'Bangladesh',
    'member management',
    'payment tracking',
    'সমিতি',
    'সংগঠন',
    'বাংলাদেশ'
  ]
};

/**
 * Get the current brand configuration
 * Future: This can be extended to fetch tenant-specific branding
 */
export function getBrandConfig(tenantId?: string): BrandConfig {
  // Future: Fetch tenant-specific branding from database
  // For now, return default configuration
  return defaultBrandConfig;
}

/**
 * Generate page title with brand suffix
 */
export function generatePageTitle(pageTitle?: string, brand?: BrandConfig): string {
  const config = brand || defaultBrandConfig;
  if (!pageTitle) {
    return `${config.appName} - ${config.tagline}`;
  }
  return `${pageTitle} | ${config.appName}`;
}

/**
 * Get canonical URL for a path
 */
export function getCanonicalUrl(path: string, brand?: BrandConfig): string {
  const config = brand || defaultBrandConfig;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${config.domain}${cleanPath}`;
}

/**
 * SEO page configurations for public pages
 */
export const pageConfigs: Record<string, SEOProps> = {
  home: {
    title: undefined, // Uses default brand title
    description: defaultBrandConfig.description,
    keywords: defaultBrandConfig.keywords,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  },
  pricing: {
    title: 'Pricing',
    description: 'Simple, transparent pricing for somiti management. Choose a plan that fits your organization\'s needs. Start free, upgrade anytime.',
    keywords: ['somiti pricing', 'association management cost', 'bangladesh saas pricing', 'সমিতি মূল্য'],
    noIndex: false,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  },
  about: {
    title: 'About Us',
    description: 'Learn about our mission to digitize and empower somitis across Bangladesh. Built with trust, transparency, and community at heart.',
    keywords: ['about somiti app', 'bangladesh fintech', 'association management', 'সমিতি সম্পর্কে'],
    noIndex: false,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with us for demos, support, or any questions about Somiti management. We\'re here to help your organization thrive.',
    keywords: ['contact somiti', 'somiti support', 'bangladesh association help', 'সমিতি যোগাযোগ'],
    noIndex: false,
    ogType: 'website',
    twitterCard: 'summary',
  },
  login: {
    title: 'Admin Login',
    description: 'Sign in to your organization dashboard. Manage members, track payments, and generate reports.',
    noIndex: false,
    ogType: 'website',
    twitterCard: 'summary',
  },
  memberLogin: {
    title: 'Member Portal',
    description: 'Access your member dashboard. View dues, make payments, and stay updated with your somiti.',
    noIndex: false,
    ogType: 'website',
    twitterCard: 'summary',
  },
  forgotPassword: {
    title: 'Reset Password',
    description: 'Reset your account password. We will send you a secure link to create a new password.',
    noIndex: true,
    ogType: 'website',
    twitterCard: 'summary',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how we collect, use, and protect your personal information. Your privacy matters to us.',
    noIndex: false,
    ogType: 'article',
    twitterCard: 'summary',
  },
  terms: {
    title: 'Terms of Service',
    description: 'Read our terms and conditions for using the platform. Understanding your rights and responsibilities.',
    noIndex: false,
    ogType: 'article',
    twitterCard: 'summary',
  },
  dashboard: {
    title: 'Dashboard',
    noIndex: true,
    noFollow: true,
  },
  superAdmin: {
    title: 'Super Admin',
    noIndex: true,
    noFollow: true,
  },
  member: {
    title: 'Member Dashboard',
    noIndex: true,
    noFollow: true,
  },
};

/**
 * Check if a route should be indexed
 */
export function shouldIndexRoute(pathname: string): boolean {
  // Private routes that should never be indexed
  const privatePatterns = [
    '/dashboard',
    '/super-admin',
    '/member',
    '/admin',
    '/settings',
    '/reset-password',
  ];
  
  return !privatePatterns.some(pattern => 
    pathname.startsWith(pattern) || pathname === pattern
  );
}
