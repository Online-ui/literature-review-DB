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
  Avatar,
  useTheme,
  useMediaQuery,
  ImageList,
  ImageListItem,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  Dialog,
  DialogContent,
  Skeleton,
  Zoom,
  Slide,
  Tooltip,
  Fab
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
  Public as PublicIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as ImageIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  ZoomIn as ZoomInIcon,
  TouchApp as TouchIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import DocumentViewer from '../components/DocumentViewer';
import SEOHead from '../components/SEOHead';
import StructuredData from '../components/StructuredData';

// Update the Project interface
interface ProjectImage {
  id: number;
  filename: string;
  content_type: string;
  image_size?: number;
  order_index: number;
  is_featured: boolean;
}

interface Project {
  id: number;
  title: string;
  slug: string;
  author_name: string;
  institution?: string;
  department?: string;
  supervisor?: string;
  abstract?: string;
  keywords?: string;
  research_area?: string;
  degree_type?: string;
  academic_year?: string;
  publication_date: string;
  document_filename?: string;
  document_size?: number;
  view_count: number;
  download_count: number;
  created_at?: string;
  updated_at?: string;
  featured_image_index?: number;
  image_records?: ProjectImage[];
}

// Add helper function for image URLs
const getImageUrl = (projectId: number, imageId: number): string => {
  return `${process.env.REACT_APP_API_URL}/projects/${projectId}/images/${imageId}`;
};

