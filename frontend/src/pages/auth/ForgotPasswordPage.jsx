import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert,
  Link,
  Stack,
} from '@mui/material';
import Email from '@mui/icons-material/Email';
import ArrowBack from '@mui/icons-material/ArrowBack';
import HealthAndSafety from '@mui/icons-material/HealthAndSafety';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      {/* Left Side - Visual */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
          color: 'white',
          p: 6,
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 480 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <HealthAndSafety sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight={800}>Metro Medi Care</Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            Secure Your Account Access.
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400 }}>
            Don't worry! It happens. Enter the email address associated with your account and we'll send you a link to reset your password.
          </Typography>
        </Stack>
      </Box>

      {/* Right Side - Form */}
      <Box sx={{ flex: { xs: 1, lg: 0.8 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Card elevation={0} sx={{ maxWidth: 420, width: '100%', bgcolor: 'transparent' }}>
          <Box sx={{ mb: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<ArrowBack />}
              sx={{ mb: 2, p: 0, minWidth: 0, color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
            >
              Back to login
            </Button>
            <Typography variant="h4" gutterBottom fontWeight={800}>Forgot Password?</Typography>
            <Typography color="text.secondary">We will send a reset link to your email</Typography>
          </Box>

          {submitted ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>Check your inbox!</Typography>
              <Typography variant="body2">We've sent password reset instructions to your email address.</Typography>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email Address"
                  placeholder="you@example.com"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.disabled', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                </Button>
              </Stack>
            </form>
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
