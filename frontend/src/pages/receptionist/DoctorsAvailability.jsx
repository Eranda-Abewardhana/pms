import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Stack,
  Button, Avatar, Chip, TextField, Skeleton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  InputAdornment, Alert, CircularProgress, useTheme, Badge,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDoctors, getDoctorAvailability, searchPatients, createAppointment } from '../../api/receptionistApi';
import { format, addDays } from 'date-fns';

const DEPT_COLORS = {
  Cardiology: '#ef4444',
  Neurology: '#8b5cf6',
  Orthopedics: '#f59e0b',
  Pediatrics: '#10b981',
  Gynecology: '#ec4899',
  Dermatology: '#06b6d4',
  General: '#3b82f6',
  ENT: '#84cc16',
};

const getDeptColor = (dept) => DEPT_COLORS[dept] || '#6b7280';

const SlotButton = ({ slot, isBooked, selected, onClick }) => (
  <Tooltip title={isBooked ? 'Already booked' : `Book ${slot}`} placement="top">
    <Button
      size="small"
      variant={selected ? 'contained' : 'outlined'}
      disabled={isBooked}
      onClick={() => !isBooked && onClick(slot)}
      startIcon={
        isBooked
          ? <BlockIcon sx={{ fontSize: 12 }} />
          : selected
          ? <CheckCircleIcon sx={{ fontSize: 12 }} />
          : <AccessTimeIcon sx={{ fontSize: 12 }} />
      }
      sx={{
        fontSize: '0.72rem',
        fontWeight: 700,
        py: 0.6,
        px: 1,
        borderRadius: 1.5,
        minWidth: 'auto',
        ...(isBooked && {
          opacity: 0.4,
          bgcolor: 'transparent',
          borderColor: 'divider',
          color: 'text.disabled',
        }),
        ...(selected && !isBooked && {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderColor: 'transparent',
        }),
      }}
    >
      {slot}
    </Button>
  </Tooltip>
);

