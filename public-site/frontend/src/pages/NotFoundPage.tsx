import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <SEOHead
        title="Page Not Found - 404 Error"
        description="The page you're looking for doesn't exist. Browse our research database or search for academic projects."
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      
      <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h4" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go Home
        </Button>
        <Button variant="outlined" onClick={() => navigate('/projects')}>
          Browse Projects
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;