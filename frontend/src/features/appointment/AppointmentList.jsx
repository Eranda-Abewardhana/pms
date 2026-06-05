import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box, CircularProgress, Card,
  IconButton, Tooltip, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, Grid, Avatar,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyAppointments, fetchAllAppointments } from './appointmentSlice';
import { fetchDoctorAppointments } from '../doctor/doctorSlice';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AppointmentList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { role } = useSelector((state) => state.auth);

  const appointmentState = useSelector((state) => state.appointment);
  const doctorState = useSelector((state) => state.doctor);

  const appointments = (role === 'admin' || role === 'receptionist')
    ? (appointmentState.appointments || [])
    : role === 'patient'
    ? (appointmentState.appointments || [])
    : (doctorState.appointments || []);

  const loading = (role === 'admin' || role === 'receptionist' || role === 'patient') 
    ? appointmentState.loading 
    : doctorState.appointmentsLoading;
    
  const error = (role === 'admin' || role === 'receptionist' || role === 'patient')
    ? appointmentState.error
    : doctorState.appointmentsError;

  const [selectedApt, setSelectedApt] = useState(null);
  const containerRef = useRef(null);

  const loadData = () => {
    if (role === 'admin' || role === 'receptionist') {
      dispatch(fetchAllAppointments());
    } else if (role === 'patient') {
      dispatch(fetchMyAppointments());
    } else {
      dispatch(fetchDoctorAppointments());
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch, role]);

  useLayoutEffect(() => {
    if (!loading && appointments.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.list-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
        gsap.from('.appointment-row', { x: -20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, appointments]);

  const getStatusChip = (status) => {
    const configs = {
      completed: { color: 'success', label: 'Completed' },
      confirmed: { color: 'primary', label: 'Confirmed' },
      booked: { color: 'info', label: 'Booked' },
      cancelled: { color: 'error', label: 'Cancelled' },
      'in-consultation': { color: 'secondary', label: 'In Consultation' },
      arrived: { color: 'warning', label: 'Arrived' },
      'no-show': { color: 'default', label: 'No Show' },
    };
    const config = configs[status] || { color: 'default', label: status };
    return (
      <Chip
        label={config.label}
        size="small"
        color={config.color}
        sx={{
          fontWeight: 700,
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          borderRadius: '6px',
          backgroundColor: (theme) =>
            theme.palette[config.color]?.light || theme.palette[config.color]?.main,
          color: (theme) =>
            theme.palette[config.color]?.dark || theme.palette[config.color]?.contrastText,
        }}
      />
    );
  };

  const getPatientName = (apt) => {
    if (apt.patientId && typeof apt.patientId === 'object') return apt.patientId.name || '—';
    if (apt.patient && typeof apt.patient === 'object') return apt.patient.name || '—';
    return '—';
  };

  const getDoctorName = (apt) => {
    if (apt.doctorId && typeof apt.doctorId === 'object') return apt.doctorId.name || '—';
    return '—';
  };

  const formatDate = (d) => {
    try { return d ? format(new Date(d), 'EEEE, MMMM dd, yyyy') : 'N/A'; }
    catch { return 'N/A'; }
  };

  if (loading && appointments.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 10 }}>
        <CircularProgress size={40} thickness={4} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>{t('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box ref={containerRef}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} className="list-header">
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5, color: 'text.primary' }}>
            {t('appointments')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role === 'doctor'
              ? 'Manage and view your scheduled patient consultations'
              : 'Manage and view scheduled medical consultations'}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff1f2', border: '1px solid #fecaca', borderRadius: 2 }}>
          <Typography color="error.main" variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
        </Paper>
      )}

      <Card sx={{ overflow: 'hidden' }} className="dashboard-section">
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Appointment ID</TableCell>
                <TableCell>{role === 'patient' ? t('doctor') : 'Patient'}</TableCell>
                <TableCell>Scheduled Date</TableCell>
                <TableCell>Time Slot</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ opacity: 0.5 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>No appointments found</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role === 'doctor'
                          ? 'Your appointments will appear here once scheduled.'
                          : 'Once appointments are scheduled, they will appear here.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((apt) => (
                  <TableRow key={apt._id} hover className="appointment-row">
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                      #{apt.appointmentId}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {role === 'patient' ? getDoctorName(apt) : getPatientName(apt)}
                      </Typography>
                      {role === 'patient' && apt.doctorId?.specialization && (
                        <Typography variant="caption" color="text.secondary">{apt.doctorId.specialization}</Typography>
                      )}
                      {role !== 'patient' && apt.patientId?.patientId && (
                        <Typography variant="caption" color="text.secondary">{apt.patientId.patientId}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {apt.date ? format(new Date(apt.date), 'MMM dd, yyyy') : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{apt.timeSlot}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{apt.type || 'OPD'}</Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(apt.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => setSelectedApt(apt)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Appointment Detail Dialog ── */}
      <Dialog
        open={!!selectedApt}
        onClose={() => setSelectedApt(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedApt && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <EventNoteIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Appointment Details
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{selectedApt.appointmentId}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  {getStatusChip(selectedApt.status)}
                </Box>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2.5}>
                {/* Patient / Doctor */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {role === 'patient' ? 'Doctor' : 'Patient'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {role === 'patient' ? getDoctorName(selectedApt) : getPatientName(selectedApt)}
                      </Typography>
                      {role === 'patient' && selectedApt.doctorId?.specialization && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedApt.doctorId.specialization}
                        </Typography>
                      )}
                      {role !== 'patient' && selectedApt.patientId?.patientId && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {selectedApt.patientId.patientId}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Grid>

                {/* Date */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventNoteIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Scheduled Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatDate(selectedApt.date)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Time Slot */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Time Slot</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedApt.timeSlot || '—'}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Type */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalHospitalIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Appointment Type</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedApt.type || 'OPD'}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Queue Number */}
                {selectedApt.queueNumber && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Queue Number</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>#{selectedApt.queueNumber}</Typography>
                    </Box>
                  </Grid>
                )}

                {/* Booked By */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Booked By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                      {selectedApt.bookedBy || '—'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Payment Status */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Payment Status</Typography>
                    <Chip
                      label={selectedApt.paymentStatus || 'pending'}
                      size="small"
                      color={selectedApt.paymentStatus === 'paid' ? 'success' : 'warning'}
                      sx={{ mt: 0.5, textTransform: 'capitalize', fontWeight: 700 }}
                    />
                  </Box>
                </Grid>

                {/* Reason */}
                {selectedApt.reason && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Reason / Chief Complaint</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                      {selectedApt.reason}
                    </Typography>
                  </Grid>
                )}

                {/* Notes */}
                {selectedApt.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Notes</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.7, color: 'text.secondary' }}>
                      {selectedApt.notes}
                    </Typography>
                  </Grid>
                )}

                {/* Patient contact info if populated */}
                {role !== 'patient' && selectedApt.patientId && typeof selectedApt.patientId === 'object' && (
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                      Patient Contact
                    </Typography>
                    <Stack direction="row" spacing={3}>
                      {selectedApt.patientId.phone && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedApt.patientId.phone}</Typography>
                        </Box>
                      )}
                      {selectedApt.patientId.bloodGroup && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedApt.patientId.bloodGroup}</Typography>
                        </Box>
                      )}
                      {selectedApt.patientId.gender && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Gender</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {selectedApt.patientId.gender}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button variant="outlined" onClick={() => setSelectedApt(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AppointmentList;
