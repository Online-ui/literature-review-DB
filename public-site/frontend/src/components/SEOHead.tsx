import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  url?: string;
  image?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonicalUrl?: string;  // Add this prop
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Literature Review Database',
  description = 'Discover and explore thousands of academic research projects, theses, and literature reviews from universities worldwide. Free access to scholarly work.',
  keywords = 'literature review, academic research, thesis, dissertation, research papers, university projects, scholarly articles, academic database',
  author = 'Literature Review Database',
  url = typeof window !== 'undefined' ? window.location.href : '',
  image = typeof window !== 'undefined' ? `${window.location.origin}/logo512.png` : '/logo512.png',
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  canonicalUrl  // Add this parameter
}) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title === 'Literature Review Database' 
      ? 'Literature Review Database - Academic Research Repository' 
      : `${title} | Literature Review Database`;
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property = false) => {
      if (!content) return;
      
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property) {
          metaTag.setAttribute('property', name);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    };

    // Basic SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('googlebot', 'index, follow');
    
    // Academic-specific meta tags
    updateMetaTag('citation_title', title);
    updateMetaTag('citation_author', author);
    if (publishedTime) {
      updateMetaTag('citation_publication_date', publishedTime);
    }

    // Open Graph meta tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', 'Literature Review Database', true);
    updateMetaTag('og:locale', 'en_US', true);
    
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }
    if (section) {
      updateMetaTag('article:section', section, true);
    }
    
    // Remove existing tag metas before adding new ones
    const existingTagMetas = document.querySelectorAll('meta[property="article:tag"]');
    existingTagMetas.forEach(meta => meta.remove());
    
    // Add tags
    tags.forEach(tag => {
      const tagMeta = document.createElement('meta');
      tagMeta.setAttribute('property', 'article:tag');
      tagMeta.setAttribute('content', tag);
      document.head.appendChild(tagMeta);
    });

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Update canonical link
    const canonicalHref = canonicalUrl || url;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalHref);

    // Add hreflang for international SEO
    let hrefLangLink = document.querySelector('link[rel="alternate"][hreflang="en"]') as HTMLLinkElement;
    if (!hrefLangLink) {
      hrefLangLink = document.createElement('link');
      hrefLangLink.setAttribute('rel', 'alternate');
      hrefLangLink.setAttribute('hreflang', 'en');
      document.head.appendChild(hrefLangLink);
    }
    hrefLangLink.setAttribute('href', canonicalHref);

  }, [title, description, keywords, author, url, image, type, publishedTime, modifiedTime, section, tags, canonicalUrl]);

  return null;
};

export default SEOHead;