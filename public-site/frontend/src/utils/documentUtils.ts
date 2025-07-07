// src/utils/documentUtils.ts
export const documentUtils = {
  viewDocument: (projectSlug: string) => {
    const viewUrl = `/api/projects/${projectSlug}/view-document`;
    window.open(viewUrl, '_blank');
  },
  
  downloadDocument: (projectSlug: string) => {
    const downloadUrl = `/api/projects/${projectSlug}/download`;
    window.location.href = downloadUrl;
  },

  getFileInfoUrl: (projectSlug: string) => {
    return `/api/projects/${projectSlug}/file-info`;
  }
};
