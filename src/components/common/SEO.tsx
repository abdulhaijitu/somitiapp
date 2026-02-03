import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  SEOProps, 
  getBrandConfig, 
  generatePageTitle, 
  getCanonicalUrl,
  shouldIndexRoute 
} from '@/lib/seo';

interface SEOComponentProps extends SEOProps {
  lang?: 'en' | 'bn';
}

/**
 * SEO Component for managing page metadata
 * Handles title, meta tags, Open Graph, Twitter Cards, and structured data
 */
export function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex,
  noFollow,
  structuredData,
  lang = 'en'
}: SEOComponentProps) {
  const location = useLocation();
  const brand = getBrandConfig();
  
  // Determine indexing based on route if not explicitly set
  const shouldNotIndex = noIndex ?? !shouldIndexRoute(location.pathname);
  const shouldNotFollow = noFollow ?? shouldNotIndex;

  useEffect(() => {
    // Update document title
    const pageTitle = generatePageTitle(title, brand);
    document.title = pageTitle;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Set meta description
    if (description) {
      setMetaTag('description', description);
    }

    // Set meta keywords
    if (keywords && keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    // Set robots meta tag
    const robotsContent = [
      shouldNotIndex ? 'noindex' : 'index',
      shouldNotFollow ? 'nofollow' : 'follow'
    ].join(', ');
    setMetaTag('robots', robotsContent);

    // Set canonical URL
    const canonical = canonicalUrl || getCanonicalUrl(location.pathname, brand);
    setLinkTag('canonical', canonical);

    // Open Graph tags
    setMetaTag('og:title', ogTitle || pageTitle, true);
    setMetaTag('og:description', ogDescription || description || brand.description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:url', canonical, true);
    setMetaTag('og:site_name', brand.appName, true);
    
    // Open Graph image
    const ogImageUrl = ogImage || brand.ogImage;
    if (ogImageUrl) {
      const fullOgImage = ogImageUrl.startsWith('http') 
        ? ogImageUrl 
        : `https://${brand.domain}${ogImageUrl}`;
      setMetaTag('og:image', fullOgImage, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
    }

    // Twitter Card tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', ogTitle || pageTitle);
    setMetaTag('twitter:description', ogDescription || description || brand.description);
    
    if (brand.twitterHandle) {
      setMetaTag('twitter:site', brand.twitterHandle);
    }
    
    if (ogImageUrl) {
      const fullOgImage = ogImageUrl.startsWith('http') 
        ? ogImageUrl 
        : `https://${brand.domain}${ogImageUrl}`;
      setMetaTag('twitter:image', fullOgImage);
    }

    // Theme color
    setMetaTag('theme-color', brand.themeColor);

    // Structured data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function (optional - meta tags persist)
    return () => {
      // Remove structured data on unmount
      if (structuredData) {
        const script = document.querySelector('script[type="application/ld+json"]');
        if (script) {
          script.remove();
        }
      }
    };
  }, [
    title, 
    description, 
    keywords, 
    ogTitle, 
    ogDescription, 
    ogImage, 
    ogType, 
    twitterCard, 
    canonicalUrl, 
    shouldNotIndex, 
    shouldNotFollow, 
    structuredData, 
    location.pathname,
    brand
  ]);

  // This component doesn't render anything
  return null;
}

/**
 * NoIndex SEO component for private/dashboard pages
 * Simple component to mark pages as non-indexable
 */
export function NoIndexSEO({ title }: { title?: string }) {
  return (
    <SEO 
      title={title}
      noIndex={true}
      noFollow={true}
    />
  );
}

/**
 * Default structured data for the organization
 */
export function getOrganizationSchema() {
  const brand = getBrandConfig();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brand.appName,
    description: brand.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BDT'
    },
    publisher: {
      '@type': 'Organization',
      name: brand.appName,
      url: `https://${brand.domain}`
    }
  };
}
