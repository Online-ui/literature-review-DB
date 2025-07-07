import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider
} from '@mui/material';
import {
  Download,
  Visibility,
  Close as CloseIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// Simple inline document viewer
interface DocumentViewerProps {
  projectSlug: string;
  documentUrl?: string;
  documentFilename?: string;
  hasDocument?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  projectSlug,
  documentUrl,
  documentFilename,
  hasDocument = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use relative URLs since frontend and backend are on same domain
  const handleView = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Open in new tab for viewing - use relative URL
      const viewUrl = `/api/projects/${projectSlug}/view-document`;
      window.open(viewUrl, '_blank');
      
    } catch (err: any) {
      setError(err.message || 'Failed to view document');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create download link - use relative URL
      const downloadUrl = `/api/projects/${projectSlug}/download`;
      
      // Direct navigation for download
      window.location.href = downloadUrl;
      
    } catch (err: any) {
      setError(err.message || 'Failed to download document');
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  // Always show the component - let the backend handle if document exists
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Project Document
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Visibility />}
          onClick={handleView}
          disabled={loading}
          sx={{
            bgcolor: '#0a4f3c',
            '&:hover': { bgcolor: '#063d2f' },
            '&:disabled': {
              bgcolor: '#0a4f3c',
              opacity: 0.7
            }
          }}
        >
          {loading ? 'Loading...' : 'View Document'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
          onClick={handleDownload}
          disabled={loading}
          sx={{
            borderColor: '#0a4f3c',
            color: '#0a4f3c',
            '&:hover': {
              borderColor: '#063d2f',
              bgcolor: 'rgba(10, 79, 60, 0.04)'
            },
            '&:disabled': {
              borderColor: '#0a4f3c',
              color: '#0a4f3c',
              opacity: 0.7
            }
          }}
        >
          {loading ? 'Loading...' : 'Download Document'}
        </Button>
      </Box>
      
      {documentFilename && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Filename: {documentFilename}
        </Typography>
      )}
      
      {!documentFilename && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Click the buttons above to check if a document is available for this project.
        </Typography>
      )}
    </Box>
  );
};

// Modal document viewer with advanced features
interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  projectSlug: string;
  documentFilename?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  open,
  onClose,
  projectSlug,
  documentFilename
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(100);
  const [fileInfo, setFileInfo] = useState<any>(null);

  // Use relative URLs
  const viewUrl = `/api/projects/${projectSlug}/view-document`;
  const downloadUrl = `/api/projects/${projectSlug}/download`;

  // Fetch file info when modal opens
  React.useEffect(() => {
    if (open) {
      setLoading(true);
      setError('');
      setZoom(100);
      
      fetch(`/api/projects/${projectSlug}/file-info`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Document not found');
          }
          return response.json();
        })
        .then(data => {
          setFileInfo(data);
          if (!data.available) {
            throw new Error('No document available for this project');
          }
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load document information');
          setLoading(false);
        });
    }
  }, [open, projectSlug]);

  const handleLoad = () => {
    setLoading(false);
    setError('');
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load document. The document might be corrupted or in an unsupported format.');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleFullscreen = () => {
    window.open(viewUrl, '_blank');
  };

  const handleDownload = () => {
    window.location.href = downloadUrl;
  };

  const isPDF = (fileInfo?.filename || documentFilename || '').toLowerCase().includes('.pdf');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          maxHeight: '900px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="div">
              Document Viewer
            </Typography>
            {(fileInfo?.filename || documentFilename) && (
              <Typography variant="caption" color="text.secondary">
                {fileInfo?.filename || documentFilename}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPDF && !loading && !error && fileInfo?.available && (
              <>
                <IconButton 
                  onClick={handleZoomOut} 
                  disabled={zoom <= 50}
                  size="small"
                  title="Zoom out"
                >
                  <ZoomOutIcon />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                  {zoom}%
                </Typography>
                <IconButton 
                  onClick={handleZoomIn} 
                  disabled={zoom >= 200}
                  size="small"
                  title="Zoom in"
                >
                  <ZoomInIcon />
                </IconButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              </>
            )}
            <IconButton onClick={handleFullscreen} size="small" title="Open in new tab">
              <FullscreenIcon />
            </IconButton>
            <IconButton onClick={handleDownload} size="small" title="Download">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#f5f5f5' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            minHeight: '400px'
          }}>
            <CircularProgress size={48} sx={{ color: '#0a4f3c' }} />
            <Typography sx={{ mt: 2 }}>Loading document...</Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {error}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                onClick={handleDownload} 
                startIcon={<DownloadIcon />}
                sx={{
                  bgcolor: '#0a4f3c',
                  '&:hover': { bgcolor: '#063d2f' }
                }}
              >
                Download Document
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleFullscreen} 
                startIcon={<VisibilityIcon />}
                sx={{
                  borderColor: '#0a4f3c',
                  color: '#0a4f3c',
                  '&:hover': {
                    borderColor: '#063d2f',
                    bgcolor: 'rgba(10, 79, 60, 0.04)'
                  }
                }}
              >
                Open in New Tab
              </Button>
            </Box>
          </Box>
        )}
        
        {!error && !loading && fileInfo?.available && (
          <Box sx={{ 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'white'
          }}>
            {isPDF ? (
              <iframe
                src={`${viewUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom}`}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none',
                  flexGrow: 1
                }}
                onLoad={handleLoad}
                onError={handleError}
                title="PDF Document Viewer"
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                  Preview is only available for PDF files. This document appears to be in a different format.
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleDownload} 
                    startIcon={<DownloadIcon />}
                    size="large"
                    sx={{
                      bgcolor: '#0a4f3c',
                      '&:hover': { bgcolor: '#063d2f' }
                    }}
                  >
                    Download {fileInfo?.filename || documentFilename || 'Document'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleFullscreen} 
                    startIcon={<VisibilityIcon />}
                    size="large"
                    sx={{
                      borderColor: '#0a4f3c',
                      color: '#0a4f3c',
                      '&:hover': {
                        borderColor: '#063d2f',
                        bgcolor: 'rgba(10, 79, 60, 0.04)'
                      }
                    }}
                  >
                    Open in Browser
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Default export for backward compatibility
export default DocumentViewer;
