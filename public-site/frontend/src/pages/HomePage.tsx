import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  Paper,
  Avatar,
  Fade,
  Slide,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  LocalHospital as HealthIcon,
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
  ArrowForward as ArrowIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Public as PublicIcon,
  Science as ResearchIcon,
  EmojiObjects as InnovationIcon,
  Favorite as HeartIcon,
  Groups as CommunityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ProjectSummary, SiteStats } from '../types';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProjects, setFeaturedProjects] = useState<ProjectSummary[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Add homepage structured data
    const homepageSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "School of Public Health",
      "url": window.location.origin,
      "description": "Leading institution in public health education, research, and community engagement. Advancing health equity and improving population health outcomes worldwide.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${window.location.origin}/projects?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "School of Public Health",
        "url": window.location.origin
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(homepageSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, statsData] = await Promise.all([
        apiService.getFeaturedProjects(),
        apiService.getSiteStats()
      ]);
      
      setFeaturedProjects(projectsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setFeaturedProjects([]);
      setStats({
        total_projects: 0,
        total_institutions: 0,
        total_research_areas: 0,
        total_downloads: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/projects');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <SEOHead 
        title="School of Public Health - Advancing Health Equity and Population Health"
        description="Leading institution in public health education, research, and community engagement. Discover our programs, research initiatives, and commitment to improving global health outcomes."
        keywords="public health, health equity, population health, epidemiology, health policy, global health, community health, public health education, health research"
        type="website"
      />
      
      {/* Modern Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0d4715 100%, #1a7a5e 50%, #2a9d7f 100%)',
        }}
      >
        {/* Animated Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                    color: 'white',
                    mb: 3,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Transforming Public Health
                  <Box component="span" sx={{ color: '#a7ffeb' }}> Together</Box>
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: { xs: '1.1rem', md: '1.4rem' },
                    lineHeight: 1.6,
                    fontWeight: 300
                  }}
                >
                  Leading the way in health equity, innovative research, and community-driven solutions 
                  for a healthier tomorrow.
                </Typography>

                {/* Modern Search Bar */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    maxWidth: 600,
                    borderRadius: '50px',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    mb: 4
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Discover research, programs, and more..."
                    variant="standard"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    InputProps={{
                      disableUnderline: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#0a4f3c', ml: 2 }} />
                        </InputAdornment>
                      ),
                      sx: { px: 2, py: 1 }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    sx={{
                      borderRadius: '50px',
                      px: 4,
                      py: 1.5,
                      mr: 0.5,
                      bgcolor: '#0a4f3c',
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#063d2f',
                        boxShadow: '0 4px 20px rgba(10,79,60,0.3)'
                      }
                    }}
                  >
                    Search
                  </Button>
                </Paper>

                {/* Quick Stats */}
                <Grid container spacing={3}>
                  {[
                    { number: '11+', label: 'Years of Excellence' },
                    { number: '10K+', label: 'Alumni Worldwide' },
                    
                  ].map((stat, index) => (
                    <Grid item xs={4} key={index}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ color: '#a7ffeb', fontWeight: 700 }}>
                            {stat.number}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              
              {/* Hero Illustration */}
              <Grid item xs={12} md={5}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: { xs: 300, md: 500 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Animated circles representing global health impact */}
                    <Box
                      component={motion.div}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      sx={{
                        position: 'absolute',
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Box
                      component={motion.div}
                      animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                      sx={{
                        position: 'absolute',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.4)',
                      }}
                    />
                    <PublicIcon sx={{ fontSize: 120, color: 'rgba(255,255,255,0.9)' }} />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </motion.div>
        </Container>

        {/* Scroll Indicator */}
        <Box
          component={motion.div}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          sx={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            opacity: 0.7
          }}
        >
          <Typography variant="caption">Scroll to explore</Typography>
        </Box>
      </Box>

      {/* Modern Stats Section */}
<Container maxWidth="lg" sx={{ py: 10, mt: -10, position: 'relative', zIndex: 10 }}>
  <Grid container spacing={3}>
    {[
      { 
        icon: ResearchIcon, 
        number: stats?.total_projects || 75, 
        label: 'Active Research Projects',
        color: '#0a4f3c',
        gradient: 'linear-gradient(135deg, #0a4f3c 0%, #1a7a5e 100%)'
      },
      { 
        icon: SchoolIcon, 
        number: stats?.total_institutions || 4, 
        label: 'Academic Departments',
        color: '#1a7a5e',
        gradient: 'linear-gradient(135deg, #1a7a5e 0%, #2a9d7f 100%)'
      },
      { 
        icon: PeopleIcon, 
        number: stats?.total_research_areas || 2500, 
        label: 'Students & Alumni',
        color: '#2a9d7f',
        gradient: 'linear-gradient(135deg, #2a9d7f 0%, #3ac0a0 100%)'
      },
      { 
        icon: PublicIcon, 
        number: stats?.total_downloads || 20, 
        label: 'Expert Faculty',
        color: '#3ac0a0',
        gradient: 'linear-gradient(135deg, #3ac0a0 0%, #4ae3c1 100%)'
      }
    ].map((stat, index) => (
      <Grid item xs={6} md={3} key={index}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
        >
          <Card
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              background: 'white',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(0,0,0,0.08)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                '& .stat-icon': {
                  transform: 'scale(1.1) rotate(5deg)'
                }
              }
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: stat.gradient,
                opacity: 0.1
              }}
            />
            <Box sx={{ position: 'relative', textAlign: 'center' }}>
              <Box
                className="stat-icon"
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: 3,
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <stat.icon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: stat.color,
                  mb: 0.5,
                  fontSize: '2.5rem'
                }}
              >
                {loading ? (
                  <Skeleton width={80} sx={{ mx: 'auto' }} />
                ) : (
                  `${stat.number.toLocaleString()}${stat.number >= 1000 ? '+' : ''}`
                )}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {stat.label}
              </Typography>
            </Box>
          </Card>
        </motion.div>
      </Grid>
    ))}
  </Grid>
</Container>

      {/* Modern Dean's Message Section */}
      <Box sx={{ bgcolor: 'white', py: 10 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box sx={{ position: 'relative' }}>
                  <Box
                    sx={{
                      width: { xs: 250, md: 350 },
                      height: { xs: 250, md: 350 },
                      mx: 'auto',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -20,
                        left: -20,
                        right: 20,
                        bottom: 20,
                        background: 'linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%)',
                        borderRadius: '50%',
                        opacity: 0.1
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src="/images/dean.jpeg"
                      alt="Dean of School of Public Health"
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      Prof. Frank Baiden
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      Dean, School of Public Health
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Typography
                  variant="overline"
                  sx={{
                    color: '#2a9d7f',
                    fontWeight: 600,
                    letterSpacing: 2,
                    mb: 2,
                    display: 'block'
                  }}
                >
                  MESSAGE FROM THE DEAN
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#0a4f3c',
                    mb: 3,
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  Building a Healthier Future Together
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    mb: 3,
                    fontSize: '1.1rem'
                  }}
                >
                  Welcome to our School of Public Health, where innovation meets compassion. 
                  We are dedicated to training the next generation of public health leaders 
                  who will tackle the world's most pressing health challenges with evidence-based 
                  solutions and unwavering commitment to equity.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    mb: 4,
                    fontSize: '1.1rem'
                  }}
                >
                  Our interdisciplinary approach, cutting-edge research facilities, and global 
                  partnerships position us at the forefront of public health education and practice. 
                  Join us in our mission to create healthier, more equitable communities worldwide.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowIcon />}
                  component="a"
                  href="https://uhas.edu.gh/uhas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#0a4f3c',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#063d2f',
                      boxShadow: '0 10px 30px rgba(10,79,60,0.2)'
                    }
                  }}
                >
                  Learn More About Us
                </Button>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Featured Research Section - Modern Card Design */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#2a9d7f',
                fontWeight: 600,
                letterSpacing: 2,
                mb: 2,
                display: 'block'
              }}
            >
              RESEARCH EXCELLENCE
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#0a4f3c',
                mb: 2
              }}
            >
              Featured Research Projects
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Discover groundbreaking research that's shaping the future of public health
            </Typography>
          </Box>

          {loading ? (
            <Grid container spacing={4}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={4} key={item}>
                  <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
                </Grid>
              ))}
            </Grid>
          ) : featuredProjects.length > 0 ? (
            <Grid container spacing={4}>
              {featuredProjects.slice(0, 6).map((project, index) => (
                <Grid item xs={12} md={6} lg={4} key={project.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.08)',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                          '& .project-image': {
                            transform: 'scale(1.05)'
                          }
                        }
                      }}
                      onClick={() => navigate(`/projects/${project.slug}`)}
                    >
                      {/* Project Image/Gradient Header */}
                      <Box
                        className="project-image"
                        sx={{
                          height: 200,
                          background: `linear-gradient(135deg, ${
                            ['#0a4f3c', '#1a7a5e', '#2a9d7f'][index % 3]
                          } 0%, ${
                            ['#1a7a5e', '#2a9d7f', '#3ac0a0'][index % 3]
                          } 100%)`,
                          position: 'relative',
                          transition: 'transform 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ResearchIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)' }} />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: 'rgba(255,255,255,0.9)',
                            borderRadius: 2,
                            px: 2,
                            py: 0.5
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                            {project.research_area || 'Research'}
                          </Typography>
                        </Box>
                      </Box>

                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: '#0a4f3c',
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {project.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            mb: 3,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.6
                          }}
                        >
                          {project.abstract || 'No abstract available'}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          {project.degree_type && (
                            <Chip
                              label={project.degree_type}
                              size="small"
                              sx={{
                                mr: 1,
                                bgcolor: 'rgba(42,157,127,0.1)',
                                color: '#2a9d7f',
                                fontWeight: 600,
                                border: 'none'
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {project.author_name} • {project.institution}
                          </Typography>
                        </Box>
                      </CardContent>

                      <CardActions sx={{ p: 3, pt: 0, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ViewIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {project.view_count || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DownloadIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {project.download_count || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ flexGrow: 1 }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#2a9d7f',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            View Details
                            <ArrowIcon sx={{ fontSize: 16 }} />
                          </Typography>
                        </Box>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                No featured projects available
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Research projects will appear here once they are published
              </Typography>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Button
              onClick={() => navigate('/projects')}
              variant="outlined"
              size="large"
              endIcon={<ArrowIcon />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#0a4f3c',
                color: '#0a4f3c',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#063d2f',
                  bgcolor: 'rgba(10,79,60,0.04)'
                }
              }}
            >
              Explore All Research
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Modern Features Grid */}
      <Box sx={{ bgcolor: 'white', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{
                color: '#2a9d7f',
                fontWeight: 600,
                letterSpacing: 2,
                mb: 2,
                display: 'block'
              }}
            >
              WHY CHOOSE US
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#0a4f3c',
                mb: 2
              }}
            >
              Excellence in Public Health Education
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                maxWidth: 600,
                mx: 'auto'
              }}
            >
              Our comprehensive approach combines cutting-edge research, practical experience, 
              and global perspectives
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: PublicIcon,
                title: 'Global Impact',
                description: 'Our research and programs reach communities across 6 continents, addressing health challenges at local and global scales.',
                color: '#0a4f3c'
              },
              {
                icon: InnovationIcon,
                title: 'Innovation Hub',
                description: 'State-of-the-art facilities and interdisciplinary collaboration foster breakthrough discoveries in public health.',
                color: '#1a7a5e'
              },
              {
                icon: CommunityIcon,
                title: 'Community Partnership',
                description: 'Deep engagement with communities ensures our work addresses real-world needs and creates lasting impact.',
                color: '#2a9d7f'
              },
              {
                icon: HeartIcon,
                title: 'Health Equity',
                description: 'Committed to eliminating health disparities and ensuring equitable access to health resources for all populations.',
                color: '#0a4f3c'
              },
              {
                icon: ResearchIcon,
                title: 'Research Excellence',
                description: 'Leading groundbreaking studies that shape health policy and practice worldwide, with over $100M in research funding.',
                color: '#1a7a5e'
              },
              {
                icon: TrendingIcon,
                title: 'Career Growth',
                description: '95% of our graduates secure positions in top health organizations within 6 months of graduation.',
                color: '#2a9d7f'
              }
            ].map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box
                    sx={{
                      p: 4,
                      height: '100%',
                      borderRadius: 4,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#f8f9fa',
                        transform: 'translateY(-4px)',
                        '& .feature-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                          bgcolor: feature.color
                        }
                      }
                    }}
                  >
                    <Box
                      className="feature-icon"
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: 3,
                        bgcolor: '#f0f7f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <feature.icon sx={{ fontSize: 32, color: feature.color }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#0a4f3c',
                        mb: 2
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.7
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      </Box>
  );
};

export default HomePage;