import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/adminApi';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Submitting email:', email); // Debug log
      
      // Make sure email is a valid string
      if (!email || typeof email !== 'string') {
        throw new Error('Invalid email format');
      }
      
      await adminApi.forgotPassword(email.trim()); // Trim whitespace
      setSuccess(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#0a4f3c', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          Forgot Password
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Email Sent Successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If an account with that email exists, you will receive a password reset link shortly.
                </Typography>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#0a4f3c' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
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
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {success ? (
          <Button
            onClick={handleClose}
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#0a4f3c',
              '&:hover': { bgcolor: '#063d2f' },
              borderRadius: 2,
              py: 1.5
            }}
          >
            Close
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                borderColor: '#0a4f3c',
                color: '#0a4f3c',
                '&:hover': {
                  borderColor: '#063d2f',
                  bgcolor: 'rgba(10, 79, 60, 0.04)'
                },
                borderRadius: 2,
                flex: 1
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !email}
              sx={{
                bgcolor: '#0a4f3c',
                '&:hover': { bgcolor: '#063d2f' },
                borderRadius: 2,
                flex: 2
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Sending...
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SendIcon />
                  Send Reset Link
                </Box>
              )}
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordModal;
