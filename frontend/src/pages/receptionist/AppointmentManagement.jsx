import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Grid, Stack, Chip, CircularProgress,
  Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, IconButton, Tooltip, Alert, Divider, Paper, Avatar,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllAppointments } from '../../features/appointment/appointmentSlice';
import axiosInstance from '../../api/axiosInstance';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import { toast } from 'react-toastify';

const TEAL = '#00C6B3';
const STATUS_COLORS = {
  booked: { bgcolor: '#EEF2FF', color: '#4F46E5' },
  confirmed: { bgcolor: '#F0FDF4', color: '#16A34A' },
  'in-consultation': { bgcolor: '#FFF7ED', color: '#EA580C' },
  completed: { bgcolor: '#F0FDF4', color: '#15803D' },
  cancelled: { bgcolor: '#FEF2F2', color: '#DC2626' },
  arrived: { bgcolor: '#F0F9FF', color: '#0284C7' },
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const AppointmentManagement = () => {
  const dispatch = useDispatch();
  const { appointments, total, loading } = useSelector((s) => s.appointment);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialogs
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [newForm, setNewForm] = useState({ patientId: '', doctorId: '', date: '', timeSlot: '', notes: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', timeSlot: '' });

  useEffect(() => {
    axiosInstance.get('/users/doctors').then((r) => setDoctors(r.data.data?.doctors || [])).catch(() => {});
    axiosInstance.get('/patients?limit=200').then((r) => setPatients(r.data.data?.patients || [])).catch(() => {});
  }, []);

  const load = (p = page) => {
    const params = { page: p, limit };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchAllAppointments(params));
  };

  useEffect(() => { load(); }, [page, statusFilter]);

  const handleSchedule = async () => {
    setSaving(true);
    try {
      await axiosInstance.post('/appointments', newForm);
      toast.success('Appointment scheduled!');
      setScheduleOpen(false);
      setNewForm({ patientId: '', doctorId: '', date: '', timeSlot: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule appointment');
    } finally { setSaving(false); }
  };

  const handleReschedule = async () => {
    setSaving(true);
    try {
      await axiosInstance.put(`/appointments/${selected.id}`, rescheduleForm);
      toast.success('Appointment rescheduled!');
      setRescheduleOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally { setSaving(false); }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`/appointments/${cancelTarget.id}/status`, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setSaving(false); }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.patient?.name || '').toLowerCase().includes(q) ||
      (a.doctor?.name || '').toLowerCase().includes(q) ||
      (a.appointmentId || '').toLowerCase().includes(q)
    );
  });

  const TIME_SLOTS = [
    '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM',
    '11:00 AM','11:30 AM','12:00 PM','12:30 PM','02:00 PM','02:30 PM',
    '03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM',
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Appointment Management</Typography>
          <Typography variant="body2" color="text.secondary">{total} total appointments</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Print Daily Schedule"><IconButton onClick={handlePrint} sx={{ border: '1px solid', borderColor: 'divider' }}><PrintIcon /></IconButton></Tooltip>
          <Tooltip title="Refresh"><IconButton onClick={() => load()} sx={{ border: '1px solid', borderColor: 'divider' }}><RefreshIcon /></IconButton></Tooltip>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setScheduleOpen(true)}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' }, fontWeight: 700 }}>
            New Appointment
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: 2 }}>
        <EventIcon sx={{ color: TEAL }} />
        <TextField size="small" placeholder="Search patient, doctor, ID…" value={search}
          onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(1)}
          sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
        <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All</MenuItem>
          {['booked','confirmed','arrived','in-consultation','completed','cancelled'].map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
          ))}
        </TextField>
        <Button variant="contained" size="small" onClick={() => { setPage(1); load(1); }}
          sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' }, textTransform: 'none' }}>Apply</Button>
      </Paper>

      {/* Table */}
      <Card sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Appt ID</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <EventIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                      <Typography color="text.secondary">No appointments found</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((apt) => {
                  const sc = STATUS_COLORS[apt.status] || {};
                  return (
                    <TableRow key={apt.id} hover>
                      <TableCell><Typography variant="caption" fontWeight={700} color="primary">{apt.appointmentId}</Typography></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 30, height: 30, bgcolor: `${TEAL}22`, color: TEAL, fontSize: 13, fontWeight: 700 }}>
                            {(apt.patient?.name || '?')[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{apt.patient?.name || '—'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2">{apt.doctor?.name || '—'}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{fmt(apt.date)}</Typography>
                        <Typography variant="caption" color="text.secondary">{apt.timeSlot}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={apt.status} size="small" sx={{ ...sc, fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {!['completed','cancelled'].includes(apt.status) && (
                            <>
                              <Tooltip title="Reschedule">
                                <IconButton size="small" color="primary" onClick={() => {
                                  setSelected(apt);
                                  setRescheduleForm({ date: apt.date?.slice(0, 10) || '', timeSlot: apt.timeSlot || '' });
                                  setRescheduleOpen(true);
                                }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel">
                                <IconButton size="small" color="error" onClick={() => setCancelTarget(apt)}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Pagination */}
      {Math.ceil(total / limit) > 1 && (
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
          <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} sx={{ textTransform: 'none' }}>← Prev</Button>
          <Typography variant="body2" sx={{ py: 0.5, px: 1 }}>Page {page} of {Math.ceil(total / limit)}</Typography>
          <Button size="small" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)} sx={{ textTransform: 'none', color: TEAL }}>Next →</Button>
        </Stack>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Patient" value={newForm.patientId} onChange={(e) => setNewForm((f) => ({ ...f, patientId: e.target.value }))}>
                {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} — {p.patientId}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Doctor" value={newForm.doctorId} onChange={(e) => setNewForm((f) => ({ ...f, doctorId: e.target.value }))}>
                {doctors.map((d) => <MenuItem key={d.id} value={d.id}>{d.name} {d.specialization ? `— ${d.specialization}` : ''}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={newForm.date} onChange={(e) => setNewForm((f) => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Time Slot" value={newForm.timeSlot} onChange={(e) => setNewForm((f) => ({ ...f, timeSlot: e.target.value }))}>
                {TIME_SLOTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Notes (optional)" value={newForm.notes} onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSchedule} variant="contained" disabled={saving || !newForm.patientId || !newForm.doctorId || !newForm.date}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' } }}>
            {saving ? <CircularProgress size={16} /> : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth type="date" label="New Date" InputLabelProps={{ shrink: true }} value={rescheduleForm.date} onChange={(e) => setRescheduleForm((f) => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="New Time Slot" value={rescheduleForm.timeSlot} onChange={(e) => setRescheduleForm((f) => ({ ...f, timeSlot: e.target.value }))}>
                {TIME_SLOTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRescheduleOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleReschedule} variant="contained" disabled={saving}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' } }}>
            {saving ? <CircularProgress size={16} /> : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirm */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to cancel the appointment for <strong>{cancelTarget?.patient?.name}</strong> on {fmt(cancelTarget?.date)}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)} variant="outlined">No, Keep It</Button>
          <Button onClick={handleCancel} variant="contained" color="error" disabled={saving}>
            {saving ? <CircularProgress size={16} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement;
