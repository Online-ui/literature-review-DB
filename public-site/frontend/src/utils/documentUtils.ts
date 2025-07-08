// src/utils/documentUtils.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const cleanBaseUrl = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL.slice(0, -4) 
  : API_BASE_URL.replace(/\/$/, '');

export const documentUtils = {
  viewDocument: (projectSlug: string) => {
    const viewUrl = `${cleanBaseUrl}/api/projects/${projectSlug}/view-document`;
    window.open(viewUrl, '_blank');
  },
  
  downloadDocument: (projectSlug: string) => {
    const downloadUrl = `${cleanBaseUrl}/api/projects/${projectSlug}/download`;
    // Use a link element for better download handling
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  getFileInfoUrl: (projectSlug: string) => {
    return `${cleanBaseUrl}/api/projects/${projectSlug}/file-info`;
  }
};
