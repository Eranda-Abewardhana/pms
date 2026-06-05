import React, { useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Rating, Avatar,
  Chip, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFeedback } from '../../features/admin/adminSlice';

const AdminFeedback = () => {
  const dispatch = useDispatch();
  const { feedback, feedbackLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAllFeedback());
  }, [dispatch]);

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4', mb: 3 }}>
        Patient Feedback
      </Typography>

      <TableContainer component={Card} sx={{ bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { color: '#8A94A6', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedbackLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress sx={{ color: '#00C6B3' }} />
                </TableCell>
              </TableRow>
            ) : feedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#8A94A6' }}>
                  No feedback received yet.
                </TableCell>
              </TableRow>
            ) : (
              feedback.map((item) => (
                <TableRow key={item._id} sx={{ '& td': { color: '#E8ECF4', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#FF9F43', width: 32, height: 32, fontSize: '0.8rem' }}>
                        {item.patientId?.name ? item.patientId.name[0] : 'P'}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.patientId?.name || 'Anonymous'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#00C6B3' }}>
                      {item.doctorId?.name || 'General'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={item.overallRating} readOnly size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ color: '#8A94A6' }}>
                      {item.comment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isPublished ? 'Published' : 'Internal'}
                      size="small"
                      sx={{
                        bgcolor: item.isPublished ? 'rgba(52,211,153,0.1)' : 'rgba(138,148,166,0.1)',
                        color: item.isPublished ? '#34D399' : '#8A94A6',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminFeedback;
