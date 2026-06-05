import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, Avatar, Chip, CircularProgress,
  TextField, InputAdornment, IconButton, Tooltip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorPatients } from '../../features/doctor/doctorSlice';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import PhoneIcon from '@mui/icons-material/Phone';
import CakeIcon from '@mui/icons-material/Cake';
import gsap from 'gsap';

const DoctorPatientRecords = () => {
  const dispatch = useDispatch();
  const { patients, patientsLoading, patientsError } = useSelector((state) => state.doctor);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const containerRef = useRef(null);

  const loadPatients = (q = '') => {
    dispatch(fetchDoctorPatients(q ? { search: q } : {}));
  };

  useEffect(() => {
    loadPatients();
  }, [dispatch]);

  useLayoutEffect(() => {
    if (!patientsLoading && patients.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.patient-row', {
          x: -20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power2.out',
          delay: 0.1,
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [patientsLoading, patients]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') loadPatients(search);
  };

  const getGenderColor = (gender) => {
    if (gender === 'male') return '#2563eb';
    if (gender === 'female') return '#db2777';
    return '#64748b';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <Box ref={containerRef}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Patient Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Patients who have had appointments with you ({patients.length} total)
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={() => loadPatients(search)}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, patient ID or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={() => loadPatients(search)} variant="contained" sx={{ borderRadius: 1 }}>
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {patientsError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff1f2', border: '1px solid #fecaca', borderRadius: 2 }}>
          <Typography color="error.main" variant="body2" sx={{ fontWeight: 600 }}>
            {patientsError}
          </Typography>
        </Paper>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        {patientsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Patient ID</TableCell>
                  <TableCell>Age / Gender</TableCell>
                  <TableCell>Blood Group</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Conditions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box sx={{ opacity: 0.5 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No patients found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Patients who book appointments with you will appear here.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => {
                    const age = calcAge(patient.dateOfBirth) || patient.age;
                    // Normalize JSON fields — MySQL may return them as strings
                    const conditions = Array.isArray(patient.chronicConditions)
                      ? patient.chronicConditions
                      : typeof patient.chronicConditions === 'string'
                        ? JSON.parse(patient.chronicConditions || '[]')
                        : [];
                    const allergies = Array.isArray(patient.allergies)
                      ? patient.allergies
                      : typeof patient.allergies === 'string'
                        ? JSON.parse(patient.allergies || '[]')
                        : [];
                    return (
                      <TableRow key={patient.id ?? patient._id} hover className="patient-row">
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                bgcolor: `${getGenderColor(patient.gender)}22`,
                                color: getGenderColor(patient.gender),
                                fontWeight: 700,
                              }}
                            >
                              {patient.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {patient.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {patient.email || '—'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {patient.patientId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {age && (
                              <Chip
                                label={`${age} yrs`}
                                size="small"
                                icon={<CakeIcon style={{ fontSize: 14 }} />}
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {patient.gender && (
                              <Chip
                                label={patient.gender}
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  bgcolor: `${getGenderColor(patient.gender)}15`,
                                  color: getGenderColor(patient.gender),
                                  textTransform: 'capitalize',
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {patient.bloodGroup ? (
                            <Chip
                              label={patient.bloodGroup}
                              size="small"
                              icon={<BloodtypeIcon style={{ fontSize: 14, color: '#dc2626' }} />}
                              sx={{ fontSize: '0.7rem', color: '#dc2626', bgcolor: '#fee2e2' }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{patient.phone || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          {conditions.length > 0 ? (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {conditions.slice(0, 2).map((c, i) => (
                                <Chip key={i} label={c} size="small" color="warning" sx={{ fontSize: '0.65rem' }} />
                              ))}
                              {conditions.length > 2 && (
                                <Chip label={`+${conditions.length - 2}`} size="small" sx={{ fontSize: '0.65rem' }} />
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">None recorded</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Patient Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => setSelectedPatient(patient)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog
        open={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedPatient && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontSize: 24,
                    fontWeight: 700,
                    bgcolor: `${getGenderColor(selectedPatient.gender)}22`,
                    color: getGenderColor(selectedPatient.gender),
                  }}
                >
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {selectedPatient.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPatient.patientId}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                {[
                  { label: 'Email', value: selectedPatient.email || '—', icon: <PersonIcon fontSize="small" /> },
                  { label: 'Phone', value: selectedPatient.phone || '—', icon: <PhoneIcon fontSize="small" /> },
                  { label: 'Gender', value: selectedPatient.gender || '—', icon: <PersonIcon fontSize="small" /> },
                  { label: 'Date of Birth', value: formatDate(selectedPatient.dateOfBirth), icon: <CakeIcon fontSize="small" /> },
                  { label: 'Blood Group', value: selectedPatient.bloodGroup || '—', icon: <BloodtypeIcon fontSize="small" /> },
                  { label: 'Address', value: selectedPatient.address || '—', icon: <PersonIcon fontSize="small" /> },
                ].map((item, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25, textTransform: item.label === 'Gender' ? 'capitalize' : 'none' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}

                {(() => {
                  const selAllergies = Array.isArray(selectedPatient.allergies)
                    ? selectedPatient.allergies
                    : typeof selectedPatient.allergies === 'string'
                      ? JSON.parse(selectedPatient.allergies || '[]') : [];
                  const selConditions = Array.isArray(selectedPatient.chronicConditions)
                    ? selectedPatient.chronicConditions
                    : typeof selectedPatient.chronicConditions === 'string'
                      ? JSON.parse(selectedPatient.chronicConditions || '[]') : [];
                  return (
                    <>
                      {selAllergies.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Allergies</Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                            {selAllergies.map((a, i) => (
                              <Chip key={i} label={a} size="small" color="error" variant="outlined" />
                            ))}
                          </Stack>
                        </Grid>
                      )}
                      {selConditions.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Chronic Conditions</Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                            {selConditions.map((c, i) => (
                              <Chip key={i} label={c} size="small" color="warning" variant="outlined" />
                            ))}
                          </Stack>
                        </Grid>
                      )}
                    </>
                  );
                })()}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedPatient(null)} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DoctorPatientRecords;
