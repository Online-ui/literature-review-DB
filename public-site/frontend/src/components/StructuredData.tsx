import React, { useEffect } from 'react';

// Define a more flexible interface that doesn't require all Project fields
interface StructuredDataProject {
  id: number;
  title: string;
  slug: string;
  abstract?: string;
  keywords?: string;
  research_area?: string;
  degree_type?: string;
  academic_year?: string;
  institution?: string;
  department?: string;
  supervisor?: string;
  author_name: string;
  author_email?: string;
  publication_date: string;
  created_at: string;
  document_filename?: string;
  document_content_type?: string;
  is_published?: boolean; // Make it optional
}

interface StructuredDataProps {
  project: StructuredDataProject;
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
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

    const baseUrl = window.location.origin;
    const currentUrl = window.location.href;
    
    // Main structured data for the project
    const structuredData: SchemaArticle = {
      "@context": "https://schema.org",
      "@type": type === 'thesis' ? "Thesis" : "ScholarlyArticle",
      "headline": project.title,
      "name": project.title,
      "description": project.abstract || `Academic research project: ${project.title}`,
      "keywords": project.keywords || project.research_area || undefined,
      "author": {
        "@type": "Person",
        "name": project.author_name,
        ...(project.author_email && { "email": project.author_email })
      },
      "creator": {
        "@type": "Person", 
        "name": project.author_name,
        ...(project.author_email && { "email": project.author_email })
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
      ...(project.degree_type && { "educationalLevel": project.degree_type }),
      "url": currentUrl,
      "identifier": {
        "@type": "PropertyValue",
        "name": "Project ID",
        "value": project.id.toString()
      },
      "isAccessibleForFree": true,
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      }
    };

    // Add document encoding if available
    if (project.document_filename) {
      structuredData.encoding = {
        "@type": "MediaObject",
        "contentUrl": `${baseUrl}/api/projects/${project.slug}/download`,
        "encodingFormat": project.document_content_type || "application/pdf",
        "name": project.document_filename
      };
    }

    // Add thesis-specific fields
    if (type === 'thesis') {
      if (project.institution) {
        structuredData.degreeGrantor = {
          "@type": "Organization",
          "name": project.institution
        };
      }
      
      if (project.supervisor) {
        structuredData.advisor = {
          "@type": "Person",
          "name": project.supervisor
        };
      }
    }

    // Website structured data
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

    // Breadcrumb structured data
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
          "item": currentUrl
        }
      ]
    };

    // Combine all structured data
    const combinedData = {
      "@context": "https://schema.org",
      "@graph": [structuredData, websiteData, breadcrumbData]
    };

    // Create a unique ID for this script
    const scriptId = 'structured-data-script';

    // Remove existing structured data script with the same ID
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(combinedData, null, 2);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [project, type]);

  return null;
};

export default StructuredData;
