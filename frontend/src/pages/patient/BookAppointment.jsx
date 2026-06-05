import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, Chip, CircularProgress, Alert,
  Button, Avatar, TextField, MenuItem, Divider, InputAdornment,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctors, fetchAvailability, bookAppointment, clearBookingState, fetchMyProfile } from '../../features/patient/patientSlice';
import { toast } from 'react-toastify';

const reasons = ['General Consultation', 'Follow-up Visit', 'Lab Results Review', 'Specialist Referral', 'Vaccination', 'Other'];

const BookAppointment = () => {
  const dispatch = useDispatch();
  const { doctors, doctorsLoading, availability, availabilityLoading, bookingLoading, bookingSuccess, bookingError, myProfile } = useSelector((s) => s.patient);

  const [form, setForm] = useState({ doctorId: '', date: '', timeSlot: '', reason: '', notes: '' });

  useEffect(() => {
    dispatch(fetchDoctors());
    dispatch(fetchMyProfile());
  }, [dispatch]);

  useEffect(() => {
    if (bookingSuccess) {
      toast.success('Appointment booked successfully!');
      setForm({ doctorId: '', date: '', timeSlot: '', reason: '', notes: '' });
      dispatch(clearBookingState());
    }
    if (bookingError) toast.error(bookingError);
  }, [bookingSuccess, bookingError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'doctorId' || name === 'date') {
      const doctorId = name === 'doctorId' ? value : form.doctorId;
      const date = name === 'date' ? value : form.date;
      if (doctorId && date) dispatch(fetchAvailability({ doctorId, date }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.doctorId || !form.date || !form.timeSlot || !form.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!myProfile?._id) {
      toast.error('Your patient profile was not found. Please contact reception.');
      return;
    }
    dispatch(bookAppointment({ ...form, patientId: myProfile._id, type: 'OPD' }));
  };

  const selectedDoctor = doctors.find((d) => d._id === form.doctorId);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>Book Appointment</Typography>
        <Typography variant="body2" sx={{ color: '#8A94A6', mt: 0.5 }}>Schedule a consultation with one of our doctors</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>

                {/* Doctor */}
                <Grid item xs={12}>
                  <TextField
                    select fullWidth required
                    label="Select Doctor"
                    name="doctorId"
                    value={form.doctorId}
                    onChange={handleChange}
                    disabled={doctorsLoading}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                    InputLabelProps={{ sx: { color: '#8A94A6' } }}
                  >
                    {doctors.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#8A94A6' }}>{d.specialization || 'General Practitioner'}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Date */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth required
                    label="Preferred Date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true, sx: { color: '#8A94A6' } }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  />
                </Grid>

                {/* Time Slot */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select fullWidth required
                    label="Time Slot"
                    name="timeSlot"
                    value={form.timeSlot}
                    onChange={handleChange}
                    disabled={availabilityLoading || !form.doctorId || !form.date}
                    InputLabelProps={{ sx: { color: '#8A94A6' } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  >
                    {availabilityLoading ? (
                      <MenuItem disabled>Loading slots...</MenuItem>
                    ) : availability.availableSlots?.length === 0 ? (
                      <MenuItem disabled>No slots available</MenuItem>
                    ) : (
                      (availability.availableSlots || []).map((slot) => (
                        <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>

                {/* Reason */}
                <Grid item xs={12}>
                  <TextField
                    select fullWidth required
                    label="Reason for Visit"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    InputLabelProps={{ sx: { color: '#8A94A6' } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServicesIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  >
                    {reasons.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                </Grid>

                {/* Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={3}
                    label="Additional Notes (optional)"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    InputLabelProps={{ sx: { color: '#8A94A6' } }}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit" fullWidth variant="contained" size="large"
                    disabled={bookingLoading}
                    endIcon={bookingLoading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <CheckCircleOutlineIcon />}
                    sx={{
                      py: 1.6, fontWeight: 700, fontSize: '0.95rem',
                      background: 'linear-gradient(135deg,#00C6B3,#00A89A)',
                      boxShadow: '0 8px 24px rgba(0,198,179,0.3)',
                      borderRadius: '12px', textTransform: 'none',
                      '&:hover': { background: 'linear-gradient(135deg,#33D4C5,#00C6B3)', transform: 'translateY(-1px)' },
                      '&:disabled': { background: 'rgba(0,198,179,0.3)', color: 'rgba(255,255,255,0.5)' },
                      transition: 'all 0.2s',
                    }}
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {selectedDoctor && (
              <Card sx={{ p: 3, border: '1px solid rgba(0,198,179,0.2)', background: 'linear-gradient(135deg,rgba(0,198,179,0.05),#1A2236)' }}>
                <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Selected Doctor</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                  <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(0,198,179,0.2)', color: '#00C6B3', fontWeight: 800, fontSize: '1.1rem' }}>
                    {selectedDoctor.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#E8ECF4' }}>{selectedDoctor.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#00C6B3', fontWeight: 600 }}>{selectedDoctor.specialization || 'General Practitioner'}</Typography>
                    {selectedDoctor.department && <Typography variant="caption" sx={{ color: '#8A94A6', display: 'block' }}>{selectedDoctor.department}</Typography>}
                  </Box>
                </Box>
              </Card>
            )}

            {form.date && form.timeSlot && (
              <Card sx={{ p: 3, border: '1px solid rgba(75,158,255,0.2)', background: 'linear-gradient(135deg,rgba(75,158,255,0.05),#1A2236)' }}>
                <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Appointment Details</Typography>
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { label: 'Date', value: new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { label: 'Time', value: form.timeSlot },
                    { label: 'Type', value: 'OPD Consultation' },
                    form.reason && { label: 'Reason', value: form.reason },
                  ].filter(Boolean).map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#8A94A6' }}>{label}</Typography>
                      <Typography variant="caption" sx={{ color: '#E8ECF4', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            )}

            <Card sx={{ p: 3, background: 'rgba(255,159,67,0.06)', border: '1px solid rgba(255,159,67,0.2)' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF9F43', mb: 1 }}>📋 How it works</Typography>
              {['Select your preferred doctor', 'Pick an available date & time slot', 'Confirm your appointment', 'Arrive 10 mins early on the day'].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 0.75 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#FF9F43', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.1 }}>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.65rem' }}>{i + 1}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8A94A6', lineHeight: 1.5 }}>{step}</Typography>
                </Box>
              ))}
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.03)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(0,198,179,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#00C6B3' },
  },
  '& .MuiInputLabel-root': { color: '#8A94A6' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#00C6B3' },
  '& .MuiOutlinedInput-input': { color: '#E8ECF4' },
  '& .MuiSelect-icon': { color: '#8A94A6' },
};

export default BookAppointment;
