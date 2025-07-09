import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  CssBaseline,
  InputAdornment,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { adminApi } from '../services/adminApi';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. No token provided.');
        setVerifying(false);
        return;
      }
  
      try {
        
        const response = await adminApi.verifyResetToken(token);
        setTokenValid(true);
        setUserInfo(response);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired reset token.');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
  
    verifyToken();
  }, [token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await adminApi.resetPassword(token!, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return '#f44336';
    if (strength < 75) return '#ff9800';
    return '#4caf50';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  if (verifying) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a4f3c 0%, #1a7a5e 30%, #2a9d7f 70%, #3ac0a0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
          <Typography>Verifying reset token...</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a4f3c 0%, #1a7a5e 30%, #2a9d7f 70%, #3ac0a0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <CssBaseline />

      <Container component="main" maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                >
                  <LockIcon sx={{ fontSize: 40, color: 'white' }} />
                </Avatar>
                
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    mb: 1,
                    textShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  Reset Password
                </Typography>
                
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 300
                  }}
                >
                  {userInfo ? `Reset password for ${userInfo.email}` : 'Create a new password'}
                </Typography>
              </Box>
            </motion.div>

            {/* Reset Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ width: '100%' }}
            >
              <Card
                elevation={0}
                sx={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                  {!tokenValid ? (
                    <Alert severity="error" sx={{ borderRadius: 3 }}>
                      {error}
                      <Button
                        onClick={() => navigate('/login')}
                        sx={{ mt: 2, display: 'block' }}
                        variant="outlined"
                      >
                        Back to Login
                      </Button>
                    </Alert>
                  ) : success ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CheckIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                          Password Reset Successful!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Your password has been successfully reset. You will be redirected to the login page shortly.
                        </Typography>
                        <Button
                          onClick={() => navigate('/login')}
                          variant="contained"
                          sx={{
                            bgcolor: '#0a4f3c',
                            '&:hover': { bgcolor: '#063d2f' },
                            borderRadius: 2
                          }}
                        >
                          Go to Login
                        </Button>
                      </Box>
                    </motion.div>
                  ) : (
                    <>
                      {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                          {error}
                        </Alert>
                      )}

                      <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="New Password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon sx={{ color: '#0a4f3c' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  sx={{ color: '#0a4f3c' }}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              '&:hover fieldset': {
                                borderColor: '#2a9d7f',
                              },
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
                        {password && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Password Strength
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ color: getStrengthColor(getPasswordStrength(password)) }}
                              >
                                {getStrengthText(getPasswordStrength(password))}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={getPasswordStrength(password)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getStrengthColor(getPasswordStrength(password)),
                                  borderRadius: 3
                                }
                              }}
                            />
                          </Box>
                        )}

                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Confirm New Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon sx={{ color: '#0a4f3c' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  sx={{ color: '#0a4f3c' }}
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              '&:hover fieldset': {
                                borderColor: '#2a9d7f',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#0a4f3c',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#0a4f3c',
                            },
                          }}
                        />

                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          disabled={loading || !password || !confirmPassword}
                          sx={{
                            py: 2,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #0a4f3c 0%, #2a9d7f 100%)',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            boxShadow: '0 8px 24px rgba(10,79,60,0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #063d2f 0%, #1a7a5e 100%)',
                              boxShadow: '0 12px 32px rgba(10,79,60,0.4)',
                              transform: 'translateY(-2px)'
                            },
                            '&:disabled': {
                              background: 'rgba(10,79,60,0.6)',
                              color: 'white'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {loading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <SecurityIcon />
                              </motion.div>
                              Resetting Password...
                            </Box>
                                                    ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <SecurityIcon />
                              Reset Password
                            </Box>
                          )}
                        </Button>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                          <Button
                            onClick={() => navigate('/login')}
                            variant="text"
                            sx={{
                              color: '#0a4f3c',
                              '&:hover': {
                                bgcolor: 'rgba(10, 79, 60, 0.04)'
                              }
                            }}
                          >
                            Back to Login
                          </Button>
                        </Box>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
