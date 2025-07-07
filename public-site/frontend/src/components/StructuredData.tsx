import React, { useEffect } from 'react';
import { Project } from '../services/api';

interface StructuredDataProps {
  project: Project;
  type?: 'article' | 'dataset' | 'thesis';
}

// Define interfaces for structured data
interface SchemaOrganization {
  "@type": "Organization";
  name: string;
  url?: string;
}

interface SchemaPerson {
  "@type": "Person";
  name: string;
  email?: string;
}

interface SchemaMediaObject {
  "@type": "MediaObject";
  contentUrl: string;
  encodingFormat: string;
  name: string;
}

interface SchemaArticle {
  "@context": string;
  "@type": "ScholarlyArticle" | "Thesis";
  headline: string;
  name: string;
  description: string;
  keywords?: string;
  author: SchemaPerson;
  creator: SchemaPerson;
  publisher: SchemaOrganization;
  provider: SchemaOrganization;
  datePublished: string;
  dateCreated: string;
  inLanguage: string;
  about: {
    "@type": "Thing";
    name: string;
  };
  educationalLevel?: string;
  url: string;
  identifier: {
    "@type": "PropertyValue";
    name: string;
    value: string;
  };
  isAccessibleForFree: boolean;
  license: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  encoding?: SchemaMediaObject;
  degreeGrantor?: SchemaOrganization;
  advisor?: SchemaPerson;
}

const StructuredData: React.FC<StructuredDataProps> = ({ project, type = 'article' }) => {
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Main structured data for the project
    const structuredData: SchemaArticle = {
      "@context": "https://schema.org",
      "@type": type === 'thesis' ? "Thesis" : "ScholarlyArticle",
      "headline": project.title,
      "name": project.title,
      "description": project.abstract || `Academic research project: ${project.title}`,
      "keywords": project.keywords || project.research_area,
      "author": {
        "@type": "Person",
        "name": project.author_name,
        ...(project.author_email && { "email": project.author_email })
      },
      "creator": {
        "@type": "Person", 
        "name": project.author_name
      },
      "publisher": {
        "@type": "Organization",
        "name": project.institution || "Academic Institution",
        "url": baseUrl
      },
      "provider": {
        "@type": "Organization",
        "name": "Literature Review Database",
        "url": baseUrl
      },
      "datePublished": project.publication_date,
      "dateCreated": project.created_at,
      "inLanguage": "en",
      "about": {
        "@type": "Thing",
        "name": project.research_area || "Academic Research"
      },
      "educationalLevel": project.degree_type,
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "identifier": {
        "@type": "PropertyValue",
        "name": "Project ID",
        "value": project.id.toString()
      },
      "isAccessibleForFree": true,
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": typeof window !== 'undefined' ? window.location.href : ''
      }
    };

    // Add document download info if available
    if (project.document_filename) {
      structuredData.encoding = {
        "@type": "MediaObject",
        "contentUrl": `${baseUrl}/api/projects/${project.slug}/download`,
        "encodingFormat": project.document_content_type || "application/pdf",
        "contentSize": project.document_size ? `${project.document_size} bytes` : undefined,
        "name": project.document_filename
      };
    }
    // Add thesis-specific fields
    if (type === 'thesis') {
      structuredData.degreeGrantor = {
        "@type": "Organization",
        "name": project.institution || "Academic Institution"
      };
      
      if (project.supervisor) {
        structuredData.advisor = {
          "@type": "Person",
          "name": project.supervisor
        };
      }
    }

    // Rest of the component remains the same...
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Literature Review Database",
      "url": baseUrl,
      "description": "A comprehensive database of academic research projects and literature reviews",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/projects?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem", 
          "position": 2,
          "name": "Projects",
          "item": `${baseUrl}/projects`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": project.title,
          "item": typeof window !== 'undefined' ? window.location.href : ''
        }
      ]
    };

    const combinedData = {
      "@context": "https://schema.org",
      "@graph": [structuredData, websiteData, breadcrumbData]
    };

    // Remove existing structured data script
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(combinedData, null, 2);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [project, type]);

  return null;
};

export default StructuredData;
