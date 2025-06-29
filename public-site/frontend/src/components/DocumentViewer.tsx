import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  documentUrl: string;
  filename?: string;
  projectSlug: string;
  onDownload: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  open,
  onClose,
  documentUrl,
  filename,
  projectSlug,
  onDownload
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(100);

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
    window.open(documentUrl, '_blank');
  };

  const isPDF = filename?.toLowerCase().endsWith('.pdf') || documentUrl.includes('.pdf');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            {filename || 'Document Viewer'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isPDF && (
              <>
                <IconButton onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOutIcon />
                </IconButton>
                                <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
                  {zoom}%
                </Typography>
                <IconButton onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomInIcon />
                </IconButton>
              </>
            )}
            <IconButton onClick={handleFullscreen} title="Open in new tab">
              <FullscreenIcon />
            </IconButton>
            <IconButton onClick={onDownload} title="Download">
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px' 
          }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading document...</Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={onDownload} startIcon={<DownloadIcon />}>
              Download Document Instead
            </Button>
          </Box>
        )}
        
        {!error && (
          <Box sx={{ 
            height: '100%', 
            display: loading ? 'none' : 'block',
            overflow: 'auto'
          }}>
            {isPDF ? (
              <iframe
                src={`${documentUrl}#zoom=${zoom}`}
                width="100%"
                height="600px"
                style={{ border: 'none' }}
                onLoad={handleLoad}
                onError={handleError}
                title="Document Viewer"
              />
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Preview not available for this file type. Please download to view.
                </Alert>
                <Button 
                  variant="contained" 
                  onClick={onDownload} 
                  startIcon={<DownloadIcon />}
                  size="large"
                >
                  Download {filename}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;