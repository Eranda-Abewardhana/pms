import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, MenuItem, useTheme,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatientQueue, callPatient } from '../../features/nurse/nurseSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  scheduled:       { label: 'Scheduled',      color: '#4B9EFF', bg: 'rgba(75,158,255,0.12)' },
  waiting:         { label: 'Waiting',         color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
  'in-consultation': { label: 'In Consultation', color: '#00C6B3', bg: 'rgba(0,198,179,0.12)' },
  completed:       { label: 'Completed',       color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  cancelled:       { label: 'Cancelled',       color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
};

const AppointmentQueue = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { queue, queueLoading } = useSelector((s) => s.nurse);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, appt: null, newStatus: '' });

  useEffect(() => {
    dispatch(fetchPatientQueue());
  }, [dispatch]);

  const handleRefresh = () => dispatch(fetchPatientQueue());

  const filtered = queue.filter((a) => {
    const name = a.patientId?.name || a.patientId?.user?.name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (a.appointmentId || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (appt, newStatus) => {
    setConfirmDialog({ open: true, appt, newStatus });
  };

  const confirmChange = async () => {
    const { appt, newStatus } = confirmDialog;
    setConfirmDialog({ open: false, appt: null, newStatus: '' });
    const result = await dispatch(callPatient({ id: appt._id, status: newStatus }));
    if (callPatient.fulfilled.match(result)) {
      toast.success(`Patient status updated to "${newStatus}"`);
    } else {
      toast.error(result.payload || 'Failed to update status');
    }
  };

  const waiting = queue.filter((a) => a.status === 'waiting' || a.status === 'scheduled').length;
  const inConsultation = queue.filter((a) => a.status === 'in-consultation').length;
  const completed = queue.filter((a) => a.status === 'completed').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
            Appointment Queue
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Manage and call patients for today — {format(new Date(), 'MMMM d, yyyy')}
          </Typography>
        </Box>
        <Tooltip title="Refresh Queue">
          <IconButton
            onClick={handleRefresh}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              color: theme.palette.text.secondary,
              '&:hover': { color: '#00C6B3', borderColor: '#00C6B3', bgcolor: 'rgba(0,198,179,0.08)' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary chips */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: `${queue.length} Total`, color: '#8A94A6', bg: 'rgba(138,148,166,0.12)' },
          { label: `${waiting} Waiting`, color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
          { label: `${inConsultation} In Consultation`, color: '#00C6B3', bg: 'rgba(0,198,179,0.12)' },
          { label: `${completed} Completed`, color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
        ].map((c) => (
          <Chip key={c.label} label={c.label} sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: '0.78rem' }} />
        ))}
      </Stack>

      {/* Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 3, borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
          display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by patient name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <TextField
          select size="small" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 160 }}
          label="Filter Status"
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <MenuItem key={k} value={k}>{v.label}</MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
          overflow: 'hidden',
        }}
      >
        {queueLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Queue #', 'Patient', 'Appointment ID', 'Doctor', 'Time', 'Type', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem', py: 2 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <EventNoteIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No appointments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((appt) => {
                  const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
                  const patientName = appt.patientId?.name || appt.patientId?.user?.name || 'Unknown';
                  const doctorName = appt.doctorId?.name || 'Unknown';
                  const canCall = appt.status === 'scheduled' || appt.status === 'waiting';
                  const canComplete = appt.status === 'in-consultation';

                  return (
                    <TableRow
                      key={appt._id}
                      sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}
                    >
                      <TableCell>
                        <Box sx={{
                          width: 34, height: 34, borderRadius: '8px',
                          bgcolor: 'rgba(0,198,179,0.12)', color: '#00C6B3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.9rem',
                        }}>
                          {appt.queueNumber || '—'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(75,158,255,0.15)', color: '#4B9EFF', fontSize: '0.8rem', fontWeight: 700 }}>
                            {patientName[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                              {patientName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {appt.appointmentId || '—'}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem' }}>Dr. {doctorName}</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem', fontWeight: 600 }}>
                        {appt.timeSlot || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={appt.type || 'OPD'} size="small"
                          sx={{ bgcolor: 'rgba(167,139,250,0.12)', color: '#A78BFA', fontWeight: 600, fontSize: '0.68rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sc.label} size="small"
                          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {canCall && (
                            <Tooltip title="Call Patient">
                              <Button
                                size="small" variant="contained"
                                startIcon={<RecordVoiceOverIcon fontSize="small" />}
                                onClick={() => handleStatusChange(appt, 'in-consultation')}
                                sx={{
                                  bgcolor: '#00C6B3', fontWeight: 700, fontSize: '0.7rem', py: 0.5,
                                  '&:hover': { bgcolor: '#00a896' },
                                }}
                              >
                                Call
                              </Button>
                            </Tooltip>
                          )}
                          {canComplete && (
                            <Tooltip title="Mark Complete">
                              <Button
                                size="small" variant="outlined"
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                onClick={() => handleStatusChange(appt, 'completed')}
                                sx={{
                                  borderColor: '#34D399', color: '#34D399', fontWeight: 700, fontSize: '0.7rem', py: 0.5,
                                  '&:hover': { borderColor: '#34D399', bgcolor: 'rgba(52,211,153,0.08)' },
                                }}
                              >
                                Done
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, appt: null, newStatus: '' })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmDialog.newStatus === 'in-consultation' ? 'Call Patient?' : 'Mark as Completed?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmDialog.newStatus === 'in-consultation'
              ? `Call ${confirmDialog.appt?.patientId?.name || confirmDialog.appt?.patientId?.user?.name || 'this patient'} into the consultation room?`
              : `Mark consultation for ${confirmDialog.appt?.patientId?.name || confirmDialog.appt?.patientId?.user?.name || 'this patient'} as complete?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog({ open: false, appt: null, newStatus: '' })}
            sx={{ textTransform: 'none', color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmChange} variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#00C6B3', '&:hover': { bgcolor: '#00a896' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentQueue;
