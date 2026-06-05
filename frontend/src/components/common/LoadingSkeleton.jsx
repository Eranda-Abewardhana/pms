import React from 'react';
import { Skeleton, Box } from '@mui/material';

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <Box sx={{ width: '100%' }}>
      {Array.from(new Array(count)).map((_, index) => (
        <Skeleton key={index} height={60} animation="wave" />
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