// Updated Image Gallery Component
const ImageGallery: React.FC<{ 
  imageRecords: ProjectImage[];
  projectId: number;
  projectTitle: string;
  isMobile: boolean;
  isExtraSmall: boolean;
}> = ({ imageRecords, projectId, projectTitle }) => {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});

  // Sort images by order_index
  const sortedImages = [...imageRecords].sort((a, b) => a.order_index - b.order_index);

  const handleImageClick = (image: ProjectImage, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  const handleCloseImageDialog = () => {
    setSelectedImage(null);
    setSelectedImageIndex(null);
  };

  const handleImageError = (imageId: number) => {
    console.error(`Failed to load image with id: ${imageId}`);
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoad = (imageId: number) => {
    setImageLoading(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoadStart = (imageId: number) => {
    setImageLoading(prev => ({ ...prev, [imageId]: true }));
  };
  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(sortedImages[newIndex]);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < sortedImages.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(sortedImages[newIndex]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'Escape') {
      handleCloseImageDialog();
    }
  };

  if (sortedImages.length === 0) {
    return null;
  }
  return (
    <>
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        mb: { xs: 2, sm: 3 }, 
        borderRadius: { xs: 2, sm: 3, md: 4 },
        border: '2px solid #c8e6c9',
        background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 3 } }}>
          <Avatar sx={{ 
            bgcolor: '#2e7d32', 
            width: { xs: 32, sm: 40 }, 
            height: { xs: 32, sm: 40 } 
          }}>
            <ImageIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
          </Avatar>
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            color: '#1b5e20',
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
          }}>
            Figures & Images
          </Typography>
        </Box>
        
        <ImageList 
          sx={{ width: '100%', height: { xs: 300, sm: 400, md: 450 } }} 
          cols={isExtraSmall ? 2 : isMobile ? 2 : 3} 
          rowHeight={isExtraSmall ? 120 : isMobile ? 140 : 164}
          gap={isExtraSmall ? 4 : isMobile ? 6 : 8}
        >
          {sortedImages.map((image, index) => (
            <ImageListItem 
              key={image.id}
              sx={{ 
                cursor: 'pointer',
                borderRadius: { xs: 1.5, sm: 2 },
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  '& .image-overlay': {
                    opacity: 1
                  }
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
              onClick={() => handleImageClick(image, index)}
            >
              {imageErrors[image.id] ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    color: '#666',
                    borderRadius: { xs: 1.5, sm: 2 }
                  }}
                >
                  <ImageIcon sx={{ fontSize: { xs: 24, sm: 32 }, mb: 1, opacity: 0.5 }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Image unavailable
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ position: 'relative', height: '100%' }}>
                  {imageLoading[image.id] && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        zIndex: 1
                      }}
                    >
                      <CircularProgress size={24} sx={{ color: '#2e7d32' }} />
                    </Box>
                  )}
                  <img
                    src={getImageUrl(projectId, image.id)}
                    alt={image.filename}
                    loading="lazy"
                    style={{ 
                      height: '100%', 
                      width: '100%',
                      objectFit: 'cover',
                      border: image.is_featured ? '3px solid #1976d2' : 'none',
                      borderRadius: isExtraSmall ? '6px' : isMobile ? '8px' : '8px'
                    }}
                    onError={() => handleImageError(image.id)}
                    onLoad={() => handleImageLoad(image.id)}
                    onLoadStart={() => handleImageLoadStart(image.id)}
                  />
                  
                  {/* Hover Overlay for Desktop */}
                  {!isMobile && (
                    <Box
                      className="image-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <ZoomInIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                  )}
                  
                  {/* Featured Badge */}
                  {image.is_featured && (
                    <Chip
                      label="Featured"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        bgcolor: '#1976d2',
                        color: 'white',
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        height: { xs: 16, sm: 20 },
                        zIndex: 2
                      }}
                    />
                  )}
                </Box>
              )}
            </ImageListItem>
          ))}
        </ImageList>
        
        {/* Mobile Touch Hint */}
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            mt: 2,
            p: 1,
            bgcolor: 'rgba(46, 125, 50, 0.05)',
            borderRadius: 2,
            border: '1px solid #e8f5e9'
          }}>
            <TouchIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
            <Typography variant="caption" sx={{ 
              color: '#2e7d32',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}>
              Tap images to view full size
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Image Dialog */}
      <Dialog
        open={selectedImage !== null}
        onClose={handleCloseImageDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        onKeyDown={handleKeyDown}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: isMobile ? 'black' : 'transparent',
            boxShadow: 'none',
            borderRadius: isMobile ? 0 : 2
          }
        }}
      >
        <DialogContent sx={{ 
          position: 'relative', 
          p: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          minHeight: isMobile ? '100vh' : 'auto'
        }}>
          <IconButton
            onClick={handleCloseImageDialog}
            sx={{
              position: 'absolute',
              right: { xs: 12, sm: 16 },
              top: { xs: 12, sm: 16 },
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
          
          {/* Navigation buttons */}
          {selectedImageIndex !== null && selectedImageIndex > 0 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: { xs: 12, sm: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}

          {selectedImageIndex !== null && selectedImageIndex < sortedImages.length - 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: { xs: 12, sm: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          )}

          {selectedImage && (
            <>
              {imageErrors[selectedImage.id] ? (
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    color: '#666',
                    gap: 2
                  }}
                >
                  <ImageIcon sx={{ fontSize: { xs: 48, sm: 64 }, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Image unavailable
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={getImageUrl(projectId, selectedImage.id)}
                    alt={selectedImage.filename}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: isMobile ? '90vh' : '80vh',
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                    onError={() => handleImageError(selectedImage.id)}
                  />
                </Box>
              )}
              
              {/* Image Info Bar */}
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  bottom: { xs: 12, sm: 16 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  borderRadius: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  textAlign: 'center',
                  maxWidth: '90%'
                }}
              >
                {selectedImageIndex !== null && (
                  <>
                    {`Image ${selectedImageIndex + 1} of ${sortedImages.length}`}
                    {selectedImage.filename && (
                      <Box component="span" sx={{ display: 'block', fontSize: '0.7rem', opacity: 0.8 }}>
                        {selectedImage.filename}
                      </Box>
                    )}
                  </>
                )}
              </Typography>
              
              {/* Mobile Swipe Hint */}
              {isMobile && sortedImages.length > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(255,255,255,0.6)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    opacity: 0.7
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    Swipe
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 20 }} />
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProject(slug);
    }
  }, [slug]);

  // Check if project is bookmarked
  useEffect(() => {
    if (project) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarked_projects') || '[]');
      setBookmarked(bookmarks.includes(project.id));
    }
  }, [project]);
  const loadProject = async (projectSlug: string) => {
    try {
      const data = await apiService.getProjectBySlug(projectSlug);
      console.log('Loaded project data:', data);
      console.log('Project image_records:', data?.image_records);
      if (data) {
        setProject(data);
      } else {
        setError('Research project not found');
      }
    } catch (err) {
      console.error('Error loading project:', err);
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
    if (!project) return;
    
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const cleanBaseUrl = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.slice(0, -4) 
      : API_BASE_URL.replace(/\/$/, '');
    
    const viewUrl = `${cleanBaseUrl}/api/projects/${project.slug}/view-document`;
    window.open(viewUrl, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: project?.title,
          text: project?.abstract?.substring(0, 100) + '...',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // Could add a toast notification here
  };

  const handleBookmark = () => {
    if (!project) return;
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked_projects') || '[]');
    
    if (bookmarked) {
      const newBookmarks = bookmarks.filter((id: number) => id !== project.id);
      localStorage.setItem('bookmarked_projects', JSON.stringify(newBookmarks));
      setBookmarked(false);
    } else {
      bookmarks.push(project.id);
      localStorage.setItem('bookmarked_projects', JSON.stringify(bookmarks));
      setBookmarked(true);
    }
  };
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: isMobile ? 10 : 2, sm: isMobile ? 12 : 3, md: 4 }
      }}>
        <SEOHead title="Loading Research Project..." />
        
        {/* Loading Skeleton */}
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} sx={{ mb: 2, borderRadius: 3 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: isMobile ? 10 : 2, sm: isMobile ? 12 : 3, md: 4 }
      }}>
        <SEOHead 
          title="Research Project Not Found - School of Public Health"
          description="The requested research project could not be found in our public health database."
        />
        <Alert 
          severity="error" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: '2px solid #d32f2f',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '& .MuiAlert-icon': {
              color: '#d32f2f',
              fontSize: { xs: 20, sm: 24 }
            }
          }}
        >
          {error || 'Research project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          variant="contained"
          fullWidth={isMobile}
          size={isExtraSmall ? "medium" : "large"}
          sx={{
            bgcolor: '#1b5e20',
            color: 'white',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1, sm: 1.5 },
            borderRadius: 3,
            textTransform: 'none',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(27, 94, 32, 0.3)',
            maxWidth: { xs: '100%', sm: 300 },
            mx: { xs: 0, sm: 'auto' },
            '&:hover': {
              bgcolor: '#0d4715',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(27, 94, 32, 0.4)'
            },
            '&:active': {
              transform: 'scale(0.98)'
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
    <Box sx={{ 
      bgcolor: '#fafafa', 
      minHeight: '100vh',
      position: 'relative'
    }}>
      <Container maxWidth="lg" sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: isMobile ? 10 : 2, sm: isMobile ? 12 : 3, md: 4 }
      }}>
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
          size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
          sx={{ 
            mb: { xs: 1.5, sm: 2, md: 4 },
            borderColor: '#1b5e20',
            color: '#1b5e20',
            px: { xs: 1.5, sm: 2, md: 3 },
            py: { xs: 0.5, sm: 1 },
            borderRadius: 3,
            textTransform: 'none',
            fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderColor: '#0d4715',
              bgcolor: '#e8f5e9',
              borderWidth: 2,
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'scale(0.98)'
            }
          }}
        >
          {isExtraSmall ? 'Back' : 'Back to Research Projects'}
        </Button>

        {/* Project Header */}
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, 
          mb: { xs: 2, sm: 4 }, 
          borderRadius: 4,
          border: '2px solid #c8e6c9',
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)',
          boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: { xs: 1.5, sm: 2, md: 3 }, 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Avatar
              sx={{
                bgcolor: '#1b5e20',
                width: { xs: 40, sm: 48, md: 56, lg: 60 },
                height: { xs: 40, sm: 48, md: 56, lg: 60 },
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.3)'
              }}
            >
              <ResearchIcon sx={{ 
                fontSize: { xs: 20, sm: 24, md: 28, lg: 30 }, 
                color: 'white' 
              }} />
            </Avatar>
            <Box sx={{ flexGrow: 1, width: '100%' }}>
              <Typography 
                variant={isExtraSmall ? "h6" : isMobile ? "h5" : "h3"}
                component="h1" 
                gutterBottom
                sx={{ 
                  color: '#1b5e20',
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(27, 94, 32, 0.1)',
                  fontSize: { 
                    xs: isExtraSmall ? '1.25rem' : '1.5rem', 
                    sm: '1.75rem', 
                    md: '2.25rem', 
                    lg: '2.5rem' 
                  },
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                {project.title}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: { xs: 0.75, sm: 1, md: 1.5 }, 
                mb: { xs: 2, sm: 3 },
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                {project.research_area && (
                  <Chip 
                    icon={<HealthIcon />}
                    label={project.research_area} 
                    size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
                    sx={{
                      bgcolor: '#1b5e20',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                      height: { xs: 24, sm: 28, md: 32 },
                      '& .MuiChip-icon': { color: 'white' },
                      boxShadow: '0 2px 8px rgba(27, 94, 32, 0.3)'
                    }}
                  />
                )}
                {project.degree_type && (
                  <Chip 
                    icon={<SchoolIcon />}
                    label={project.degree_type} 
                    size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
                    sx={{
                      bgcolor: '#2e7d32',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                      height: { xs: 24, sm: 28, md: 32 },
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
                    size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
                    sx={{
                      borderColor: '#388e3c',
                      color: '#388e3c',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                      height: { xs: 24, sm: 28, md: 32 },
                      borderWidth: 2,
                      '& .MuiChip-icon': { color: '#388e3c' }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 1.5, md: 2 }, 
            mb: { xs: 3, sm: 4 }, 
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center'
          }}>
            {project.document_filename && (
              <>
                <Button
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={handleViewDocument}
                  size={isExtraSmall ? "medium" : isMobile ? "large" : "large"}
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: '#1b5e20',
                    color: 'white',
                    px: { xs: 2.5, sm: 3, md: 4 },
                    py: { xs: 1, sm: 1.5 },
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 'bold',
                    boxShadow: '0 6px 20px rgba(27, 94, 32, 0.3)',
                    '&:hover': {
                      bgcolor: '#0d4715',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 30px rgba(27, 94, 32, 0.4)'
                    },
                    '&:active': {
                      transform: 'scale(0.98)'
                    }
                  }}
                >
                  {isExtraSmall ? 'View' : 'View Document'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={downloading}
                  size={isExtraSmall ? "medium" : isMobile ? "large" : "large"}
                  fullWidth={isMobile}
                  sx={{
                    borderColor: '#2e7d32',
                    color: '#2e7d32',
                    px: { xs: 2.5, sm: 3, md: 4 },
                    py: { xs: 1, sm: 1.5 },
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
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
                    '&:active': {
                      transform: 'scale(0.98)'
                    },
                    '&:disabled': {
                      borderColor: '#c8e6c9',
                      color: '#81c784'
                    }
                  }}
                >
                  {downloading ? 'Downloading...' : isExtraSmall ? 'Download' : 'Download PDF'}
                </Button>
              </>
            )}
            
            {/* Mobile Action Buttons */}
            {isMobile && (
              <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon sx={{ fontSize: 18 }} />}
                  onClick={handleShare}
                  size="small"
                  sx={{
                    borderColor: '#388e3c',
                    color: '#388e3c',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    flex: 1,
                    '&:hover': {
                      bgcolor: '#e8f5e9'
                    }
                  }}
                >
                  Share
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<BookmarkIcon sx={{ fontSize: 18 }} />}
                  onClick={handleBookmark}
                  size="small"
                  sx={{
                    borderColor: bookmarked ? '#1b5e20' : '#388e3c',
                    color: bookmarked ? '#1b5e20' : '#388e3c',
                    bgcolor: bookmarked ? '#e8f5e9' : 'transparent',
                    px: 2,
                    py: 0.75,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    flex: 1,
                    '&:hover': {
                      bgcolor: '#e8f5e9'
                    }
                  }}
                >
                  {bookmarked ? 'Saved' : 'Save'}
                </Button>
              </Box>
            )}
          </Box>

          {/* Project Stats */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1.5, sm: 2, md: 4 }, 
            p: { xs: 1.5, sm: 2, md: 3 },
            bgcolor: 'rgba(27, 94, 32, 0.05)',
            borderRadius: 3,
            border: '1px solid #c8e6c9',
            flexDirection: { xs: 'row', sm: 'row' },
            justifyContent: 'space-around'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#2e7d32', width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>
                <ViewIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                width: { xs: 24, sm: 28, md: 32 }, 
                height: { xs: 24, sm: 28, md: 32 } 
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  {project.view_count}
                </Typography>
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  Views
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#388e3c', width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}>
                <ViewIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
              </Avatar>
              <Box>
                <Typography variant={isExtraSmall ? "body2" : isMobile ? "body1" : "h6"} sx={{ 
                  color: '#1b5e20', 
                width: { xs: 24, sm: 28, md: 32 }, 
                height: { xs: 24, sm: 28, md: 32 } 
                }}>
                <DownloadIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </Typography>
                <Typography variant="caption" sx={{ 
                <Typography variant={isExtraSmall ? "body2" : isMobile ? "body1" : "h6"} sx={{ 
                  color: '#1b5e20', 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
                }}>
                  fontWeight: 500, 
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                <Typography variant="caption" sx={{ 
                  color: '#2e7d32', 
                  fontWeight: 500, 
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                }}>
                  Downloads
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3, lg: 4 }}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Abstract */}
            {project.abstract && (
              <Paper sx={{ 
                p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, 
                mb: { xs: 2, sm: 4 }, 
                borderRadius: 4,
                border: '2px solid #c8e6c9',
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fbe7 100%)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 3 } }}>
                  <Avatar sx={{ bgcolor: '#2e7d32', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                    <CategoryIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    width: { xs: 28, sm: 32, md: 40 }, 
                    height: { xs: 28, sm: 32, md: 40 } 
                    Research Abstract
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8,
                    color: '#2e7d32',
                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                    textAlign: 'justify'
                  }}
                >
                  {project.abstract}
                </Typography>
              </Paper>
            )}

            {/* Image Gallery - Updated to use image_records */}
            {project.image_records && project.image_records.length > 0 && (
              <ImageGallery 
                imageRecords={project.image_records} 
                projectId={project.id}
                projectTitle={project.title}
              />
            )}

            {/* Keywords */}
            {project.keywords && (
              <Paper sx={{ 
                p: { xs: 2, sm: 4 }, 
                mb: { xs: 2, sm: 4 }, 
                borderRadius: 4,
                border: '2px solid #c8e6c9',
                boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 3 } }}>
                  <Avatar sx={{ bgcolor: '#388e3c', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                    <CategoryIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                  </Avatar>
                  <Typography variant={isExtraSmall ? "body1" : isMobile ? "h6" : "h5"} sx={{ 
                    color: '#1b5e20', 
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem', lg: '1.5rem' }
                  }}>
                    Research Keywords
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 } }}>
                  {project.keywords.split(',').map((keyword, index) => (
                    <Chip 
                      key={index} 
                      label={keyword.trim()} 
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        bgcolor: '#e8f5e9',
                        color: '#1b5e20',
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
              p: { xs: 2, sm: 4 }, 
              borderRadius: 4,
              border: '2px solid #c8e6c9',
              boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 3 } }}>
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' },
                  <HealthIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                  Public Health Impact
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.7,
                  color: '#2e7d32',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontStyle: 'italic'
                }}
              >
                This research contributes to advancing public health knowledge and practice, 
                supporting evidence-based interventions that improve population health outcomes 
                and promote health equity in communities worldwide.
                isMobile={isMobile}
                isExtraSmall={isExtraSmall}
              </Typography>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
                p: { xs: 1.5, sm: 2, md: 3, lg: 4 }, 
              borderRadius: 4,
              border: '2px solid #c8e6c9',
              boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
            }}>
                    width: { xs: 28, sm: 32, md: 40 }, 
                    height: { xs: 28, sm: 32, md: 40 } 
                  <Avatar sx={{ bgcolor: '#1b5e20', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                    <PublicIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                  </Avatar>
                  <Typography variant={isExtraSmall ? "body1" : isMobile ? "h6" : "h5"} sx={{ 
                    color: '#1b5e20', 
                    fontWeight: 'bold',
              <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3, lg: 4 } }}>
                  }}>
                    Research Details
                  </Typography>
                    width: { xs: 28, sm: 32, md: 40 }, 
                    height: { xs: 28, sm: 32, md: 40 } 
                
                    <PersonIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                  <Box sx={{
                  <Typography variant={isExtraSmall ? "body2" : isMobile ? "body1" : "h6"} sx={{ 
                    color: '#1b5e20', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' }
                  }}>
                    bgcolor: 'rgba(27, 94, 32, 0.05)',
                    borderRadius: 2,
                    border: '1px solid #e8f5e9'
                  }}>
                    <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 3 } }}>
                    </Typography>
                    p: { xs: 1.25, sm: 1.5, md: 2 },
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1b5e20',
                    <Typography variant="body2" sx={{ 
                      color: '#388e3c', 
                      fontWeight: 600, 
                      mb: 1, 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                    }}>
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                    <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                      {project.author_name}
                    </Typography>
                  </Box>

                  {project.institution && (
                      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
                      p: { xs: 1.5, sm: 2 },
                      <PersonIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.75, sm: 1, md: 1.5 } }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Institution
                      </Typography>
                      p: { xs: 1.25, sm: 1.5, md: 2 },
                      size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
                        alignItems: 'center', 
                        gap: 1,
                        color: '#2e7d32',
                      <Typography variant="body2" sx={{ 
                        color: '#388e3c', 
                        fontWeight: 600, 
                        mb: 1, 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                      }}>
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                      <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                        {project.institution}
                      </Typography>
                    </Box>
                  )}

                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                        lineHeight: 1.4
                    <Box sx={{
                        <SchoolIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                      bgcolor: 'rgba(56, 142, 60, 0.05)',
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Department
                      </Typography>
                      p: { xs: 1.25, sm: 1.5, md: 2 },
                        {project.department}
                      </Typography>
                    </Box>
                  )}
                      <Typography variant="body2" sx={{ 
                        color: '#388e3c', 
                        fontWeight: 600, 
                        mb: 1, 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                      }}>
                  {project.supervisor && (
                    <Box sx={{
                      <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                        color: '#2e7d32', 
                        fontWeight: 600, 
                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
                      }}>
                      bgcolor: 'rgba(76, 175, 80, 0.05)',
                      borderRadius: 2,
                      border: '1px solid #e8f5e9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Research Supervisor(S)
                      </Typography>
                      p: { xs: 1.25, sm: 1.5, md: 2 },
                        {project.supervisor}
                      </Typography>
                    </Box>
                  )}
                      <Typography variant="body2" sx={{ 
                        color: '#388e3c', 
                        fontWeight: 600, 
                        mb: 1, 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                      }}>
                  <Box sx={{
                    p: { xs: 1.5, sm: 2 },
                      <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                        color: '#2e7d32', 
                        fontWeight: 600, 
                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
                      }}>
                    borderRadius: 2,
                    border: '1px solid #c8e6c9'
                  }}>
                    <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Publication Date
                    </Typography>
                    p: { xs: 1.25, sm: 1.5, md: 2 },
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1b5e20',
                    <Typography variant="body2" sx={{ 
                      color: '#388e3c', 
                      fontWeight: 600, 
                      mb: 1, 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                    }}>
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                    <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                      {new Date(project.publication_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
                  </Box>
                      <CalendarIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  {project.document_filename && (
                    <Box sx={{
                      p: { xs: 1.5, sm: 2 },
                      bgcolor: 'rgba(46, 125, 50, 0.08)',
                      borderRadius: 2,
                      border: '1px solid #c8e6c9'
                    }}>
                      <Typography variant="body2" sx={{ color: '#388e3c', fontWeight: 600, mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Document Information
                      </Typography>
                      p: { xs: 1.25, sm: 1.5, md: 2 },
                        color: '#2e7d32', 
                        fontWeight: 600, 
                        mb: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      <Typography variant="body2" sx={{ 
                        color: '#388e3c', 
                        fontWeight: 600, 
                        mb: 1, 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                      }}>
                        height: { xs: 24, sm: 28, md: 32 },
                      }}>
                      <Typography variant={isExtraSmall ? "caption" : isMobile ? "body2" : "body1"} sx={{ 
                      </Typography>
                      {project.document_size && (
                        <Chip
                        fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                        '&:active': {
                          transform: 'scale(0.95)'
                          label={`${(project.document_size / 1024 / 1024).toFixed(2)} MB`}
                          size="small"
                          sx={{
                            bgcolor: '#c8e6c9',
                            color: '#1b5e20',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        />
                      )}
                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                            height: { xs: 20, sm: 24 }
                  )}
                </Box>

                {/* Call to Action */}
                <Box sx={{ 
                  mt: { xs: 3, sm: 4 }, 
                  p: { xs: 2, sm: 3 }, 
                  bgcolor: '#1b5e20', 
                  width: { xs: 28, sm: 32, md: 40 }, 
                  mt: { xs: 2, sm: 3, md: 4 }, 
                  p: { xs: 1.5, sm: 2, md: 3 }, 
                  <Typography 
                    variant={isMobile ? "body1" : "h6"} 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                    variant={isExtraSmall ? "body2" : isMobile ? "body1" : "h6"} 
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Advance Public Health Research
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' }
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#c8e6c9', 
                      mb: { xs: 1.5, sm: 2 }, 
                      lineHeight: 1.5,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Explore more research projects that contribute to improving global health outcomes.
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                  <Button
                    variant="contained"
                    onClick={() => navigate('/projects')}
                  <HealthIcon sx={{ fontSize: { xs: 16, sm: 20, md: 24 } }} />
                    sx={{
                <Typography variant={isExtraSmall ? "body1" : isMobile ? "h6" : "h5"} sx={{ 
                  color: '#1b5e20', 
                    size={isExtraSmall ? "small" : isMobile ? "medium" : "medium"}
                    fullWidth={isMobile}
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem', lg: '1.5rem' }
                }}>
                      color: '#1b5e20',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: 2,
                      px: { xs: 1.5, sm: 2, md: 3 },
                      py: { xs: 0.75, sm: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                      '&:hover': {
                        bgcolor: '#f1f8e9',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                      },
                      '&:active': {
                        transform: 'scale(0.98)'
                      }
                    }}
                  >
                    {isExtraSmall ? 'Browse More' : 'Browse More Research'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Mobile Floating Action Buttons */}
        {isMobile && !loading && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              zIndex: 1000
            }}
          >
            <Tooltip title="Share Project" placement="left">
              <Fab
                size="small"
                onClick={handleShare}
                sx={{
                  bgcolor: '#2e7d32',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1b5e20'
                  }
                }}
              >
                <ShareIcon sx={{ fontSize: 18 }} />
              </Fab>
            </Tooltip>
            
            <Tooltip title={bookmarked ? "Remove Bookmark" : "Bookmark Project"} placement="left">
              <Fab
                size="small"
                onClick={handleBookmark}
                sx={{
                  bgcolor: bookmarked ? '#1b5e20' : 'white',
                  color: bookmarked ? 'white' : '#2e7d32',
                  border: bookmarked ? 'none' : '2px solid #2e7d32',
                  '&:hover': {
                    bgcolor: bookmarked ? '#0d4715' : '#e8f5e9'
                  }
                }}
              >
                <BookmarkIcon sx={{ fontSize: 18 }} />
              </Fab>
            </Tooltip>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProjectDetailPage;
