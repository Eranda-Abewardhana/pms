import React from 'react';
import { Typography, Box, Button, Container, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          minHeight: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          py: 5
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            borderRadius: '50%', 
            bgcolor: 'error.light', // Changed from 'lighter' to 'light'
            color: 'error.main',
            mb: 4,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
              '70%': { boxShadow: '0 0 0 20px rgba(239, 68, 68, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
            }
          }}
        >
          <SecurityIcon sx={{ fontSize: 80 }} />
        </Box>
        <Typography variant="h1" sx={{ color: 'text.primary', mb: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
          Oops! It looks like you don't have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.5 }}
          >
            Back to Login
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ px: 4, py: 1.5 }}
          >
            Go Back
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;
