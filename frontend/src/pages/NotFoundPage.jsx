import React from 'react';
import { Typography, Box, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

const NotFoundPage = () => {
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
            bgcolor: 'primary.light', // Changed from lighter to light as 'lighter' is not in theme
            color: 'primary.main',
            mb: 4,
            opacity: 0.8
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 100 }} />
        </Box>
        <Typography variant="h1" sx={{ color: 'text.primary', mb: 1, fontSize: { xs: '4rem', md: '8rem' }, opacity: 0.1, position: 'absolute', zIndex: -1 }}>
          404
        </Typography>
        <Typography variant="h2" sx={{ color: 'text.primary', mb: 2, fontWeight: 800 }}>
          Page Not Found
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ px: 4, py: 1.5, borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)' }}
        >
          Back to Safety
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