const DoctorCard = ({ doctor, onCheckAvailability }) => {
  const theme = useTheme();
  const color = getDeptColor(doctor.department || doctor.specialization);
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            sx={{ width: 52, height: 52, bgcolor: `${color}20`, color, fontWeight: 800, fontSize: '1.2rem' }}
          >
            {doctor.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Dr. {doctor.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {doctor.email}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
          {doctor.specialization && (
            <Chip
              label={doctor.specialization}
              size="small"
              sx={{ bgcolor: `${color}15`, color, fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
          {doctor.department && doctor.department !== doctor.specialization && (
            <Chip
              label={doctor.department}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', fontWeight: 600 }}
            />
          )}
        </Stack>
        {doctor.phone && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            📞 {doctor.phone}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onCheckAvailability(doctor)}
          startIcon={<EventIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          Check Availability
        </Button>
      </CardActions>
    </Card>
  );
};

export default function DoctorsAvailability() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Availability Dialog
  const [availDialog, setAvailDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Booking Dialog
  const [bookDialog, setBookDialog] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bookingReason, setBookingReason] = useState('');
  const [bookingType, setBookingType] = useState('OPD');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getDoctors()
      .then((res) => setDoctors(res.data?.doctors || []))
      .catch(console.error)
      .finally(() => setLoadingDoctors(false));
  }, []);

  const handleCheckAvailability = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setAvailability(null);
    setAvailDialog(true);
    await fetchSlots(doctor._id, selectedDate);
  };

  const fetchSlots = async (doctorId, date) => {
    setLoadingSlots(true);
    try {
      const res = await getDoctorAvailability(doctorId, date);
      setAvailability(res.data);
    } catch (err) {
      toast.error('Could not fetch availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor) fetchSlots(selectedDoctor._id, date);
  };

  // Patient search with debounce
  const patientDebounce = React.useRef(null);
  const handlePatientSearch = (val) => {
    setPatientQuery(val);
    setSelectedPatient(null);
    if (patientDebounce.current) clearTimeout(patientDebounce.current);
    if (!val.trim()) { setPatientResults([]); return; }
    patientDebounce.current = setTimeout(async () => {
      setSearchingPatient(true);
      try {
        const res = await searchPatients({ search: val, limit: 5 });
        setPatientResults(res.data?.patients || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingPatient(false);
      }
    }, 400);
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    setBooking(true);
    try {
      await createAppointment({
        patientId: selectedPatient._id,
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        type: bookingType,
        reason: bookingReason,
      });
      toast.success(`Appointment booked for ${selectedPatient.name} with Dr. ${selectedDoctor.name} at ${selectedSlot}`);
      setBookDialog(false);
      setAvailDialog(false);
      setSelectedPatient(null);
      setPatientQuery('');
      setPatientResults([]);
      setBookingReason('');
      setSelectedSlot('');
      // Refresh slots
      fetchSlots(selectedDoctor._id, selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    !doctorSearch ||
    d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.department?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  // Quick dates
  const quickDates = [0, 1, 2, 3, 4].map((i) => ({
    label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(addDays(new Date(), i), 'EEE, MMM d'),
    value: format(addDays(new Date(), i), 'yyyy-MM-dd'),
  }));

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
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Doctors Availability
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loadingDoctors ? 'Loading…' : `${doctors.length} active doctor${doctors.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
      </Stack>

      {/* ── Search Doctors ────────────────────────────── */}
      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          id="doctor-search"
          placeholder="Filter by doctor name, specialization or department…"
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
          }}
        />
      </Card>

      {/* ── Doctor Cards ──────────────────────────────── */}
      <Grid container spacing={3}>
        {loadingDoctors ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Skeleton variant="circular" width={52} height={52} />
                  <Box sx={{ flex: 1 }}><Skeleton height={24} /><Skeleton width="60%" /></Box>
                </Stack>
                <Skeleton height={36} />
              </Card>
            </Grid>
          ))
        ) : filteredDoctors.length === 0 ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No doctors found{doctorSearch ? ` matching "${doctorSearch}"` : ''}
            </Alert>
          </Grid>
        ) : (
          filteredDoctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor._id}>
              <DoctorCard doctor={doctor} onCheckAvailability={handleCheckAvailability} />
            </Grid>
          ))
        )}
      </Grid>

      {/* ── Availability Dialog ───────────────────────── */}
      <Dialog
        open={availDialog}
        onClose={() => { setAvailDialog(false); setSelectedSlot(''); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: getDeptColor(selectedDoctor?.department || selectedDoctor?.specialization) + '20', color: getDeptColor(selectedDoctor?.department || selectedDoctor?.specialization) }}>
              <LocalHospitalIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Dr. {selectedDoctor?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedDoctor?.specialization} · Check appointment slots
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {/* Quick Date Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2, mt: 1 }}>
            {quickDates.map((d) => (
              <Chip
                key={d.value}
                label={d.label}
                clickable
                onClick={() => handleDateChange(d.value)}
                variant={selectedDate === d.value ? 'filled' : 'outlined'}
                color={selectedDate === d.value ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>

          {/* Date Picker */}
          <TextField
            fullWidth
            id="avail-date"
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Available Time Slots — {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </Typography>

          {loadingSlots ? (
            <Grid container spacing={1}>
              {Array.from({ length: 12 }).map((_, i) => <Grid item key={i}><Skeleton width={72} height={36} /></Grid>)}
            </Grid>
          ) : availability ? (
            <>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {/* Morning slots */}
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🌅 Morning
                  </Typography>
                </Grid>
                {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'].map((slot) => (
                  <Grid item key={slot}>
                    <SlotButton
                      slot={slot}
                      isBooked={availability.bookedSlots?.includes(slot)}
                      selected={selectedSlot === slot}
                      onClick={setSelectedSlot}
                    />
                  </Grid>
                ))}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🌆 Afternoon
                  </Typography>
                </Grid>
                {['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map((slot) => (
                  <Grid item key={slot}>
                    <SlotButton
                      slot={slot}
                      isBooked={availability.bookedSlots?.includes(slot)}
                      selected={selectedSlot === slot}
                      onClick={setSelectedSlot}
                    />
                  </Grid>
                ))}
              </Grid>

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: '#10b981' }} />
                  <Typography variant="caption">Available ({availability.availableSlots?.length || 0})</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'text.disabled', opacity: 0.4 }} />
                  <Typography variant="caption">Booked ({availability.bookedSlots?.length || 0})</Typography>
                </Stack>
                {selectedSlot && (
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <CheckCircleIcon sx={{ fontSize: 12, color: '#10b981' }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>Selected: {selectedSlot}</Typography>
                  </Stack>
                )}
              </Stack>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setAvailDialog(false)} variant="outlined" sx={{ flex: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
            Close
          </Button>
          <Button
            variant="contained"
            disabled={!selectedSlot}
            onClick={() => setBookDialog(true)}
            startIcon={<EventIcon />}
            sx={{ flex: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Book {selectedSlot ? `at ${selectedSlot}` : 'Slot'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Booking Dialog ────────────────────────────── */}
      <Dialog
        open={bookDialog}
        onClose={() => !booking && setBookDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Book Appointment</Typography>
          <Typography variant="caption" color="text.secondary">
            Dr. {selectedDoctor?.name} · {selectedDate} · {selectedSlot}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Patient Search */}
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5, mt: 1 }}>
            Patient *
          </Typography>
          <TextField
            fullWidth
            id="book-patient-search"
            placeholder="Search patient by name or ID…"
            value={selectedPatient ? selectedPatient.name : patientQuery}
            onChange={(e) => { setSelectedPatient(null); handlePatientSearch(e.target.value); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><PersonSearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: searchingPatient ? <CircularProgress size={16} /> : null,
            }}
            sx={{ mb: selectedPatient ? 1 : 0 }}
          />
          {selectedPatient && (
            <Chip
              label={`${selectedPatient.name} (${selectedPatient.patientId})`}
              onDelete={() => { setSelectedPatient(null); setPatientQuery(''); }}
              color="primary"
              size="small"
              sx={{ mb: 2, fontWeight: 700 }}
            />
          )}
          {patientResults.length > 0 && !selectedPatient && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
              {patientResults.map((p, i) => (
                <Box
                  key={p._id}
                  onClick={() => { setSelectedPatient(p); setPatientQuery(''); setPatientResults([]); }}
                  sx={{ px: 2, py: 1.5, cursor: 'pointer', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' }, borderBottom: i < patientResults.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.patientId} · {p.phone}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Appointment Type */}
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Type
          </Typography>
          <TextField
            fullWidth
            id="booking-type"
            select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            sx={{ mb: 2 }}
          >
            {['OPD', 'Consultation', 'Follow-up', 'Emergency'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          {/* Reason */}
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Reason (optional)
          </Typography>
          <TextField
            fullWidth
            id="booking-reason"
            multiline
            rows={2}
            placeholder="Chief complaint or reason for visit"
            value={bookingReason}
            onChange={(e) => setBookingReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setBookDialog(false)} disabled={booking} variant="outlined" sx={{ flex: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBookAppointment}
            disabled={booking || !selectedPatient}
            startIcon={booking ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <CheckCircleIcon />}
            sx={{ flex: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {booking ? 'Booking…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
