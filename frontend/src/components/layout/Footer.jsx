import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        bgcolor: 'transparent',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        © {new Date().getFullYear()}{' '}
        <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
          MetroCare
        </Box>{' '}
        Patient Management System. All Rights Reserved.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Link
          href="#"
          variant="caption"
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: 'primary.main' },
          }}
        >
          Privacy Policy
        </Link>
        <Link
          href="#"
          variant="caption"
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: 'primary.main' },
          }}
        >
          Terms of Service
        </Link>
      </Box>
    </Box>
  );
};

export default Footer;
