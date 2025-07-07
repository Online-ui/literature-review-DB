import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import {
  Download,
  Visibility,
} from '@mui/icons-material';
import { documentUtils } from '../utils/documentUtils';

interface DocumentViewerProps {
  projectSlug: string;
  documentFilename?: string;
  hasDocument?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  projectSlug,
  documentFilename,
  hasDocument = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleView = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First check if document exists
      const response = await fetch(documentUtils.getFileInfoUrl(projectSlug));
      if (!response.ok) {
        throw new Error(`Document not found (${response.status})`);
      }
      
      const fileInfo = await response.json();
      if (!fileInfo.available) {
        throw new Error('No document available for this project');
      }
      
      // If document exists, open it
      documentUtils.viewDocument(projectSlug);
      
    } catch (err: any) {
      console.error('View document error:', err);
      setError(err.message || 'Failed to view document');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First check if document exists
      const response = await fetch(documentUtils.getFileInfoUrl(projectSlug));
      if (!response.ok) {
        throw new Error(`Document not found (${response.status})`);
      }
      
      const fileInfo = await response.json();
      if (!fileInfo.available) {
        throw new Error('No document available for download');
      }
      
      // If document exists, download it
      documentUtils.downloadDocument(projectSlug);
      
    } catch (err: any) {
      console.error('Download document error:', err);
      setError(err.message || 'Failed to download document');
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

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
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Project Slug: {projectSlug} {/* Debug info */}
      </Typography>
    </Box>
  );
};

export default DocumentViewer;
