import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, TextField, InputAdornment, Grid, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, IconButton, Button, Stack, Skeleton,
  Drawer, Divider, Avatar, Tooltip, useTheme, Badge, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import CakeIcon from '@mui/icons-material/Cake';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import { searchPatients, getPatientById } from '../../api/receptionistApi';
import { format } from 'date-fns';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female', 'Other'];

const genderColor = { Male: '#3b82f6', Female: '#ec4899', Other: '#8b5cf6' };

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.3, flexShrink: 0 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value || '—'}
      </Typography>
    </Box>
  </Stack>
);

export default function SearchPatients() {
  const theme = useTheme();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPatients = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await searchPatients({
        search: params.query || undefined,
        gender: params.gender || undefined,
        bloodGroup: params.bloodGroup || undefined,
        page: params.page + 1,
        limit: params.rowsPerPage,
      });
      setPatients(res.data?.patients || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPatients({ query, gender, bloodGroup, page, rowsPerPage });
  }, [gender, bloodGroup, page, rowsPerPage]);

  // Debounced search
  const handleQueryChange = (value) => {
    setQuery(value);
    setPage(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPatients({ query: value, gender, bloodGroup, page: 0, rowsPerPage });
    }, 400);
  };

  const handleViewDetails = async (patientId) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const res = await getPatientById(patientId);
      setSelectedPatient(res.data);
    } catch (err) {
      console.error('Detail fetch failed:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setGender('');
    setBloodGroup('');
    setPage(0);
    fetchPatients({ query: '', gender: '', bloodGroup: '', page: 0, rowsPerPage });
    searchRef.current?.focus();
  };

  const hasFilters = query || gender || bloodGroup;

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/receptionist')}
          sx={{ color: 'text.secondary', textTransform: 'none' }}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Search Patients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {firstLoad ? 'Loading…' : `${total} patient${total !== 1 ? 's' : ''} found`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/receptionist/register-patient')}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
        >
          Register Patient
        </Button>
      </Stack>

      {/* ── Filters ─────────────────────────────────────── */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              inputRef={searchRef}
              id="patient-search"
              placeholder="Search by name, NIC, phone, or Patient ID…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: query ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleQueryChange('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              fullWidth
              id="filter-gender"
              select
              label="Gender"
              value={gender}
              onChange={(e) => { setGender(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Genders</MenuItem>
              {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              fullWidth
              id="filter-bloodgroup"
              select
              label="Blood Group"
              value={bloodGroup}
              onChange={(e) => { setBloodGroup(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Groups</MenuItem>
              {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant={hasFilters ? 'contained' : 'outlined'}
              onClick={clearFilters}
              startIcon={<FilterListIcon />}
              disabled={!hasFilters}
              sx={{ py: 1.8, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* ── Results Table ─────────────────────────────────── */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', borderBottom: `2px solid ${theme.palette.divider}` } }}>
                <TableCell>Patient ID</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Blood Group</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">
                      {hasFilters ? 'No patients match your search.' : 'No patients registered yet.'}
                    </Typography>
                    {hasFilters && (
                      <Button size="small" onClick={clearFilters} sx={{ mt: 1 }}>Clear filters</Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((p) => (
                  <TableRow
                    key={p._id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${theme.palette.primary.main}05` } }}
                    onClick={() => handleViewDetails(p._id)}
                  >
                    <TableCell>
                      <Chip
                        label={p.patientId}
                        size="small"
                        sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{ width: 36, height: 36, bgcolor: `${genderColor[p.gender] || '#6b7280'}20`, color: genderColor[p.gender] || '#6b7280', fontWeight: 700, fontSize: '0.875rem' }}
                        >
                          {p.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                          {p.email && (
                            <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{p.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {p.bloodGroup ? (
                        <Chip
                          label={p.bloodGroup}
                          size="small"
                          sx={{ bgcolor: '#ef444415', color: '#ef4444', fontWeight: 700 }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {p.gender ? (
                        <Chip
                          label={p.gender}
                          size="small"
                          sx={{ bgcolor: `${genderColor[p.gender] || '#6b7280'}15`, color: genderColor[p.gender] || '#6b7280', fontWeight: 600 }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {p.createdAt ? format(new Date(p.createdAt), 'MMM d, yyyy') : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(p._id)}
                          sx={{ color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: '#fff' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Schedule Appointment">
                        <IconButton
                          size="small"
                          onClick={() => navigate('/receptionist/appointments')}
                          sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { bgcolor: 'secondary.main', color: '#fff' } }}
                        >
                          <EventIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      </Card>

      {/* ── Patient Detail Drawer ─────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Patient Details</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {detailLoading ? (
          <Box>
            <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={40} sx={{ mb: 1.5 }} />
            ))}
          </Box>
        ) : selectedPatient ? (
          <>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80, height: 80, mx: 'auto', mb: 2,
                  bgcolor: `${genderColor[selectedPatient.gender] || '#6b7280'}20`,
                  color: genderColor[selectedPatient.gender] || '#6b7280',
                  fontSize: '2rem', fontWeight: 800,
                }}
              >
                {selectedPatient.name?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedPatient.name}</Typography>
              <Chip
                label={selectedPatient.patientId}
                sx={{ mt: 1, bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }}
              />
            </Box>

            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>PERSONAL</Typography>
            </Divider>

            <InfoRow icon={<PersonIcon fontSize="small" />} label="Gender" value={selectedPatient.gender} />
            <InfoRow icon={<CakeIcon fontSize="small" />} label="Date of Birth" value={selectedPatient.dateOfBirth ? format(new Date(selectedPatient.dateOfBirth), 'MMMM d, yyyy') : null} />
            <InfoRow icon={<BloodtypeIcon fontSize="small" />} label="Blood Group" value={selectedPatient.bloodGroup} />

            <Divider sx={{ mb: 3, mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>CONTACT</Typography>
            </Divider>

            <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={selectedPatient.phone} />
            <InfoRow icon={<BadgeIcon fontSize="small" />} label="NIC" value={selectedPatient.nic} />
            <InfoRow
              icon={<PersonIcon fontSize="small" />}
              label="Address"
              value={[selectedPatient.address?.street, selectedPatient.address?.city].filter(Boolean).join(', ')}
            />

            {(selectedPatient.allergies?.length > 0 || selectedPatient.chronicConditions?.length > 0) && (
              <>
                <Divider sx={{ mb: 3, mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>MEDICAL</Typography>
                </Divider>

                {selectedPatient.allergies?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Allergies
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {selectedPatient.allergies.map((a) => (
                        <Chip key={a} label={a} size="small" sx={{ bgcolor: '#ef444415', color: '#ef4444', fontWeight: 600 }} />
                      ))}
                    </Stack>
                  </Box>
                )}

                {selectedPatient.chronicConditions?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Chronic Conditions
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {selectedPatient.chronicConditions.map((c) => (
                        <Chip key={c} label={c} size="small" sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', fontWeight: 600 }} />
                      ))}
                    </Stack>
                  </Box>
                )}
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Registered: {selectedPatient.createdAt ? format(new Date(selectedPatient.createdAt), 'PPpp') : '—'}
            </Typography>

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EventIcon />}
                onClick={() => navigate('/receptionist/appointments')}
                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2.5, textTransform: 'none' }}
              >
                Schedule Appointment
              </Button>
            </Stack>
          </>
        ) : null}
      </Drawer>
    </Box>
  );
}
