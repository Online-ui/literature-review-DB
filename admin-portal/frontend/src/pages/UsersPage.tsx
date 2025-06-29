import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Grid,
  alpha,
  useTheme,
  InputAdornment,
  Skeleton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  institution: string;
  department: string;
  phone: string;
  role: string;
  password?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    full_name: '',
    institution: '',
    department: '',
    phone: '',
    role: 'faculty',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        institution: user.institution || '',
        department: user.department || '',
        phone: user.phone || '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        institution: '',
        department: '',
        phone: '',
        role: 'faculty',
        password: ''
      });
    }
    setFormError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormError('');
    setShowPassword(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminApi.deleteUser(userId);
        await loadUsers();
        setError('');
      } catch (err: any) {
        console.error('Delete user error:', err);
        let errorMessage = 'Failed to delete user';
        
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await adminApi.toggleUserStatus(userId);
      await loadUsers();
      setError('');
    } catch (err: any) {
      console.error('Toggle status error:', err);
      let errorMessage = 'Failed to toggle user status';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    setSubmitting(true);

    // Client-side validation
    if (!formData.full_name.trim()) {
      setFormError('Full name is required');
      setSubmitting(false);
      return;
    }

    if (!formData.username.trim()) {
      setFormError('Username is required');
      setSubmitting(false);
      return;
    }

    if (formData.username.length < 3) {
      setFormError('Username must be at least 3 characters long');
      setSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Email is required');
      setSubmitting(false);
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setFormError('Password must be at least 6 characters long');
      setSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await adminApi.updateUser(editingUser.id, updateData);
      } else {
        const userData = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          institution: formData.institution.trim() || null,
          department: formData.department.trim() || null,
          phone: formData.phone.trim() || null,
          role: formData.role,
          password: formData.password
        };
        
        await adminApi.createUser(userData);
      }
      
      await loadUsers();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating user:', err);
      
      let errorMessage = 'Failed to save user';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.is_active.toString() === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    coordinators: users.filter(u => u.role === 'main_coordinator').length,
    faculty: users.filter(u => u.role === 'faculty').length
  };

  if (currentUser?.role !== 'main_coordinator') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Alert 
          severity="error"
          sx={{
            borderRadius: 4,
            '& .MuiAlert-icon': { fontSize: 32 }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Access Denied
          </Typography>
          Only main coordinators can manage users. Please contact your administrator for access.
        </Alert>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  color: '#0a4f3c',
                  mb: 1,
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                User Management
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '1.1rem'
                }}
              >
                Manage user accounts, roles, and permissions
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%)',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(10,79,60,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #063d2f 0%, #1a7a5e 100%)',
                  boxShadow: '0 12px 32px rgba(10,79,60,0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Add New User
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { 
                title: 'Total Users', 
                value: stats.total, 
                icon: PeopleIcon, 
                color: '#0a4f3c',
                gradient: 'linear-gradient(135deg, #0a4f3c 0%, #1a7a5e 100%)'
              },
              { 
                title: 'Active Users', 
                value: stats.active, 
                icon: PersonIcon, 
                color: '#1a7a5e',
                gradient: 'linear-gradient(135deg, #1a7a5e 0%, #2a9d7f 100%)'
              },
              { 
                title: 'Coordinators', 
                value: stats.coordinators, 
                icon: AdminIcon, 
                color: '#2a9d7f',
                gradient: 'linear-gradient(135deg, #2a9d7f 0%, #3ac0a0 100%)'
              },
              { 
                title: 'Faculty Members', 
                value: stats.faculty, 
                icon: SchoolIcon, 
                color: '#3ac0a0',
                gradient: 'linear-gradient(135deg, #3ac0a0 0%, #4ae3c1 100%)'
              }
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      background: 'white',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: alpha(stat.color, 0.1),
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 24px ${alpha(stat.color, 0.15)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color, mb: 0.5 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {stat.title}
                          </Typography>
                        </Box>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            background: stat.gradient,
                            boxShadow: `0 8px 16px ${alpha(stat.color, 0.3)}`
                          }}
                        >
                          <stat.icon sx={{ color: 'white', fontSize: 24 }} />
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card
          elevation={0}
          sx={{
                        mb: 4,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#0a4f3c', width: 40, height: 40 }}>
                <FilterIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                  Search & Filter Users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Find and filter users by name, role, or status
                </Typography>
              </Box>
            </Box>
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#0a4f3c' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      '&:hover fieldset': {
                        borderColor: '#2a9d7f',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0a4f3c',
                      },
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0a4f3c',
                      },
                    }}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="main_coordinator">Main Coordinator</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0a4f3c',
                      },
                    }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('');
                    setStatusFilter('');
                  }}
                  sx={{
                    borderRadius: 3,
                    borderColor: '#0a4f3c',
                    color: '#0a4f3c',
                    '&:hover': {
                      borderColor: '#063d2f',
                      bgcolor: alpha('#0a4f3c', 0.04)
                    }
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                '& .MuiAlert-icon': { fontSize: 24 }
              }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#0a4f3c' }}>User Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0a4f3c' }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0a4f3c' }}>Institution</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0a4f3c' }}>Role & Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0a4f3c' }}>Created</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#0a4f3c' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      component={motion.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha('#0a4f3c', 0.02)
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: user.role === 'main_coordinator' ? '#0a4f3c' : '#2a9d7f',
                              width: 48,
                              height: 48,
                              fontWeight: 700
                            }}
                          >
                            {user.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600, 
                                color: '#0a4f3c',
                                mb: 0.5
                              }}
                            >
                              {user.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 16, color: '#0a4f3c' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.email}
                            </Typography>
                          </Box>
                          {user.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {user.phone}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          {user.institution && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <SchoolIcon sx={{ fontSize: 16, color: '#0a4f3c' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {user.institution}
                              </Typography>
                            </Box>
                          )}
                          {user.department && (
                            <Typography variant="caption" color="text.secondary">
                              {user.department}
                            </Typography>
                          )}
                          {!user.institution && !user.department && (
                            <Typography variant="body2" color="text.secondary">
                              Not specified
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Chip
                            icon={user.role === 'main_coordinator' ? <AdminIcon /> : <PersonIcon />}
                            label={user.role === 'main_coordinator' ? 'Main Coordinator' : 'Faculty'}
                            size="small"
                            sx={{
                              bgcolor: user.role === 'main_coordinator' ? alpha('#0a4f3c', 0.1) : alpha('#2a9d7f', 0.1),
                              color: user.role === 'main_coordinator' ? '#0a4f3c' : '#2a9d7f',
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: user.role === 'main_coordinator' ? '#0a4f3c' : '#2a9d7f'
                              }
                            }}
                          />
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              bgcolor: user.is_active ? alpha('#4caf50', 0.1) : alpha('#f44336', 0.1),
                              color: user.is_active ? '#4caf50' : '#f44336',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(user)}
                              sx={{
                                bgcolor: alpha('#0a4f3c', 0.1),
                                color: '#0a4f3c',
                                '&:hover': {
                                  bgcolor: alpha('#0a4f3c', 0.2)
                                }
                              }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(user.id)}
                              disabled={user.id === currentUser?.id}
                              sx={{
                                bgcolor: alpha('#2a9d7f', 0.1),
                                color: '#2a9d7f',
                                '&:hover': {
                                  bgcolor: alpha('#2a9d7f', 0.2)
                                },
                                '&:disabled': {
                                  bgcolor: alpha('#ccc', 0.1),
                                  color: '#ccc'
                                }
                              }}
                            >
                              {user.is_active ? 
                                <ToggleOnIcon sx={{ fontSize: 18 }} /> : 
                                <ToggleOffIcon sx={{ fontSize: 18 }} />
                              }
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.id}
                              sx={{
                                bgcolor: alpha('#f44336', 0.1),
                                color: '#f44336',
                                '&:hover': {
                                  bgcolor: alpha('#f44336', 0.2)
                                },
                                '&:disabled': {
                                  bgcolor: alpha('#ccc', 0.1),
                                  color: '#ccc'
                                }
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>

          {filteredUsers.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: alpha('#0a4f3c', 0.1),
                  mx: 'auto',
                  mb: 3
                }}
              >
                <PeopleIcon sx={{ fontSize: 40, color: '#0a4f3c' }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: '#0a4f3c', mb: 1, fontWeight: 600 }}>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || roleFilter || statusFilter ? 
                  'Try adjusting your search criteria' : 
                  'Create your first user to get started'
                }
              </Typography>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    borderRadius: 3,
                    bgcolor: '#0a4f3c',
                    '&:hover': { bgcolor: '#063d2f' }
                  }}
                >
                  Add First User
                </Button>
                              )}
            </Box>
          )}
        </Card>
      </motion.div>

      {/* Enhanced User Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: editingUser ? '#1a7a5e' : '#0a4f3c',
                  width: 48,
                  height: 48
                }}
              >
                {editingUser ? <EditIcon /> : <PersonAddIcon />}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingUser ? 'Update user information and settings' : 'Create a new user account'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3 }}>
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    borderRadius: 3,
                    '& .MuiAlert-icon': { fontSize: 24 }
                  }}
                >
                  {formError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Box sx={{ mt: 2 }}>
            {/* Basic Information Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#f8f9fa'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c', mb: 2 }}>
                Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    autoFocus
                    label="Full Name"
                    fullWidth
                    variant="outlined"
                    value={formData.full_name}
                    onChange={handleInputChange('full_name')}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Username"
                    fullWidth
                    variant="outlined"
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    required
                    disabled={!!editingUser}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: editingUser ? 'text.secondary' : '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText={editingUser ? "Username cannot be changed" : "Minimum 3 characters"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        bgcolor: editingUser ? alpha('#000', 0.02) : 'transparent',
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
                
                {!editingUser && (
                  <Grid item xs={12}>
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      variant="outlined"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon sx={{ color: '#0a4f3c' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      helperText="Minimum 6 characters"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          '&.Mui-focused fieldset': {
                            borderColor: '#0a4f3c',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#0a4f3c',
                        },
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Institution Information Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#f8f9fa'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c', mb: 2 }}>
                Institution Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Institution"
                    fullWidth
                    variant="outlined"
                    value={formData.institution}
                    onChange={handleInputChange('institution')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon sx={{ color: '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Department"
                    fullWidth
                    variant="outlined"
                    value={formData.department}
                    onChange={handleInputChange('department')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon sx={{ color: '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    variant="outlined"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: '#0a4f3c' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        '&.Mui-focused fieldset': {
                          borderColor: '#0a4f3c',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a4f3c',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Role & Permissions Section */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#f8f9fa'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c', mb: 2 }}>
                Role & Permissions
              </Typography>
              <FormControl fullWidth>
                <InputLabel>User Role</InputLabel>
                <Select
                  value={formData.role}
                  label="User Role"
                  onChange={handleInputChange('role')}
                  sx={{
                    borderRadius: 3,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0a4f3c',
                    },
                  }}
                >
                  <MenuItem value="faculty">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ color: '#2a9d7f' }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Faculty Member
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Can create and manage their own projects
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="main_coordinator">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AdminIcon sx={{ color: '#0a4f3c' }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Main Coordinator
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full administrative access to all features
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#000', 0.04)
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : (editingUser ? <EditIcon /> : <PersonAddIcon />)}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%)',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(10,79,60,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #063d2f 0%, #1a7a5e 100%)',
                boxShadow: '0 6px 16px rgba(10,79,60,0.4)',
              },
              '&:disabled': {
                background: alpha('#0a4f3c', 0.6),
                color: 'white'
              }
            }}
          >
            {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;