import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  LocalHospital as HealthIcon,
  Science as ResearchIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { apiService, Project } from '../services/api';
import DocumentViewer from '../components/DocumentViewer';
import SEOHead from '../components/SEOHead';
import StructuredData from '../components/StructuredData';

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProject(slug);
    }
  }, [slug]);

  const loadProject = async (projectSlug: string) => {
    try {
      const data = await apiService.getProjectBySlug(projectSlug);
      if (data) {
        setProject(data);
      } else {
        setError('Research project not found');
      }
    } catch (err) {
      setError('Failed to load research project');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!project?.slug) return;
    
    setDownloading(true);
    try {
      await apiService.downloadProject(project.slug);
    } catch (err) {
      setError('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewDocument = () => {
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SEOHead title="Loading Research Project..." />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 400,
          flexDirection: 'column',
          gap: 2
        }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: '#1b5e20',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Typography variant="h6" sx={{ color: '#2e7d32' }}>
            Loading Research Project...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SEOHead 
          title="Research Project Not Found - School of Public Health"
          description="The requested research project could not be found in our public health database."
        />
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '2px solid #d32f2f',
            '& .MuiAlert-icon': {
              color: '#d32f2f'
            }
          }}
        >
          {error || 'Research project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="contained"
          sx={{
            bgcolor: '#1b5e20',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(27, 94, 32, 0.3)',
            '&:hover': {
              bgcolor: '#0d4715',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(27, 94, 32, 0.4)'
            }
          }}
        >
          Back to Research Projects
        </Button>
      </Container>
    );
  }

  // Generate SEO-friendly description
  const seoDescription = project.abstract 
    ? `${project.abstract.substring(0, 155)}...`
    : `Public health research project by ${project.author_name} from ${project.institution}. ${project.research_area ? `Research area: ${project.research_area}.` : ''} ${project.degree_type ? `Degree type: ${project.degree_type}.` : ''}`;

  const keywords = [
    'public health research',
    project.research_area,
    project.degree_type,
    project.institution,
    project.author_name,
    'health equity',
    'population health',
    ...(project.keywords ? project.keywords.split(',').map(k => k.trim()) : [])
  ].filter(Boolean).join(', ');

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* SEO Components */}
        <SEOHead
          title={`${project.title} - School of Public Health Research`}
          description={seoDescription}
          keywords={keywords}
          author={project.author_name}
          url={typeof window !== 'undefined' ? window.location.href : ''}
          type="article"
          publishedTime={project.publication_date}
          modifiedTime={project.updated_at || project.created_at}
          section={project.research_area}
          tags={project.keywords ? project.keywords.split(',').map(k => k.trim()) : []}
          canonicalUrl={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <StructuredData 
          project={project} 
          type={project.degree_type?.toLowerCase().includes('phd') ? 'thesis' : 'article'} 
        />

        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="outlined"
          sx={{ 
            mb: 4,
            borderColor: '#1b5e20',
            color: '#1b5e20',
            px: 3,
            py: 1,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderColor: '#0d4715',
              bgcolor: '#e8f5e9',
              borderWidth: 2,
              transform: 'translateY(-1px)'
            }
          }}
        >
          Back to Research Projects
        </Button>

        {/* Project Header */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          border: '2px solid #c8e6c9',
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)',
          boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: '#1b5e20',
                width: 60,
                height: 60,
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.3)'
              }}
            >
              <ResearchIcon sx={{ fontSize: 30, color: 'white' }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom
                sx={{ 
                  color: '#1b5e20',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(27, 94, 32, 0.1)'
                }}
              >
                {project.title}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                {project.research_area && (
                  <Chip 
                    icon={<HealthIcon />}
                    label={project.research_area} 
                    sx={{
                      bgcolor: '#1b5e20',
                      color: 'white',
                      fontWeight: 'bold',
                      '& .MuiChip-icon': { color: 'white' },
                      boxShadow: '0 2px 8px rgba(27, 94, 32, 0.3)'
                    }}
                  />
                )}
                {project.degree_type && (
                  <Chip 
                    icon={<SchoolIcon />}
                    label={project.degree_type} 
                    sx={{
                      bgcolor: '#2e7d32',
                      color: 'white',
                      fontWeight: 'bold',
                      '& .MuiChip-icon': { color: 'white' },
                      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.3)'
                    }}
                  />
                )}
                {project.academic_year && (
                  <Chip 
                    icon={<CalendarIcon />}
                    label={project.academic_year} 
                    variant="outlined"
                    sx={{
                      borderColor: '#388e3c',
                      color: '#388e3c',
                      fontWeight: 'bold',
                      borderWidth: 2,
                      '& .MuiChip-icon': { color: '#388e3c' }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            {project.document_url && (
              <>
                <Button
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={handleViewDocument}
                  size="large"
                  sx={{
                    bgcolor: '#1b5e20',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 6px 20px rgba(27, 94, 32, 0.3)',
                    '&:hover': {
                      bgcolor: '#0d4715',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 30px rgba(27, 94, 32, 0.4)'
                    }
                  }}
                >
                  View Document
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={downloading}
                  size="large"
                  sx={{
                    borderColor: '#2e7d32',
                    color: '#2e7d32',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderWidth: 2,
                    boxShadow: '0 4px 16px rgba(46, 125, 50, 0.2)',
                    '&:hover': {
                      borderColor: '#1b5e20',
                      bgcolor: '#e8f5e9',
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)'
                    },
                    '&:disabled': {
                      borderColor: '#c8e6c9',
                      color: '#81c784'
                    }
                  }}
                >
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </>
            )}
          </Box>

          {/* Project Stats */}
          <Box sx={{ 
            display: 'flex', 
            gap: 4, 
            p: 3,
            bgcolor: 'rgba(27, 94, 32, 0.05)',
            borderRadius: 3,
            border: '1px solid #c8e6c9'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#2e7d32', width: 32, height: 32 }}>
                <ViewIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  {project.view_count}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  Views
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#388e3c', width: 32, height: 32 }}>
                <DownloadIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  {project.download_count}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  Downloads
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Abstract */}
            {project.abstract && (
              <Paper sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 4,
                border: '2px solid #c8e6c9',
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fbe7 100%)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#2e7d32', width: 40, height: 40 }}>
                    <CategoryIcon />
                  </Avatar>
                  <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                    Research Abstract
                                    </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8,
                    color: '#2e7d32',
                    fontSize: '1.1rem',
                    textAlign: 'justify'
                  }}
                >
                  {project.abstract}
                </Typography>
              </Paper>
            )}

            {/* Keywords */}
            {project.keywords && (
              <Paper sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 4,
                border: '2px solid #c8e6c9',
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#388e3c', width: 40, height: 40 }}>
                    <PublicIcon />
                  </Avatar>
                  <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                    Research Keywords
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {project.keywords.split(',').map((keyword, index) => (
                    <Chip 
                      key={index} 
                      label={keyword.trim()} 
                      size="medium"
                      sx={{
                        bgcolor: '#e8f5e9',
                        color: '#1b5e20',
                        fontWeight: 600,
                        border: '1px solid #c8e6c9',
                        '&:hover': {
                          bgcolor: '#c8e6c9',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(27, 94, 32, 0.2)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            )}

            {/* Additional Research Information */}
            <Paper sx={{ 
              p: 4, 
              borderRadius: 4,
              border: '2px solid #c8e6c9',
              boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#4caf50', width: 40, height: 40 }}>
                  <HealthIcon />
                </Avatar>
                <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  Public Health Impact
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.7,
                  color: '#2e7d32',
                  fontSize: '1rem',
                  fontStyle: 'italic'
                }}
              >
                This research contributes to advancing public health knowledge and practice, 
                supporting evidence-based interventions that improve population health outcomes 
                and promote health equity in communities worldwide.
              </Typography>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: 4,
              border: '2px solid #c8e6c9',
              boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#1b5e20', width: 40, height: 40 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                    Research Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3, borderColor: '#c8e6c9' }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(27, 94, 32, 0.05)',
                    borderRadius: 2,
                    border: '1px solid #e8f5e9'
                  }}>
                    <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                      Principal Researcher
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1b5e20',
                      fontWeight: 'bold'
                    }}>
                      <PersonIcon fontSize="small" />
                      {project.author_name}
                    </Typography>
                  </Box>

                  {project.institution && (
                    <Box sx={{
                      p: 2,
                      bgcolor: 'rgba(46, 125, 50, 0.05)',
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                        Institution
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: '#2e7d32',
                        fontWeight: 600
                      }}>
                        <SchoolIcon fontSize="small" />
                        {project.institution}
                      </Typography>
                    </Box>
                  )}

                  {project.department && (
                    <Box sx={{
                      p: 2,
                      bgcolor: 'rgba(56, 142, 60, 0.05)',
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        {project.department}
                      </Typography>
                    </Box>
                  )}

                  {project.supervisor && (
                    <Box sx={{
                      p: 2,
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                        Research Supervisor
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        {project.supervisor}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(27, 94, 32, 0.08)',
                    borderRadius: 2,
                    border: '1px solid #c8e6c9'
                  }}>
                    <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                      Publication Date
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1b5e20',
                      fontWeight: 'bold'
                    }}>
                      <CalendarIcon fontSize="small" />
                      {new Date(project.publication_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>

                  {project.document_filename && (
                    <Box sx={{
                      p: 2,
                      bgcolor: 'rgba(46, 125, 50, 0.08)',
                      borderRadius: 2,
                      border: '1px solid #c8e6c9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1 }}>
                        Document Information
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1 }}>
                        {project.document_filename}
                      </Typography>
                      {project.document_size && (
                        <Chip
                          label={`${(project.document_size / 1024 / 1024).toFixed(2)} MB`}
                          size="small"
                          sx={{
                            bgcolor: '#c8e6c9',
                            color: '#1b5e20',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>

                {/* Call to Action */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#1b5e20', borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                    Advance Public Health Research
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#c8e6c9', mb: 2, lineHeight: 1.5 }}>
                    Explore more research projects that contribute to improving global health outcomes.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/projects')}
                    sx={{
                      bgcolor: 'white',
                      color: '#1b5e20',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      '&:hover': {
                        bgcolor: '#f1f8e9',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Browse More Research
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Document Viewer */}
        {project.document_url && (
          <DocumentViewer
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            documentUrl={apiService.getDocumentViewUrl(project.slug)}
            filename={project.document_filename}
            projectSlug={project.slug}
            onDownload={handleDownload}
          />
        )}
      </Container>
    </Box>
  );
};

export default ProjectDetailPage;