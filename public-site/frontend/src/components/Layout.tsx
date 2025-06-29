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
  Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Folder as ProjectsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = [
    { label: 'Home', path: '/', icon: HomeIcon },
    { label: 'Projects', path: '/projects', icon: ProjectsIcon },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  // Mobile Drawer
  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: '#fafafa' }}>
      {/* Mobile Header */}
      <Box sx={{ 
        p: 3, 
        bgcolor: '#2e7d32',
        color: 'white',
        position: 'relative'
      }}>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src="/images/logo.jpeg"
            alt="School logo"
            sx={{
              width: 50,
              height: 50,
              mr: 2,
              borderRadius: 2,
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            SPH
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              FRED N. BINKA SCHOOL OF PUBLIC HEALTH
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
              Advancing Health Equity
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <List sx={{ px: 2, py: 3 }}>
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
                mb: 1,
                bgcolor: isActive ? '#e8f5e8' : 'transparent',
                border: isActive ? '1px solid #2e7d32' : '1px solid transparent',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: isActive ? '#2e7d32' : '#757575'
              }}>
                <Icon />
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#2e7d32' : '#424242'
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
                    fontSize: '0.7rem',
                    height: 20
                  }} 
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mx: 2, my: 2 }} />

      {/* Quick Contact in Mobile */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
          Quick Contact
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon sx={{ fontSize: 16, color: '#388e3c' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              (+233) 555-123-4567
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: 16, color: '#388e3c' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              info@sph.edu
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Info Bar */}
      <Box
        sx={{
          bgcolor: '#1b5e20',
          color: 'white',
          py: 1,
          px: 0
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  info@sph.edu
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'right', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                Welcome to FRED N. BINKA School of Public Health Research Hub  
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

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
  {/* By setting maxWidth={false}, the container will expand to the full viewport width.
  */}
  <Container maxWidth={false} sx={{ px: 0 }}>
    <Toolbar sx={{
      py: { xs: 1, md: 1.5 },
      minHeight: { xs: 64, md: 72 },
      px: { xs: 2, sm: 3 }, // This padding keeps content from touching the screen edges
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center' // Corrected: CSS value 'left' is invalid for alignItems
    }}>
      {/* Logo Section - Will now be on the extreme left */}
      <Fade in timeout={800}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center', // Corrected: For proper vertical alignment
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
          onClick={() => navigate('/')}
        >
          <Avatar
            src="/images/logo.jpeg"
            alt="School logo"
            sx={{
              width: { xs: 48, md: 56 },
              height: { xs: 48, md: 56 },
              mr: 2,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '2px solid #e8f5e8'
            }}
          >
            SPH
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                color: '#2e7d32',
                lineHeight: 1.1,
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              FRED N. BINKA SCHOOL OF PUBLIC HEALTH
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#757575',
                fontSize: '0.8rem',
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' },
                letterSpacing: 0.5
              }}
            >
              Research Hub
            </Typography>
          </Box>
        </Box>
      </Fade>

      {/* Desktop Navigation - Will now be on the extreme right */}
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

      {/* Mobile Menu Button - Will now be on the extreme right */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: '#2e7d32',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 1,
            '&:hover': {
              bgcolor: '#f5f5f5',
              borderColor: '#2e7d32'
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
    </Toolbar>
  </Container>
</AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#1b5e20',
          color: 'white',
          py: 6,
          mt: 'auto'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* School Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'left', mb: 2 }}>
                {/* School Logo */}
                <Avatar
                  src="/images/logo.jpeg"
                  alt="School logo"
                  sx={{
                    width: 60,
                    height: 60,
                    mr: 2,
                    borderRadius: 2,
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    SPH
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    FRED N. BINKA SCHOOL OF PUBLIC HEALTH
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Advancing Health Equity
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                Leading institution in public health education, research, and community 
                engagement. Committed to improving population health outcomes worldwide.
              </Typography>
            </Grid>

            {/* Quick Links */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/')}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    opacity: 0.9,
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Home
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/projects')}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    opacity: 0.9,
                    '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Projects
                </Button>
              </Box>
            </Grid>

            {/* Contact & Mission */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Our Mission
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 3, lineHeight: 1.6 }}>
                To advance health equity and improve population health through innovative 
                research, evidence-based education, and meaningful community partnerships.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    info@schoolofpublichealth.edu
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
              mt: 4, 
              pt: 3, 
              textAlign: 'center' 
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
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