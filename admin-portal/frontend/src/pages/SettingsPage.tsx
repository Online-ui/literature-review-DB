import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Avatar,
  alpha,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Shield as ShieldIcon,
  Update as UpdateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    projectUpdates: true,
    userRegistrations: true,
    systemAlerts: true
  });

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);

    try {
      await adminApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleNotificationChange = (setting: keyof typeof notifications) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 50) return '#f44336';
    if (strength < 75) return '#ff9800';
    return '#4caf50';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <Box>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              color: '#0a4f3c',
              mb: 1,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Account Settings
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '1.1rem'
            }}
          >
            Manage your account preferences, security settings, and notifications
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Account Information */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden',
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
                      bgcolor: '#0a4f3c',
                      width: 48,
                      height: 48
                    }}
                  >
                    <SettingsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      Account Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View your account details and status
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={user?.full_name || ''}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: alpha('#000', 0.02)
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Username"
                      fullWidth
                      value={user?.username || ''}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: alpha('#000', 0.02)
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Email Address"
                      fullWidth
                      value={user?.email || ''}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: alpha('#000', 0.02)
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Role"
                      fullWidth
                      value={user?.role === 'main_coordinator' ? 'Main Coordinator' : 'Faculty Member'}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: alpha('#000', 0.02)
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Institution"
                      fullWidth
                      value={user?.institution || 'Not specified'}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: alpha('#000', 0.02)
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              
              <CardActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    width: '100%',
                    borderRadius: 3,
                    '& .MuiAlert-icon': { fontSize: 20 }
                  }}
                >
                  Contact your administrator to update account information
                </Alert>
              </CardActions>
            </Card>
          </motion.div>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.08)',
                overflow: 'hidden',
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
                      bgcolor: '#1a7a5e',
                      width: 48,
                      height: 48
                    }}
                  >
                    <SecurityIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      Security Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Update your password and security preferences
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <AnimatePresence>
                  {passwordError && (
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
                        {passwordError}
                      </Alert>
                    </motion.div>
                  )}

                  {passwordSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 3,
                          '& .MuiAlert-icon': { fontSize: 24 }
                        }}
                      >
                        {passwordSuccess}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Current Password"
                      type={showPasswords.current ? 'text' : 'password'}
                      fullWidth
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                          >
                            {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
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
                      label="New Password"
                      type={showPasswords.new ? 'text' : 'password'}
                      fullWidth
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                          >
                            {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
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
                    
                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            Password Strength
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600,
                              color: getPasswordStrengthColor(getPasswordStrength(passwordData.newPassword))
                            }}
                          >
                            {getPasswordStrengthText(getPasswordStrength(passwordData.newPassword))}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                                                    value={getPasswordStrength(passwordData.newPassword)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha('#000', 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: getPasswordStrengthColor(getPasswordStrength(passwordData.newPassword))
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Confirm New Password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      fullWidth
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                          >
                            {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
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
                    
                    {/* Password Match Indicator */}
                    {passwordData.confirmPassword && (
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <>
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                              Passwords match
                            </Typography>
                          </>
                        ) : (
                          <>
                            <WarningIcon sx={{ fontSize: 16, color: '#f44336' }} />
                            <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 600 }}>
                              Passwords do not match
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>

                {/* Password Requirements */}
                <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: alpha('#0a4f3c', 0.05) }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a4f3c', mb: 1 }}>
                    Password Requirements:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {[
                      { text: 'At least 8 characters', met: passwordData.newPassword.length >= 8 },
                      { text: 'One uppercase letter', met: /[A-Z]/.test(passwordData.newPassword) },
                      { text: 'One number', met: /[0-9]/.test(passwordData.newPassword) },
                      { text: 'One special character', met: /[^A-Za-z0-9]/.test(passwordData.newPassword) }
                    ].map((req, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon 
                          sx={{ 
                            fontSize: 14, 
                            color: req.met ? '#4caf50' : '#ccc' 
                          }} 
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: req.met ? '#4caf50' : 'text.secondary',
                            fontWeight: req.met ? 600 : 400
                          }}
                        >
                          {req.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={changingPassword ? <UpdateIcon /> : <LockIcon />}
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1a7a5e 0%, #2a9d7f 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(26,122,94,0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0f5d47 0%, #1a7a5e 100%)',
                      boxShadow: '0 12px 32px rgba(26,122,94,0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&:disabled': {
                      background: alpha('#1a7a5e', 0.6),
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </Button>
              </CardActions>
            </Card>
          </motion.div>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
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
                    <NotificationsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      Notification Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customize how and when you receive notifications
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {[
                    {
                      key: 'emailNotifications',
                      title: 'Email Notifications',
                      description: 'Receive email notifications for important updates and alerts',
                      icon: '📧'
                    },
                    {
                      key: 'projectUpdates',
                      title: 'Project Updates',
                      description: 'Get notified when projects are created, updated, or published',
                      icon: '📄'
                    },
                    {
                      key: 'userRegistrations',
                      title: 'User Registrations',
                      description: 'Notify when new users register (Main Coordinators only)',
                      icon: '👥'
                    },
                    {
                      key: 'systemAlerts',
                      title: 'System Alerts',
                      description: 'Receive alerts about system maintenance and important updates',
                      icon: '⚠️'
                    }
                  ].map((setting, index) => (
                    <Grid item xs={12} md={6} key={setting.key}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          border: '1px solid rgba(0,0,0,0.08)',
                          bgcolor: notifications[setting.key as keyof typeof notifications] 
                            ? alpha('#2a9d7f', 0.05) 
                            : 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box
                            sx={{
                              fontSize: '1.5rem',
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              bgcolor: alpha('#2a9d7f', 0.1)
                            }}
                          >
                            {setting.icon}
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={notifications[setting.key as keyof typeof notifications]}
                                  onChange={handleNotificationChange(setting.key as keyof typeof notifications)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#2a9d7f',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: '#2a9d7f',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                                    {setting.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {setting.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ margin: 0, alignItems: 'flex-start' }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
              
              <CardActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  disabled
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    background: alpha('#2a9d7f', 0.6),
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'white'
                  }}
                >
                  Save Preferences (Coming Soon)
                </Button>
              </CardActions>
            </Card>
          </motion.div>
        </Grid>

        {/* System Information */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#3ac0a0',
                      width: 48,
                      height: 48
                    }}
                  >
                    <InfoIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c' }}>
                      System Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View system details and account statistics
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  {[
                    {
                      title: 'Application Version',
                      value: 'Admin Portal v1.0.0',
                      icon: '🚀',
                      color: '#0a4f3c'
                    },
                    {
                      title: 'Last Login',
                      value: new Date().toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }),
                      icon: '🕒',
                      color: '#1a7a5e'
                    },
                    {
                      title: 'Account Created',
                      value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A',
                      icon: '📅',
                      color: '#2a9d7f'
                    },
                    {
                      title: 'Account Status',
                      value: user?.is_active ? 'Active & Verified' : 'Inactive',
                      icon: user?.is_active ? '✅' : '❌',
                      color: user?.is_active ? '#4caf50' : '#f44336'
                    }
                  ].map((info, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: alpha(info.color, 0.05),
                          border: '1px solid',
                          borderColor: alpha(info.color, 0.1),
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(info.color, 0.15)}`
                          }
                        }}
                      >
                        <Box
                          sx={{
                            fontSize: '2rem',
                            mb: 2,
                            width: 60,
                            height: 60,
                            display: 'flex',
                                                        alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 3,
                            bgcolor: alpha(info.color, 0.1),
                            mx: 'auto'
                          }}
                        >
                          {info.icon}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: info.color,
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.75rem'
                          }}
                        >
                          {info.title}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#0a4f3c',
                            fontSize: '1rem',
                            lineHeight: 1.3
                          }}
                        >
                          {info.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Additional System Stats */}
                <Box sx={{ mt: 4, p: 3, borderRadius: 3, bgcolor: alpha('#0a4f3c', 0.02) }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0a4f3c', mb: 3 }}>
                    Security & Performance
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ShieldIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                            Security Status
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            All systems secure
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <UpdateIcon sx={{ color: '#2a9d7f', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                            Last Update
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            System up to date
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0a4f3c' }}>
                            System Health
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Optimal performance
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;