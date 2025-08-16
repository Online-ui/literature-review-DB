import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Grid,
  Avatar,
  SwipeableDrawer,
  Backdrop
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Folder as ProjectsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };
  const navigationItems = [
    { label: 'Home', path: '/', icon: HomeIcon },
    { label: 'Projects', path: '/projects', icon: ProjectsIcon },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  // Mobile Drawer
  const drawer = (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      bgcolor: '#fafafa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Mobile Header */}
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        bgcolor: '#2e7d32',
        color: 'white',
        position: 'relative',
        minHeight: { xs: 120, sm: 140 }
      }}>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            position: 'absolute', 
            top: { xs: 8, sm: 12 }, 
            right: { xs: 8, sm: 12 }, 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexDirection: 'column', 
          textAlign: 'center', 
          pt: { xs: 2, sm: 3 }
        }}>
          <Avatar
            src="/images/logo.jpeg"
            alt="School logo"
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              mb: 2,
              borderRadius: 2,
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            SPH
          </Avatar>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            fontSize: { xs: '0.875rem', sm: '1rem' }, 
            mb: 0.5,
            lineHeight: 1.2,
            px: 1
          }}>
            FRED N. BINKA SCHOOL OF PUBLIC HEALTH
          </Typography>
          <Typography variant="caption" sx={{ 
            opacity: 0.9, 
            fontSize: { xs: '0.7rem', sm: '0.75rem' }
          }}>
            Advancing Health Equity
          </Typography>
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <List sx={{ px: { xs: 1.5, sm: 2 }, py: 2, flex: 1 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                handleDrawerToggle();
              }}
              sx={{
                borderRadius: 2,
                mb: { xs: 0.5, sm: 1 },
                bgcolor: isActive ? '#e8f5e8' : 'transparent',
                border: isActive ? '1px solid #2e7d32' : '1px solid transparent',
                minHeight: { xs: 48, sm: 56 },
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
                py: { xs: 1.5, sm: 2 }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: { xs: 36, sm: 40 },
                color: isActive ? '#2e7d32' : '#757575'
              }}>
                <Icon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#2e7d32' : '#424242',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
              {isActive && (
                <Chip 
                  size="small" 
                  label="Active" 
                  sx={{ 
                    bgcolor: '#2e7d32', 
                    color: 'white',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    height: { xs: 18, sm: 20 }
                  }} 
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mx: { xs: 1.5, sm: 2 }, my: 2 }} />

      {/* Quick Contact in Mobile */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
          Quick Contact
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#388e3c' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
              (+233) 555-123-4567
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#388e3c' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
              info@sph.edu
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Info Bar - Hidden on small mobile */}
      {!isExtraSmall && (
        <Box
          sx={{
            bgcolor: '#1b5e20',
            color: 'white',
            py: { xs: 0.3, sm: 0.5 },
            px: 0
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>
                    (555) 123-4567
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.85rem' } }}>
                    info@sph.edu
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                display: { xs: 'none', sm: 'none', md: 'block' }
              }}>
                Welcome to FRED N. BINKA School of Public Health Research Hub  
              </Typography>
            </Box>
          </Container>
        </Box>
      )}

      {/* Main Navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          color: 'text.primary',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="xl" sx={{ px: 0 }}>
          <Toolbar sx={{
            py: { xs: 0.5, sm: 1, md: 1.5 },
            minHeight: { xs: 56, sm: 64, md: 72 },
            px: { xs: 1, sm: 1.5, md: 2, lg: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 }
          }}>
            {/* Logo Section */}
            <Fade in timeout={800}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  maxWidth: { xs: 'calc(100% - 50px)', sm: 'calc(100% - 60px)', md: 'auto' },
                  flex: 1,
                  minWidth: 0
                }}
                onClick={() => navigate('/')}
              >
                <Avatar
                  src="/images/logo.jpeg"
                  alt="School logo"
                  sx={{
                    width: { xs: 36, sm: 44, md: 52, lg: 56 },
                    height: { xs: 36, sm: 44, md: 52, lg: 56 },
                    mr: { xs: 1, sm: 2 },
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '2px solid #e8f5e8',
                    flexShrink: 0
                  }}
                >
                  SPH
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{
                      fontWeight: 700,
                      color: '#2e7d32',
                      lineHeight: 1.1,
                      fontSize: { 
                        xs: isExtraSmall ? '0.75rem' : '0.85rem', 
                        sm: '1rem', 
                        md: '1.2rem', 
                        lg: '1.4rem' 
                      },
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      whiteSpace: { xs: 'normal', sm: 'normal', md: 'nowrap' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: { xs: 'break-word', md: 'normal' }
                    }}
                  >
                    {isExtraSmall 
                      ? 'FRED N. BINKA SPH' 
                      : isSmallMobile 
                        ? 'FRED N. BINKA SCHOOL' 
                        : 'FRED N. BINKA SCHOOL OF PUBLIC HEALTH'
                    }
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#757575',
                      fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                      fontWeight: 500,
                      display: { xs: isExtraSmall ? 'none' : 'block', sm: 'block' },
                      letterSpacing: 0.5
                    }}
                  >
                    Research Hub
                  </Typography>
                </Box>
              </Box>
            </Fade>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Fade key={item.path} in timeout={800 + (index * 100)}>
                      <Button
                        onClick={() => navigate(item.path)}
                        startIcon={<Icon sx={{ fontSize: 20 }} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: isActive ? 600 : 500,
                          px: 2.5,
                          py: 1.2,
                          borderRadius: 2,
                          position: 'relative',
                          color: isActive ? '#2e7d32' : '#424242',
                          bgcolor: isActive ? '#e8f5e8' : 'transparent',
                          border: '1px solid transparent',
                          transition: 'all 0.3s ease',
                          fontSize: '0.95rem',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            color: '#2e7d32',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)'
                          }
                        }}
                      >
                        {item.label}
                      </Button>
                    </Fade>
                  );
                })}
              </Box>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                sx={{
                  color: '#2e7d32',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  p: { xs: 0.5, sm: 0.75 },
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  ml: 1,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    borderColor: '#2e7d32'
                  }
                }}
              >
                <MenuIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        onOpen={() => setMobileOpen(true)}
        disableBackdropTransition={!isMobile}
        disableDiscovery={isMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: { xs: isExtraSmall ? '95%' : '85%', sm: 300 },
            maxWidth: 280,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderBottomLeftRadius: { xs: 16, sm: 0 }
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        {drawer}
      </SwipeableDrawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {children}
      </Box>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000
          }}
        >
          <IconButton
            onClick={scrollToTop}
            sx={{
              bgcolor: '#2e7d32',
              color: 'white',
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
              '&:hover': {
                bgcolor: '#1b5e20',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(46, 125, 50, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowUpIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
        </Box>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'white',
            borderTop: '2px solid #e8f5e9',
            py: { xs: 1, sm: 1.5 },
            px: 2,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 1000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
            minHeight: { xs: 60, sm: 70 }
          }}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <IconButton
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  flexDirection: 'column',
                  gap: 0.5,
                  color: isActive ? '#2e7d32' : '#757575',
                  bgcolor: isActive ? '#e8f5e9' : 'transparent',
                  borderRadius: 2,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.5 },
                  minWidth: { xs: 60, sm: 80 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    color: '#2e7d32'
                  }
                }}
              >
                <Icon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: isActive ? 600 : 500,
                    lineHeight: 1
                  }}
                >
                  {item.label}
                </Typography>
              </IconButton>
            );
          })}
        </Box>
      )}
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#1b5e20',
          color: 'white',
          py: { xs: 4, sm: 5, md: 6 },
          pb: { xs: isMobile ? 10 : 4, sm: isMobile ? 12 : 5, md: 6 },
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            {/* School Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: { xs: 'center', md: 'flex-start' },
                flexDirection: { xs: 'column', md: 'row' },
                textAlign: { xs: 'center', md: 'left' },
                mb: 2 
              }}>
                <Avatar
                  src="/images/logo.jpeg"
                  alt="School logo"
                  sx={{
                    width: { xs: 44, sm: 50, md: 56, lg: 60 },
                    height: { xs: 44, sm: 50, md: 56, lg: 60 },
                    mr: { xs: 0, md: 2 },
                    mb: { xs: 2, md: 0 },
                    borderRadius: 2,
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    SPH
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' },
                    lineHeight: 1.2
                  }}>
                    FRED N. BINKA SCHOOL OF PUBLIC HEALTH
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.8, 
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                  }}>
                    Advancing Health Equity
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ 
                opacity: 0.9, 
                lineHeight: 1.6,
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                textAlign: { xs: 'center', md: 'left' }
              }}>
                Leading institution in public health education, research, and community 
                engagement. Committed to improving population health outcomes worldwide.
              </Typography>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' },
                textAlign: { xs: 'center', md: 'left' }
              }}>
                Quick Links
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 0.5, sm: 1 },
                alignItems: { xs: 'center', md: 'flex-start' }
              }}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/')}
                  sx={{ 
                    justifyContent: { xs: 'center', md: 'flex-start' }, 
                    textTransform: 'none',
                    opacity: 0.9,
                    fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                    py: { xs: 0.5, sm: 1 },
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Home
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/projects')}
                  sx={{ 
                    justifyContent: { xs: 'center', md: 'flex-start' }, 
                    textTransform: 'none',
                    opacity: 0.9,
                    fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                    py: { xs: 0.5, sm: 1 },
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Projects
                </Button>
              </Box>
            </Grid>

            {/* Contact & Mission */}
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' },
                textAlign: { xs: 'center', md: 'left' }
              }}>
                Our Mission
              </Typography>
              <Typography variant="body2" sx={{ 
                opacity: 0.9, 
                mb: { xs: 2, sm: 3 }, 
                lineHeight: 1.6,
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                textAlign: { xs: 'center', md: 'left' }
              }}>
                To advance health equity and improve population health through innovative 
                research, evidence-based education, and meaningful community partnerships.
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: { xs: 0.5, sm: 1 },
                alignItems: { xs: 'center', md: 'flex-start' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: { xs: 14, sm: 16 }, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                    wordBreak: 'break-word'
                  }}>
                    info@schoolofpublichealth.edu
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: { xs: 14, sm: 16 }, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                  }}>
                    (555) 123-4567
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Copyright */}
          <Box 
            sx={{ 
              borderTop: '1px solid rgba(255,255,255,0.2)', 
              mt: { xs: 3, sm: 4 }, 
              pt: { xs: 2, sm: 3 }, 
              textAlign: 'center' 
            }}
          >
            <Typography variant="body2" sx={{ 
              opacity: 0.7,
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.8rem', lg: '0.875rem' },
              px: { xs: 2, md: 0 }
            }}>
              © 2025 FRED N. BINKA SCHOOL OF PUBLIC HEALTH. All rights reserved. | 
              Committed to advancing global health and health equity.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
