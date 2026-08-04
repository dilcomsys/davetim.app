import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonical?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * SEO Head Component
 * 
 * Dynamically updates document head with SEO meta tags
 * Supports Open Graph, Twitter Cards, and Schema.org
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Davetim - Profesyonel Dijital Davetiye Oluşturucu',
  description = 'Özel günleriniz için profesyonel dijital davetiyeler oluşturun. Hazır şablonlar, kolay düzenleme, RSVP takibi. Ücretsiz deneyin!',
  keywords = 'dijital davetiye, online davetiye, davetiye tasarımı, düğün davetiyesi, nişan davetiyesi, doğum günü davetiyesi',
  image = 'https://davetim.app/og-image.jpg',
  url,
  canonical,
  type = 'website',
  author = 'Davetim',
  publishedTime,
  modifiedTime,
}) => {
  useEffect(() => {
    // Base title
    document.title = title;

    // Meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);

    // Open Graph
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', 'Davetim', 'property');
    updateMetaTag('og:locale', 'tr_TR', 'property');
    
    if (url) {
      updateMetaTag('og:url', url, 'property');
    }

    if (canonical) {
      updateCanonicalLink(canonical);
    }

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title, 'name');
    updateMetaTag('twitter:description', description, 'name');
    updateMetaTag('twitter:image', image, 'name');
    updateMetaTag('twitter:site', '@davetimapp', 'name');

    // Article specific
    if (type === 'article') {
      if (publishedTime) {
        updateMetaTag('article:published_time', publishedTime, 'property');
      }
      if (modifiedTime) {
        updateMetaTag('article:modified_time', modifiedTime, 'property');
      }
      updateMetaTag('article:author', author, 'property');
    }

    // Additional SEO tags
    updateMetaTag('robots', 'index, follow', 'name');
    updateMetaTag('googlebot', 'index, follow', 'name');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', 'name');
    updateMetaTag('theme-color', '#6366f1', 'name');

    // Mobile
    updateMetaTag('mobile-web-app-capable', 'yes', 'name');
    updateMetaTag('apple-mobile-web-app-capable', 'yes', 'name');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default', 'name');
    updateMetaTag('apple-mobile-web-app-title', 'Davetim', 'name');

    if (canonical) {
      updateCanonicalLink(canonical);
    }

  }, [title, description, keywords, image, url, canonical, type, author, publishedTime, modifiedTime]);

  return null; // This component doesn't render anything
};

/**
 * Helper function to update or create meta tags
 */
const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateCanonicalLink = (href: string) => {
  if (!href) return;

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.href = href;
};

/**
 * JSON-LD Schema Component
 */
interface SchemaData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

export const JSONLDSchema: React.FC<{ data: SchemaData }> = ({ data }) => {
  useEffect(() => {
    // Remove existing schema
    const existingSchema = document.querySelector('script[type="application/ld+json"]');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Add new schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);

  return null;
};

/**
 * Canonical URL Component
 */
export const CanonicalURL: React.FC<{ url: string }> = ({ url }) => {
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    
    link.href = url;

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [url]);

  return null;
};

/**
 * Preload/Prefetch Helper
 */
export const ResourceHints: React.FC = () => {
  useEffect(() => {
    // DNS Prefetch for external resources
    addLink('dns-prefetch', 'https://fonts.googleapis.com');
    addLink('dns-prefetch', 'https://fonts.gstatic.com');
    addLink('dns-prefetch', 'https://images.unsplash.com');

    // Preconnect to critical domains
    addLink('preconnect', 'https://fonts.googleapis.com', { crossOrigin: 'anonymous' });
    addLink('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });

  }, []);

  return null;
};

const addLink = (rel: string, href: string, attrs?: { crossOrigin?: string }) => {
  if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
    return; // Already exists
  }

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  
  if (attrs?.crossOrigin) {
    link.crossOrigin = attrs.crossOrigin;
  }
  
  document.head.appendChild(link);
};

export default SEOHead;

