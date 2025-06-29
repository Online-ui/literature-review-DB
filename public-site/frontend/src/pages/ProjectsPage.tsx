import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  CircularProgress,
  Breadcrumbs,
  Link,
  Avatar,
  Fade,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  ArrowForward as ArrowIcon,
  FilterList as FilterIcon,
  LocalHospital as HealthIcon,
  Science as ResearchIcon,
  School as SchoolIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { ProjectSummary, SearchFilters, SearchResponse } from '../types';
import SEOHead from '../components/SEOHead';

const ProjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchResponse, setSearchResponse] = useState<SearchResponse>({
    projects: [],
    total: 0,
    page: 1,
    per_page: 12,
    total_pages: 0,
    filters: {}
  });
  const [loading, setLoading] = useState(true);
  const [researchAreas, setResearchAreas] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Form state
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('search') || '',
    research_area: searchParams.get('research_area') || '',
    degree_type: searchParams.get('degree_type') || '',
    institution: searchParams.get('institution') || '',
    academic_year: searchParams.get('academic_year') || ''
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    searchProjects(page);
  }, [searchParams]);

  const loadFilterOptions = async () => {
    try {
      const [areasData, institutionsData] = await Promise.all([
        apiService.getResearchAreas(),
        apiService.getInstitutions()
      ]);
      setResearchAreas(areasData);
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const searchProjects = async (page: number = 1) => {
    setLoading(true);
    try {
      const currentFilters = {
        query: searchParams.get('search') || '',
        research_area: searchParams.get('research_area') || '',
        degree_type: searchParams.get('degree_type') || '',
        institution: searchParams.get('institution') || '',
        academic_year: searchParams.get('academic_year') || ''
      };
      
      const response = await apiService.searchProjects(currentFilters, page);
      setSearchResponse(response);
    } catch (error) {
      console.error('Failed to search projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('search', filters.query);
    if (filters.research_area) params.set('research_area', filters.research_area);
    if (filters.degree_type) params.set('degree_type', filters.degree_type);
    if (filters.institution) params.set('institution', filters.institution);
    if (filters.academic_year) params.set('academic_year', filters.academic_year);
    
    params.set('page', '1');
    setSearchParams(params);
    setMobileFilterOpen(false);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      research_area: '',
      degree_type: '',
      institution: '',
      academic_year: ''
    });
    setSearchParams(new URLSearchParams());
    setMobileFilterOpen(false);
  };

  const degreeTypes = ["Bachelor's", "Master's", "PhD", "Diploma", "Certificate"];
  const academicYears = ["2024-2025", "2023-2024", "2022-2023", "2021-2022", "2020-2021"];

  // Get search query for dynamic SEO
  const searchQuery = searchParams.get('search');

  // Filter Form Component
  const FilterForm = () => (
    <Box>
      <Grid container spacing={2}>
        {/* Search Query */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Search Research Projects"
            placeholder="Keywords, author, health topics..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#2e7d32' }} />
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#c8e6c9', borderWidth: 2 },
                '&:hover fieldset': { borderColor: '#2e7d32' },
                '&.Mui-focused fieldset': { borderColor: '#1b5e20' }
              },
              '& .MuiInputLabel-root': { color: '#2e7d32' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1b5e20' }
            }}
          />
        </Grid>

        {/* Research Area */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Public Health Area
            </InputLabel>
            <Select
              value={filters.research_area}
              label="Public Health Area"
              onChange={(e) => setFilters({ ...filters, research_area: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9', borderWidth: 2 },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1b5e20' }
              }}
            >
              <MenuItem value="">All Health Areas</MenuItem>
              {researchAreas.map((area) => (
                <MenuItem key={area} value={area}>{area}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Degree Type */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Degree Level
            </InputLabel>
            <Select
              value={filters.degree_type}
              label="Degree Level"
              onChange={(e) => setFilters({ ...filters, degree_type: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9', borderWidth: 2 },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1b5e20' }
              }}
            >
              <MenuItem value="">All Levels</MenuItem>
              {degreeTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Institution */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Institution
            </InputLabel>
            <Select
              value={filters.institution}
              label="Institution"
              onChange={(e) => setFilters({ ...filters, institution: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9', borderWidth: 2 },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1b5e20' }
              }}
            >
              <MenuItem value="">All Institutions</MenuItem>
              {institutions.map((institution) => (
                <MenuItem key={institution} value={institution}>{institution}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Academic Year */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#2e7d32', '&.Mui-focused': { color: '#1b5e20' } }}>
              Academic Year
            </InputLabel>
            <Select
              value={filters.academic_year}
              label="Academic Year"
              onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#c8e6c9', borderWidth: 2 },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2e7d32' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1b5e20' }
              }}
            >
              <MenuItem value="">All Years</MenuItem>
              {academicYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              size="large"
              fullWidth={isMobile}
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
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={clearFilters}
              size="large"
              fullWidth={isMobile}
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
                '&:hover': {
                  borderColor: '#1b5e20',
                  bgcolor: '#e8f5e9',
                  borderWidth: 2
                }
              }}
            >
              Clear All Filters
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      {/* SEO Head */}
      {searchQuery ? (
        <SEOHead 
          title={`Public Health Research: "${searchQuery}" - School of Public Health`}
          description={`Discover public health research projects related to "${searchQuery}". Explore evidence-based studies, theses, and dissertations advancing health equity and population health.`}
          keywords={`${searchQuery}, public health research, health equity, population health, epidemiology, health policy`}
          url={typeof window !== 'undefined' ? window.location.href : ''}
        />
      ) : (
        <SEOHead 
          title="Public Health Research Database - School of Public Health"
          description="Explore comprehensive public health research projects, theses, and dissertations. Discover evidence-based studies advancing health equity, population health, and global health outcomes."
          keywords="public health research, health equity, population health, epidemiology, global health, community health, health policy, evidence-based practice"
          url={typeof window !== 'undefined' ? window.location.href : ''}
        />
      )}

      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #0d4715 0%, #1b5e20 50%, #2e7d32 100%)',
        color: 'white', 
        py: { xs: 4, md: 8 },
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Breadcrumbs 
            sx={{ 
              mb: 3, 
              '& .MuiBreadcrumbs-separator': { color: '#c8e6c9' },
              '& a, & p': { color: '#e8f5e9', fontSize: { xs: '0.875rem', md: '1rem' } }
            }}
          >
            <Link 
              color="inherit" 
                            onClick={() => navigate('/')} 
              sx={{ 
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { color: 'white' }
              }}
            >
              Home
            </Link>
            <Typography color="inherit" sx={{ fontWeight: 600 }}>
              Research Projects
            </Typography>
          </Breadcrumbs>
          
          <Grid container spacing={4} alignItems="center">
            {/* Left side content */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    width: { xs: 60, md: 80 },
                    height: { xs: 60, md: 80 },
                    border: '3px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <ResearchIcon sx={{ fontSize: { xs: 30, md: 40 }, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h2" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold',
                      textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                    }}
                  >
                    Public Health Research
                  </Typography>
                </Box>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  opacity: 0.95,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  lineHeight: 1.4,
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                }}
              >
                Discover evidence-based research advancing health equity and improving population health outcomes worldwide
              </Typography>
            </Grid>

            {/* Right side - Student with telescope image */}
            {!isMobile && (
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 150, md: 200 },
                      height: { xs: 150, md: 200 },
                      borderRadius: '50%',
                      border: '4px solid rgba(255,255,255,0.3)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src="/images/student-research.jpeg" 
                      alt="Public Health Student with Telescope"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Mobile Filter Button */}
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={() => setMobileFilterOpen(true)}
              sx={{
                bgcolor: '#1b5e20',
                color: 'white',
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#0d4715'
                }
              }}
            >
              Search & Filter Projects
            </Button>
          </Box>
        )}

        {/* Desktop Search and Filters */}
        {!isMobile && (
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 4,
            border: '2px solid #c8e6c9',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)',
            boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#1b5e20', width: 40, height: 40 }}>
                <FilterIcon />
              </Avatar>
              <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                Search & Filter Research Projects
              </Typography>
            </Box>
            
            <FilterForm />
          </Paper>
        )}

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="bottom"
          open={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '90vh'
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                Search & Filter
              </Typography>
              <IconButton onClick={() => setMobileFilterOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <FilterForm />
          </Box>
        </Drawer>

        {/* Results Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 2,
          mb: 4,
          p: { xs: 2, md: 3 },
          bgcolor: 'rgba(27, 94, 32, 0.05)',
          borderRadius: 3,
          border: '1px solid #c8e6c9'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#2e7d32', width: { xs: 35, md: 40 }, height: { xs: 35, md: 40 } }}>
              <PublicIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: '#1b5e20', 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.5rem' }
                }}
              >
                {loading ? 'Searching Research...' : `${searchResponse.total} Research Projects Found`}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#2e7d32',
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}
              >
                Evidence-based studies advancing public health knowledge
              </Typography>
            </Box>
          </Box>
          {searchResponse.total > 0 && (
            <Chip
              label={`Page ${searchResponse.page} of ${searchResponse.total_pages}`}
              sx={{
                bgcolor: '#1b5e20',
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            />
          )}
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: { xs: 8, md: 12 },
            flexDirection: 'column',
            gap: 3
          }}>
            <CircularProgress 
              size={isMobile ? 60 : 80} 
              sx={{ 
                color: '#1b5e20',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#2e7d32', 
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.25rem' },
                textAlign: 'center'
              }}
            >
              Searching Public Health Research Database...
            </Typography>
          </Box>
        )}

        {/* Projects Grid */}
        {!loading && searchResponse.projects.length > 0 && (
          <>
            <Grid container spacing={{ xs: 2, md: 4 }}>
              {searchResponse.projects.map((project, index) => (
                <Grid item xs={12} sm={6} lg={4} key={project.id}>
                  <Fade in timeout={500 + index * 100}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        borderRadius: { xs: 2, md: 4 },
                        border: '2px solid #c8e6c9',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f9fbe7 100%)',
                        boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)',
                        '&:hover': {
                          transform: { xs: 'none', md: 'translateY(-8px)' },
                          boxShadow: '0 16px 48px rgba(27, 94, 32, 0.2)',
                          border: '2px solid #2e7d32'
                        }
                      }}
                      onClick={() => navigate(`/projects/${project.slug}`)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: '#1b5e20',
                              width: { xs: 35, md: 40 },
                              height: { xs: 35, md: 40 },
                              flexShrink: 0
                            }}
                          >
                            <HealthIcon sx={{ fontSize: { xs: 18, md: 20 } }} />
                          </Avatar>
                          <Typography 
                            variant="h6" 
                            component="h3" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: '#1b5e20',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              fontSize: { xs: '1rem', md: '1.25rem' }
                            }}
                          >
                            {project.title}
                          </Typography>
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 3,
                            color: '#2e7d32',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.6,
                            fontSize: { xs: '0.875rem', md: '1rem' }
                          }}
                        >
                          {project.abstract || 'Research abstract not available. This study contributes to advancing public health knowledge and evidence-based practice.'}
                        </Typography>
                        
                        <Box sx={{ mb: 3 }}>
                          {project.research_area && (
                            <Chip 
                              label={project.research_area} 
                              size="small"
                              icon={<HealthIcon />}
                              sx={{
                                mr: 1, 
                                mb: 1,
                                bgcolor: '#1b5e20',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                '& .MuiChip-icon': { color: 'white' }
                              }}
                            />
                          )}
                          {project.degree_type && (
                            <Chip 
                              label={project.degree_type} 
                              size="small"
                              icon={<SchoolIcon />}
                              sx={{
                                mr: 1, 
                                mb: 1,
                                bgcolor: '#2e7d32',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                '& .MuiChip-icon': { color: 'white' }
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ 
                          p: { xs: 1.5, md: 2 }, 
                          bgcolor: 'rgba(27, 94, 32, 0.05)', 
                          borderRadius: 2,
                          border: '1px solid #e8f5e9'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ fontSize: { xs: 14, md: 16 }, color: '#2e7d32' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#1b5e20', 
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              Researcher: {project.author_name}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ fontSize: { xs: 14, md: 16 }, color: '#2e7d32' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#2e7d32', 
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              {project.institution}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      
                                            <CardActions sx={{ p: { xs: 2, md: 3 }, pt: 0, justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ViewIcon sx={{ fontSize: { xs: 14, md: 16 }, color: '#2e7d32' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#2e7d32', 
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              {project.view_count}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DownloadIcon sx={{ fontSize: { xs: 14, md: 16 }, color: '#2e7d32' }} />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#2e7d32', 
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', md: '0.875rem' }
                              }}
                            >
                              {project.download_count}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          endIcon={<ArrowIcon />}
                          sx={{ 
                            textTransform: 'none',
                            color: '#1b5e20',
                            fontWeight: 'bold',
                            fontSize: { xs: '0.875rem', md: '1rem' },
                            '&:hover': {
                              bgcolor: '#e8f5e9'
                            }
                          }}
                        >
                          View Research
                        </Button>
                      </CardActions>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {searchResponse.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 4, md: 8 } }}>
                <Paper sx={{ 
                  p: { xs: 1, md: 2 }, 
                  borderRadius: 3,
                  border: '2px solid #c8e6c9',
                  boxShadow: '0 4px 16px rgba(27, 94, 32, 0.1)'
                }}>
                  <Pagination
                    count={searchResponse.total_pages}
                    page={searchResponse.page}
                    onChange={handlePageChange}
                    size={isMobile ? "medium" : "large"}
                    showFirstButton={!isMobile}
                    showLastButton={!isMobile}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={isMobile ? 1 : 2}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: '#2e7d32',
                        fontWeight: 600,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                        minWidth: { xs: 32, md: 40 },
                        height: { xs: 32, md: 40 },
                        '&:hover': {
                          bgcolor: '#e8f5e9'
                        },
                        '&.Mui-selected': {
                          bgcolor: '#1b5e20',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#0d4715'
                          }
                        }
                      }
                    }}
                  />
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && searchResponse.projects.length === 0 && (
          <Paper sx={{ 
            p: { xs: 4, md: 8 }, 
            textAlign: 'center',
            borderRadius: 4,
            border: '2px solid #c8e6c9',
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)',
            boxShadow: '0 8px 32px rgba(27, 94, 32, 0.1)'
          }}>
            <Avatar
              sx={{
                bgcolor: '#2e7d32',
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                mx: 'auto',
                mb: 3
              }}
            >
              <ResearchIcon sx={{ fontSize: { xs: 30, md: 40 } }} />
            </Avatar>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                color: '#1b5e20', 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              No Research Projects Found
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#2e7d32', 
                mb: 4, 
                maxWidth: '500px', 
                mx: 'auto',
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              We couldn't find any public health research matching your criteria. 
              Try adjusting your search terms or explore our complete research database.
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'center', 
              flexDirection: { xs: 'column', sm: 'row' },
              px: { xs: 2, sm: 0 }
            }}>
              <Button
                variant="contained"
                onClick={clearFilters}
                size="large"
                fullWidth={isMobile}
                sx={{
                  bgcolor: '#1b5e20',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: '#0d4715'
                  }
                }}
              >
                Clear All Filters
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                size="large"
                fullWidth={isMobile}
                sx={{
                  borderColor: '#2e7d32',
                  color: '#2e7d32',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: '#1b5e20',
                    bgcolor: '#e8f5e9',
                    borderWidth: 2
                  }
                }}
              >
                Back to Home
              </Button>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ProjectsPage;
