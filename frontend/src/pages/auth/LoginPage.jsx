import React, { useState, useLayoutEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Link,
  Stack,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Email from '@mui/icons-material/Email';
import Lock from '@mui/icons-material/Lock';
import HealthAndSafety from '@mui/icons-material/HealthAndSafety';
import Language from '@mui/icons-material/Language';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { login } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';
import gsap from 'gsap';

const roleRedirectMap = {
  admin: '/admin',
  doctor: '/doctor',
  patient: '/patient',
  receptionist: '/receptionist',
  nurse: '/nurse',
  cashier: '/cashier',
  labtech: '/labtech',
};

const buildSchema = (t) =>
  yup.object().shape({
    email: yup
      .string()
      .required(t('email_required'))
      .email(t('email_invalid')),
    password: yup
      .string()
      .required(t('password_required'))
      .min(6, t('password_min')),
  });

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);
  const containerRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const schema = buildSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate the left visual panel
      gsap.from('.auth-visual', {
        x: -100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out'
      });
      
      // Animate the login form elements
      gsap.from('.auth-form-content > *', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.4
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === 'en' ? 'si' : 'en');

  const onSubmit = async (data) => {
    setLoginError('');
    try {
      const resultAction = await dispatch(login(data)).unwrap();
      const payload = resultAction.data ?? resultAction;
      const user = payload.user;

      toast.success(`${t('login_success')}, ${user?.name}`);
      navigate(roleRedirectMap[user?.role] ?? '/login');
    } catch (err) {
      setLoginError(t('login_failed'));
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: '#E8ECF4',
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      transition: 'all 0.2s ease',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 198, 179, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#00C6B3',
        borderWidth: '1.5px',
      },
      // Fix for Chrome/Safari Autofill background
      '& input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 1000px #1A2236 inset !important',
        WebkitTextFillColor: '#E8ECF4 !important',
        transition: 'background-color 5000s ease-in-out 0s',
        borderRadius: 'inherit',
      },
    },
    '& .MuiInputLabel-root': {
      color: '#8A94A6',
      '&.Mui-focused': {
        color: '#00C6B3',
      },
    },
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#0D1117',
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Visual/Marketing */}
      <Box
        className="auth-visual"
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(160deg, #0D1117 0%, #0E2A30 40%, #0A2340 100%)',
          color: 'white',
          p: 6,
          position: 'relative',
          borderRight: '1px solid rgba(0,198,179,0.1)',
        }}
      >
        {/* Animated teal glow blob */}
        <Box sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,198,179,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '15%',
          right: '5%',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(75,158,255,0.1) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />

        <Stack spacing={4} sx={{ maxWidth: 480, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00C6B3, #4B9EFF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,198,179,0.4)',
            }}>
              <HealthAndSafety sx={{ fontSize: 30, color: '#fff' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#E8ECF4', lineHeight: 1 }}>
                MetroCare
              </Typography>
              <Typography variant="caption" sx={{ color: '#8A94A6', letterSpacing: '0.1em' }}>
                PATIENT MANAGEMENT
              </Typography>
            </Box>
          </Box>

          <Typography variant="h3" fontWeight={800} sx={{
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #E8ECF4 30%, #00C6B3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Comprehensive Healthcare Management, Reimagined.
          </Typography>

          <Typography variant="body1" sx={{ color: '#8A94A6', lineHeight: 1.7, maxWidth: 400 }}>
            Dedicated to providing the best patient care experience with modern
            technology and compassionate professionals.
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['Role-Based Access', 'Real-time Data', 'EMR & Lab Reports', 'Smart Billing'].map((f) => (
              <Box key={f} sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                bgcolor: 'rgba(0,198,179,0.08)',
                border: '1px solid rgba(0,198,179,0.2)',
                color: '#00C6B3',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
                {f}
              </Box>
            ))}
          </Box>
        </Stack>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: { xs: 1, md: 0.8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
          position: 'relative',
          bgcolor: '#0D1117',
        }}
      >
        {/* Language Switcher */}
        <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
          <Button
            size="small"
            startIcon={<Language />}
            onClick={toggleLanguage}
            sx={{
              color: '#8A94A6',
              fontWeight: 600,
              fontSize: '0.8rem',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              px: 1.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(0,198,179,0.3)' },
            }}
          >
            {i18n.language === 'en' ? 'සිංහල' : 'English'}
          </Button>
        </Box>

        <Card
          elevation={0}
          sx={{
            maxWidth: 440,
            width: '100%',
            bgcolor: '#1A2236',
            p: { xs: 3, sm: 4.5 },
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <Stack spacing={3.5} className="auth-form-content">
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={800} sx={{ color: '#E8ECF4' }}>
                Welcome Back
              </Typography>
              <Typography sx={{ color: '#8A94A6', fontSize: '0.9rem' }}>
                Sign in to access your MetroCare dashboard
              </Typography>
            </Box>

            {loginError && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.3)',
                  color: '#FF6B6B',
                  '& .MuiAlert-icon': { color: '#FF6B6B' },
                }}
              >
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label={t('email_label')}
                  placeholder="user@metrocare.com"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={textFieldStyle}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#8A94A6', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label={t('password_label')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={textFieldStyle}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#8A94A6', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePassword}
                          size="small"
                          edge="end"
                          sx={{ color: '#8A94A6', '&:hover': { color: '#00C6B3' } }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      textDecoration: 'none',
                      color: '#00C6B3',
                      fontSize: '0.82rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.6,
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #00C6B3 0%, #00A89A 100%)',
                    boxShadow: '0 8px 24px rgba(0,198,179,0.35)',
                    borderRadius: '12px',
                    textTransform: 'none',
                    letterSpacing: '0.02em',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #33D4C5 0%, #00C6B3 100%)',
                      boxShadow: '0 12px 32px rgba(0,198,179,0.45)',
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': { background: 'rgba(0,198,179,0.3)', color: 'rgba(255,255,255,0.5)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In to Dashboard'}
                </Button>
              </Stack>
            </form>

            <Box
              sx={{
                textAlign: 'center',
                pt: 1,
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Typography variant="body2" sx={{ color: '#8A94A6' }}>
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  fontWeight={700}
                  sx={{
                    textDecoration: 'none',
                    color: '#00C6B3',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};

export default LoginPage;
