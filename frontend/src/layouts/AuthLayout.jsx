import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthLayout = () => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (isAuthenticated && role) {
    return <Navigate to={`/${role}`} replace />;
  }

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />
      <Outlet />
    </Box>
  );
};

export default AuthLayout;
