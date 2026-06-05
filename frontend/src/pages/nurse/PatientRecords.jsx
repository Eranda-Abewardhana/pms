import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Autocomplete,
  CircularProgress, Chip, Avatar, Divider, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, LinearProgress, Stack, useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ScienceIcon from '@mui/icons-material/Science';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SearchIcon from '@mui/icons-material/Search';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPatients, fetchVitalsByPatient,
  submitLabRequest, clearNurseSuccess, clearNurseError,
} from '../../features/nurse/nurseSlice';
import { getEMRByPatient } from '../../api/nurseApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const LAB_TESTS = [
  'CBC', 'Blood Glucose (Fasting)', 'Blood Glucose (Random)', 'HbA1c',
  'Lipid Profile', 'Liver Function Test', 'Kidney Function Test',
  'Thyroid Function Test', 'Urine Full Report', 'ESR', 'CRP',
  'PT/INR', 'Blood Culture', 'Urine Culture', 'ECG', 'Chest X-Ray', 'Other',
];

const PatientRecords = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { patients, patientVitals, patientsLoading, vitalsLoading, success, error } = useSelector((s) => s.nurse);

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [tab, setTab] = useState(0);
  const [emrRecords, setEmrRecords] = useState([]);
  const [emrLoading, setEmrLoading] = useState(false);

  // Lab request dialog
  const [labDialog, setLabDialog] = useState(false);
  const [labForm, setLabForm] = useState({ testType: '', customTestName: '', priority: 'routine', clinicalNotes: '' });
  const [labLoading, setLabLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPatients({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (success) { toast.success(success); dispatch(clearNurseSuccess()); }
    if (error) { toast.error(error); dispatch(clearNurseError()); }
  }, [success, error, dispatch]);

  useEffect(() => {
    if (selectedPatient?.id) {
      dispatch(fetchVitalsByPatient(selectedPatient.id));
      loadEMR(selectedPatient.id);
    }
  }, [selectedPatient, dispatch]);

  const loadEMR = async (patientId) => {
    setEmrLoading(true);
    try {
      const res = await getEMRByPatient(patientId);
      setEmrRecords(res.data.data?.records || []);
    } catch {
      setEmrRecords([]);
    } finally {
      setEmrLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const name = p.name || p.user?.name || '';
    const pid = p.patientId || '';
    return name.toLowerCase().includes(search.toLowerCase()) || pid.toLowerCase().includes(search.toLowerCase());
  });

  const handleLabSubmit = async () => {
    if (!labForm.testType) { toast.warn('Please select a test type'); return; }
    setLabLoading(true);
    const result = await dispatch(submitLabRequest({
      patient:        selectedPatient.id,
      testType:       labForm.testType === 'Other' ? labForm.customTestName : labForm.testType,
      customTestName: labForm.testType === 'Other' ? labForm.customTestName : undefined,
      priority:       labForm.priority,
      clinicalNotes:  labForm.clinicalNotes,
    }));
    setLabLoading(false);
    if (submitLabRequest.fulfilled.match(result)) {
      toast.success('Lab request sent successfully!');
      setLabDialog(false);
      setLabForm({ testType: '', customTestName: '', priority: 'routine', clinicalNotes: '' });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
          Patient Records
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          View patient vitals, medical records, and coordinate lab tests
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Patient List */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', overflow: 'hidden', height: '70vh' }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <TextField
                fullWidth size="small"
                placeholder="Search patients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }}
              />
            </Box>
            <Box sx={{ overflowY: 'auto', height: 'calc(100% - 68px)' }}>
              {patientsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress size={24} sx={{ color: '#00C6B3' }} /></Box>
              ) : filteredPatients.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 4 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No patients found</Typography>
                </Box>
              ) : (
                filteredPatients.map((p) => {
                  const name = p.name || p.user?.name || 'Unknown';
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <Box
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      sx={{
                        px: 2, py: 1.5, cursor: 'pointer',
                        borderLeft: isSelected ? '3px solid #00C6B3' : '3px solid transparent',
                        bgcolor: isSelected ? 'rgba(0,198,179,0.08)' : 'transparent',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Avatar sx={{ width: 36, height: 36, bgcolor: isSelected ? 'rgba(0,198,179,0.2)' : 'rgba(138,148,166,0.15)', color: isSelected ? '#00C6B3' : 'text.secondary', fontSize: '0.85rem', fontWeight: 700 }}>
                        {name[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isSelected ? '#00C6B3' : theme.palette.text.primary, fontSize: '0.85rem' }} noWrap>
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{p.patientId || p.gender || ''}</Typography>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Patient Detail */}
        <Grid item xs={12} md={8} lg={9}>
          {!selectedPatient ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', p: 6, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.2, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Select a patient to view records</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', overflow: 'hidden' }}>
              {/* Patient Header */}
              <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(0,198,179,0.15)', color: '#00C6B3', fontSize: '1.1rem', fontWeight: 700 }}>
                    {(selectedPatient.name || selectedPatient.user?.name || '?')[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                      {selectedPatient.name || selectedPatient.user?.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {selectedPatient.patientId && <Chip label={selectedPatient.patientId} size="small" sx={{ bgcolor: 'rgba(75,158,255,0.12)', color: '#4B9EFF', fontWeight: 700, fontSize: '0.68rem' }} />}
                      {selectedPatient.gender && <Chip label={selectedPatient.gender} size="small" sx={{ bgcolor: 'rgba(167,139,250,0.12)', color: '#A78BFA', fontWeight: 700, fontSize: '0.68rem', textTransform: 'capitalize' }} />}
                      {selectedPatient.bloodGroup && <Chip label={selectedPatient.bloodGroup} size="small" sx={{ bgcolor: 'rgba(255,107,107,0.12)', color: '#FF6B6B', fontWeight: 700, fontSize: '0.68rem' }} />}
                    </Stack>
                  </Box>
                </Box>
                <Button
                  variant="contained" startIcon={<ScienceIcon />}
                  onClick={() => setLabDialog(true)}
                  sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#A78BFA', '&:hover': { bgcolor: '#9061ea' } }}
                >
                  Request Lab Test
                </Button>
              </Box>

              {/* Tabs */}
              <Tabs
                value={tab} onChange={(_, v) => setTab(v)}
                sx={{
                  px: 2, borderBottom: `1px solid ${theme.palette.divider}`,
                  '& .MuiTabs-indicator': { bgcolor: '#00C6B3' },
                  '& .Mui-selected': { color: '#00C6B3 !important' },
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                }}
              >
                <Tab icon={<MonitorHeartIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Vitals" />
                <Tab icon={<NoteAddIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Medical Notes" />
              </Tabs>

              {/* Vitals Tab */}
              {tab === 0 && (
                <Box>
                  {vitalsLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['Date', 'BP', 'Temp', 'Pulse', 'SpO2', 'Weight', 'BMI', 'Notes'].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', py: 1.5 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patientVitals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>No vitals on record</TableCell>
                          </TableRow>
                        ) : (
                          patientVitals.map((v) => (
                            <TableRow key={v.id ?? v._id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                              <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                {v.recordedAt ? format(new Date(v.recordedAt), 'MMM d, yy HH:mm') : '—'}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#FF6B6B', fontSize: '0.8rem' }}>
                                {v.bloodPressure?.systolic ? `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}` : '—'}
                              </TableCell>
                              <TableCell sx={{ color: '#FF9F43', fontWeight: 600, fontSize: '0.8rem' }}>{v.temperature?.value ?? '—'}</TableCell>
                              <TableCell sx={{ color: '#00C6B3', fontWeight: 600, fontSize: '0.8rem' }}>{v.pulse ?? '—'}</TableCell>
                              <TableCell sx={{ color: '#4B9EFF', fontWeight: 600, fontSize: '0.8rem' }}>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '—'}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>{v.weight?.value ?? '—'}</TableCell>
                              <TableCell>
                                {v.bmi ? <Chip label={v.bmi} size="small" sx={{ fontWeight: 700, bgcolor: v.bmi < 25 ? 'rgba(52,211,153,0.12)' : 'rgba(255,159,67,0.12)', color: v.bmi < 25 ? '#34D399' : '#FF9F43' }} /> : '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', maxWidth: 150 }}>
                                <Typography noWrap variant="body2">{v.notes || '—'}</Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Medical Notes Tab (EMR Read-only) */}
              {tab === 1 && (
                <Box sx={{ p: 2 }}>
                  {emrLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#00C6B3' }} /></Box>
                  ) : emrRecords.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <NoteAddIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No EMR records available</Typography>
                    </Box>
                  ) : (
                    emrRecords.map((emr) => (
                      <Paper key={emr.id ?? emr._id} elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                              {emr.appointment?.appointmentId || 'Appointment'} — {emr.appointment?.date ? format(new Date(emr.appointment.date), 'MMM d, yyyy') : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Dr. {emr.doctor?.name}</Typography>
                          </Box>
                          <Chip label={emr.isFinalized ? 'Finalized' : 'Draft'} size="small"
                            sx={{ bgcolor: emr.isFinalized ? 'rgba(52,211,153,0.12)' : 'rgba(255,159,67,0.12)', color: emr.isFinalized ? '#34D399' : '#FF9F43', fontWeight: 700, fontSize: '0.65rem' }} />
                        </Box>
                        {emr.diagnosis && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>Diagnosis</Typography>
                            <Typography variant="body2" sx={{ mt: 0.25 }}>{emr.diagnosis}</Typography>
                          </Box>
                        )}
                        {emr.treatmentNotes && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>Treatment Notes</Typography>
                            <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>{emr.treatmentNotes}</Typography>
                          </Box>
                        )}
                      </Paper>
                    ))
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Lab Request Dialog */}
      <Dialog open={labDialog} onClose={() => setLabDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScienceIcon sx={{ color: '#A78BFA' }} />
            Request Lab Test
          </Box>
          <Typography variant="caption" color="text.secondary">
            For: {selectedPatient?.name || selectedPatient?.user?.name}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Test Type" required
                value={labForm.testType}
                onChange={(e) => setLabForm((p) => ({ ...p, testType: e.target.value }))}
              >
                {LAB_TESTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            {labForm.testType === 'Other' && (
              <Grid item xs={12}>
                <TextField fullWidth label="Custom Test Name" required
                  value={labForm.customTestName}
                  onChange={(e) => setLabForm((p) => ({ ...p, customTestName: e.target.value }))} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Priority"
                value={labForm.priority}
                onChange={(e) => setLabForm((p) => ({ ...p, priority: e.target.value }))}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT (Critical)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Clinical Notes"
                placeholder="Reason for request, symptoms, relevant history…"
                value={labForm.clinicalNotes}
                onChange={(e) => setLabForm((p) => ({ ...p, clinicalNotes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setLabDialog(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleLabSubmit} variant="contained" disabled={labLoading}
            startIcon={labLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ScienceIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#A78BFA', '&:hover': { bgcolor: '#9061ea' } }}>
            {labLoading ? 'Sending…' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientRecords;
