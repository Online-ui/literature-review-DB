import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  alpha,
  useTheme,
  Chip,
  Paper,
  Collapse,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleMenuExpand = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const menuItems = [
    { 
      id: 'dashboard',
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard', 
      color: '#0a4f3c' 
    },
    { 
      id: 'projects',
      text: 'Projects', 
      icon: <ArticleIcon />, 
      path: '/projects', 
      color: '#1a7a5e' 
    },
    { 
      id: 'users',
      text: 'Users', 
      icon: <PeopleIcon />, 
      path: '/users', 
      adminOnly: true, 
      color: '#2a9d7f' 
    },
    { 
      id: 'settings',
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings', 
      color: '#3ac0a0' 
    },
  ];

  const sidebarVariants = {
    expanded: {
      width: drawerWidth,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    },
    collapsed: {
      width: collapsedDrawerWidth,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  const drawer = (
    <Box 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(180deg, #0a4f3c 0%, #1a7a5e 50%, #2a9d7f 100%)',
        position: 'relative',
        overflow: 'hidden'
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

      {/* Sidebar Header */}
      <Box
        sx={{
          p: collapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 2
        }}
      >
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="expanded-header"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  width: 48,
                  height: 48
                }}
              >
                <AdminIcon sx={{ color: 'white', fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  Admin Portal
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.75rem'
                  }}
                >
                  Literature Review DB
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-header"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  width: 40,
                  height: 40
                }}
              >
                <AdminIcon sx={{ color: 'white', fontSize: 20 }} />
              </Avatar>
            </motion.div>
          )}
        </AnimatePresence>

        {!isMobile && (
          <IconButton
            onClick={handleDrawerCollapse}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
            size="small"
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}

        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* User Info Card */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ p: 3, position: 'relative', zIndex: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 700,
                      width: 40,
                      height: 40,
                      cursor: 'pointer'
                    }}
                    onClick={handleProfileMenuOpen}
                  >
                    {user?.full_name?.charAt(0) || 'A'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {user?.full_name || 'Admin User'}
                    </Typography>
                    <Chip
                      label={user?.role === 'main_coordinator' ? 'Main Coordinator' : 'Faculty'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20,
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={handleProfileMenuOpen}
                    sx={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    <NotificationsIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Paper>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Menu */}
      <Box sx={{ px: collapsed ? 1 : 2, pb: 2, position: 'relative', zIndex: 2 }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: 1,
                  px: 2,
                  mb: 1,
                  display: 'block'
                }}
              >
                Navigation
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        
        <List sx={{ py: 0 }}>
          <AnimatePresence>
            {menuItems.map((item, index) => {
              // Hide admin-only items for non-admin users
              if (item.adminOnly && user?.role !== 'main_coordinator') {
                return null;
              }

              const isActive = location.pathname === item.path;
              
              return (
                <motion.div
                  key={item.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={menuItemVariants}
                >
                  <ListItem sx={{ px: collapsed ? 0.5 : 1, py: 0.5 }}>
                    <Tooltip 
                      title={collapsed ? item.text : ''} 
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        selected={isActive}
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                          borderRadius: collapsed ? 2 : 3,
                          mb: 0.5,
                          py: collapsed ? 1.5 : 1.5,
                          px: collapsed ? 1.5 : 2,
                          minHeight: collapsed ? 48 : 56,
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)',
                            transform: collapsed ? 'scale(1.1)' : 'translateX(4px)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.2)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                            '& .MuiListItemText-primary': {
                              color: 'white',
                              fontWeight: 600
                            }
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40 }}>
                                                    <Box
                            sx={{
                              width: collapsed ? 24 : 32,
                              height: collapsed ? 24 : 32,
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              sx: { 
                                fontSize: collapsed ? 20 : 20, 
                                color: isActive ? 'white' : 'rgba(255,255,255,0.8)' 
                              }
                            })}
                          </Box>
                        </ListItemIcon>
                        
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.div
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <ListItemText 
                                primary={item.text}
                                primaryTypographyProps={{
                                  fontSize: '0.9rem',
                                  fontWeight: isActive ? 600 : 500,
                                  color: isActive ? 'white' : 'rgba(255,255,255,0.9)'
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </List>
      </Box>

      {/* Bottom Actions */}
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          p: collapsed ? 1 : 2,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          zIndex: 2
        }}
      >
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Profile Settings">
                  <IconButton
                    onClick={() => navigate('/profile')}
                    sx={{
                      flex: 1,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    <AccountIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout">
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      flex: 1,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(244,67,54,0.2)'
                      }
                    }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Profile Settings" placement="right">
                  <IconButton
                    onClick={() => navigate('/profile')}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)'
                      }
                    }}
                    size="small"
                  >
                    <AccountIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Logout" placement="right">
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(244,67,54,0.2)'
                      }
                    }}
                    size="small"
                  >
                    <LogoutIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 2,
          }}
        >
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              bgcolor: '#0a4f3c',
              color: 'white',
              boxShadow: '0 4px 12px rgba(10,79,60,0.3)',
              '&:hover': {
                bgcolor: '#063d2f',
                boxShadow: '0 6px 16px rgba(10,79,60,0.4)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ 
          width: { lg: collapsed ? collapsedDrawerWidth : drawerWidth }, 
          flexShrink: { lg: 0 } 
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: collapsed ? collapsedDrawerWidth : drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f8f9fa',
          minHeight: '100vh',
          width: { 
            lg: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` 
          },
          ml: { xs: 0, lg: 0 },
          pt: { xs: 10, lg: 0 }, // Add top padding for mobile menu button
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ padding: '24px', minHeight: '100vh' }}
        >
          <Outlet />
        </motion.div>
      </Box>

      {/* Enhanced Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            borderRadius: 3,
            minWidth: 220,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#0a4f3c',
                width: 48,
                height: 48,
                fontSize: '1.2rem',
                fontWeight: 700
              }}
            >
              {user?.full_name?.charAt(0) || 'A'}
            </Avatar>
            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#0a4f3c',
                  lineHeight: 1.2
                }}
              >
                {user?.full_name || 'Admin User'}
              </Typography>
              <Chip
                label={user?.role === 'main_coordinator' ? 'Main Coordinator' : 'Faculty'}
                size="small"
                sx={{
                  bgcolor: alpha('#0a4f3c', 0.1),
                  color: '#0a4f3c',
                  fontSize: '0.7rem',
                  height: 22,
                  fontWeight: 600,
                  mt: 0.5
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Menu Items */}
        <Box sx={{ py: 1 }}>
          <MenuItem 
            onClick={() => {
              navigate('/profile');
              handleProfileMenuClose();
            }}
            sx={{
              py: 1.5,
              px: 3,
              '&:hover': {
                bgcolor: alpha('#0a4f3c', 0.05)
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: alpha('#0a4f3c', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AccountIcon sx={{ fontSize: 18, color: '#0a4f3c' }} />
              </Box>
            </ListItemIcon>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                Profile Settings
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage your account
              </Typography>
            </Box>
          </MenuItem>

          <Divider sx={{ my: 1, mx: 2 }} />

          <MenuItem 
            onClick={handleLogout}
            sx={{
              py: 1.5,
              px: 3,
              '&:hover': {
                bgcolor: alpha('#f44336', 0.05)
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: alpha('#f44336', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: '#f44336' }} />
              </Box>
            </ListItemIcon>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f44336' }}>
                Sign Out
              </Typography>
              <Typography variant="caption" color="text.secondary">
                End your session
              </Typography>
            </Box>
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
};

export default Layout;