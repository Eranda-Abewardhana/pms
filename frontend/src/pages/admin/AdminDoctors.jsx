import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, Avatar, Chip, Button,
  TextField, InputAdornment, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { fetchAllUsers, createUser } from '../../features/admin/adminSlice';

const AdminDoctors = () => {
  const dispatch = useDispatch();
  const { users, usersLoading } = useSelector((state) => state.admin);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUsers({ role: 'doctor', search }));
  }, [dispatch, search]);

  // Subset of users who are doctors
  const doctors = users.filter(u => u.role === 'doctor');

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4' }}>
          Doctor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: '#00C6B3',
            '&:hover': { bgcolor: '#00A89A' },
            borderRadius: '10px',
            textTransform: 'none'
          }}
        >
          Add Doctor
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, bgcolor: '#1A2236', borderRadius: '16px', display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search doctors by name, specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          sx={{ color: '#8A94A6', borderColor: 'rgba(255,255,255,0.1)', textTransform: 'none', px: 3 }}
        >
          Filter
        </Button>
      </Card>

      {usersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00C6B3' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doc) => (
            <Grid item xs={12} sm={6} lg={4} key={doc.id ?? doc._id}>
              <Card sx={{
                bgcolor: '#1A2236',
                borderRadius: '16px',
                p: 3,
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}>
                <IconButton sx={{ position: 'absolute', top: 12, right: 12, color: '#8A94A6' }}>
                  <MoreVertIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{ width: 64, height: 64, bgcolor: '#00C6B3', fontSize: '1.5rem', fontWeight: 800 }}
                  >
                    {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#E8ECF4', fontWeight: 700 }}>
                      Dr. {doc.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#00C6B3', fontWeight: 600 }}>
                      {doc.specialization || 'General Physician'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={doc.department || 'Outpatient'}
                    size="small"
                    sx={{ bgcolor: 'rgba(75,158,255,0.1)', color: '#4B9EFF', mr: 1, fontWeight: 600 }}
                  />
                  <Chip
                    label={doc.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      bgcolor: doc.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(255,107,107,0.1)',
                      color: doc.isActive ? '#34D399' : '#FF6B6B',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#8A94A6' }}>
                    <EmailIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">{doc.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#8A94A6' }}>
                    <PhoneIcon sx={{ fontSize: 18 }} />
                    <Typography variant="body2">{doc.phone || 'N/A'}</Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#E8ECF4',
                    textTransform: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Manage Schedule
                </Button>
              </Card>
            </Grid>
          ))}
          {doctors.length === 0 && (
            <Grid item xs={12}>
              <Typography sx={{ color: '#8A94A6', textAlign: 'center', py: 4 }}>
                No doctors found matching your search.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AdminDoctors;
