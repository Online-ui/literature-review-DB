import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  LinearProgress,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  ArrowUpward as ArrowUpIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { adminApi } from '../services/api';
import { DashboardStats } from '../types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  subtitle?: string;
  trend?: number;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  gradient, 
  subtitle, 
  trend,
  index 
}) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card
        elevation={0}
        sx={{
          height: '100%',
          background: 'white',
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(color, 0.1),
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 40px ${alpha(color, 0.15)}`,
            '& .stat-icon': {
              transform: 'scale(1.1) rotate(5deg)'
            }
          }
        }}
      >
        {/* Background gradient accent */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 120,
            height: 120,
            background: gradient,
            opacity: 0.05,
            borderRadius: '50%',
            transform: 'translate(30px, -30px)'
          }}
        />
        
        <CardContent sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box
              className="stat-icon"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                boxShadow: `0 8px 24px ${alpha(color, 0.25)}`
              }}
            >
              {React.cloneElement(icon as React.ReactElement, {
                sx: { color: 'white', fontSize: 28 }
              })}
            </Box>
            
            {trend && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: trend > 0 ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                  color: trend > 0 ? '#4caf50' : '#f44336'
                }}
              >
                <ArrowUpIcon 
                  sx={{ 
                    fontSize: 16,
                    transform: trend < 0 ? 'rotate(180deg)' : 'none'
                  }} 
                />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: color,
              mb: 0.5,
              fontSize: '2.2rem',
              lineHeight: 1.2
            }}
          >
            {value.toLocaleString()}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              mb: subtitle ? 0.5 : 0,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        gap: 2
      }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          borderRadius: 3,
          '& .MuiAlert-icon': {
            fontSize: 24
          }
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        No dashboard data available
      </Alert>
    );
  }

  const statCards = [
    {
      title: "Total Projects",
      value: stats.total_projects,
      icon: <ArticleIcon />,
      color: "#0a4f3c",
      gradient: "linear-gradient(135deg, #0a4f3c 0%, #1a7a5e 100%)",
      subtitle: `${stats.published_projects} published`,
      trend: 12
    },
    {
      title: "Active Users",
      value: stats.total_users,
      icon: <PeopleIcon />,
      color: "#1a7a5e",
      gradient: "linear-gradient(135deg, #1a7a5e 0%, #2a9d7f 100%)",
      subtitle: `${stats.active_users} this month`,
      trend: 8
    },
    {
      title: "Total Views",
      value: stats.total_views,
      icon: <VisibilityIcon />,
      color: "#2a9d7f",
      gradient: "linear-gradient(135deg, #2a9d7f 0%, #3ac0a0 100%)",
      trend: 15
    },
    {
      title: "Downloads",
      value: stats.total_downloads,
      icon: <DownloadIcon />,
      color: "#3ac0a0",
      gradient: "linear-gradient(135deg, #3ac0a0 0%, #4ae3c1 100%)",
      trend: 23
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              color: '#0a4f3c',
              mb: 1,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Dashboard Overview
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '1.1rem',
              maxWidth: 600
            }}
          >
            Monitor your Projects database performance and track key metrics
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard {...stat} index={index} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Projects */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: '#0a4f3c',
                        width: 48,
                        height: 48
                      }}
                    >
                      <TimelineIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                        Recent Projects
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Latest submissions and updates
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>

              <CardContent sx={{ p: 0 }}>
                {stats.recent_projects.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {stats.recent_projects.map((project, index) => (
                      <ListItem
                        key={project.id}
                        sx={{
                          py: 2.5,
                          px: 3,
                          borderBottom: index < stats.recent_projects.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                          '&:hover': {
                            bgcolor: 'rgba(10,79,60,0.02)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Avatar
                            sx={{
                              bgcolor: project.is_published ? '#4caf50' : '#ff9800',
                              width: 40,
                              height: 40
                            }}
                          >
                            <ArticleIcon sx={{ fontSize: 20 }} />
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                color: '#0a4f3c',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {project.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant="body2" color="text.secondary">
                                by {project.author_name}
                              </Typography>
                              <Chip
                                label={project.is_published ? 'Published' : 'Draft'}
                                size="small"
                                sx={{
                                  bgcolor: project.is_published ? alpha('#4caf50', 0.1) : alpha('#ff9800', 0.1),
                                  color: project.is_published ? '#4caf50' : '#ff9800',
                                  fontWeight: 600,
                                  border: 'none'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(project.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" variant="body1">
                      No recent projects available
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Research Areas */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                height: 'fit-content'
              }}
            >
              <Box
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#2a9d7f',
                      width: 48,
                                            height: 48
                    }}
                  >
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      Research Areas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distribution by field
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 0 }}>
                {stats.research_areas.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {stats.research_areas.slice(0, 6).map((area, index) => {
                      const maxCount = Math.max(...stats.research_areas.map(a => a.count));
                      const percentage = (area.count / maxCount) * 100;
                      
                      return (
                        <ListItem
                          key={index}
                          sx={{
                            py: 2,
                            px: 3,
                            borderBottom: index < Math.min(stats.research_areas.length, 6) - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(42,157,127,0.02)'
                            }
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#0a4f3c',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '70%'
                                }}
                              >
                                {area.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: '#2a9d7f'
                                }}
                              >
                                {area.count}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha('#2a9d7f', 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  background: 'linear-gradient(90deg, #2a9d7f 0%, #3ac0a0 100%)'
                                }
                              }}
                            />
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" variant="body1">
                      No research areas data
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;