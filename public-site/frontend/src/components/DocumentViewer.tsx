import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Download,
  Visibility,
  OpenInNew as OpenIcon
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));

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
    <Box sx={{ mt: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" gutterBottom>
        Project Document
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: { xs: 2, sm: 3 },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 1.5, md: 2 }, 
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        {isMobile ? (
          // Mobile: Compact buttons
          <>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Visibility />}
              onClick={handleView}
              disabled={loading}
              fullWidth
              size={isExtraSmall ? "medium" : "large"}
              sx={{
                bgcolor: '#0a4f3c',
                py: { xs: 1, sm: 1.25 },
                borderRadius: { xs: 2, sm: 3 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                '&:hover': { bgcolor: '#063d2f' },
                '&:disabled': {
                  bgcolor: '#0a4f3c',
                  opacity: 0.7
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              {loading ? 'Loading...' : isExtraSmall ? 'View' : 'View Document'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} /> : <Download />}
              onClick={handleDownload}
              disabled={loading}
              fullWidth
              size={isExtraSmall ? "medium" : "large"}
              sx={{
                borderColor: '#0a4f3c',
                color: '#0a4f3c',
                py: { xs: 1, sm: 1.25 },
                borderRadius: { xs: 2, sm: 3 },
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                borderWidth: { xs: 1.5, sm: 2 },
                '&:hover': {
                  borderColor: '#063d2f',
                  bgcolor: 'rgba(10, 79, 60, 0.04)',
                  borderWidth: { xs: 1.5, sm: 2 }
                },
                '&:disabled': {
                  borderColor: '#0a4f3c',
                  color: '#0a4f3c',
                  opacity: 0.7
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              {loading ? 'Loading...' : isExtraSmall ? 'Download' : 'Download Document'}
            </Button>
          </>
        ) : (
          // Desktop: Regular buttons
          <>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Visibility />}
              onClick={handleView}
              disabled={loading}
              sx={{
                bgcolor: '#0a4f3c',
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
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
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#063d2f',
                  bgcolor: 'rgba(10, 79, 60, 0.04)',
                  borderWidth: 2
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
          </>
        )}
      </Box>
      
      {documentFilename && (
        <Typography variant="caption" color="text.secondary" sx={{ 
          mt: 1, 
          display: 'block',
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          wordBreak: 'break-word'
        }}>
          Filename: {documentFilename}
        </Typography>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <Typography variant="caption" color="text.secondary" sx={{ 
          mt: 1, 
          display: 'block',
          fontSize: { xs: '0.65rem', sm: '0.7rem' }
        }}>
        Project Slug: {projectSlug} {/* Debug info */}
        </Typography>
      )}
    </Box>
  );
};

export default DocumentViewer;
