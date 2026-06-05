import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, InputAdornment,
  Avatar, Chip, IconButton, CircularProgress, Pagination
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { fetchAllPatients } from '../../features/admin/adminSlice';

const AdminPatients = () => {
  const dispatch = useDispatch();
  const { patients, patientsTotal, patientsLoading } = useSelector((state) => state.admin);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchAllPatients({ search, page, limit }));
  }, [dispatch, search, page]);

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4', mb: 3 }}>
        Patient Records
      </Typography>

      <Card sx={{ p: 2, mb: 3, bgcolor: '#1A2236', borderRadius: '16px' }}>
        <TextField
          fullWidth
          placeholder="Search by name, Patient ID, NIC or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8A94A6' }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: '12px',
              color: '#E8ECF4',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
            }
          }}
        />
      </Card>

      <TableContainer component={Card} sx={{ bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { color: '#8A94A6', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
              <TableCell>ID</TableCell>
              <TableCell>Patient Name</TableCell>
              <TableCell>NIC / Gender</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patientsLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress sx={{ color: '#00C6B3' }} />
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#8A94A6' }}>
                  No patient records found.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient._id} sx={{ '& td': { color: '#E8ECF4', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#00C6B3' }}>
                      {patient.patientId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#4B9EFF', width: 32, height: 32, fontSize: '0.8rem' }}>
                        {patient.name[0]}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{patient.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{patient.nic || '—'}</Typography>
                      <Typography variant="caption" sx={{ color: '#8A94A6', textTransform: 'capitalize' }}>
                        {patient.gender} • {patient.age || '—'} yrs
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.phone || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: '#8A94A6' }}>{patient.email || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" sx={{ color: '#00C6B3' }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {patientsTotal > limit && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(patientsTotal / limit)}
              page={page}
              onChange={(e, v) => setPage(v)}
              sx={{
                '& .MuiPaginationItem-root': { color: '#8A94A6' },
                '& .Mui-selected': { bgcolor: 'rgba(0,198,179,0.2) !important', color: '#00C6B3' }
              }}
            />
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

export default AdminPatients;
