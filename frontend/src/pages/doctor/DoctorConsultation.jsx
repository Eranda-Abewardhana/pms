import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Grid, Button, TextField, Chip, Stack,
  CircularProgress, Alert, Divider, IconButton, Paper, Tooltip,
  MenuItem, Stepper, Step, StepLabel, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEMRByAppointment, createEMR, updateEMR,
  completeAppointment, clearEMRState,
} from '../../features/doctor/doctorSlice';
import { fetchAllAppointments } from '../../features/appointment/appointmentSlice';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PersonIcon from '@mui/icons-material/Person';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

const TEAL = '#00C6B3';
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6h', 'Every 8h', 'As needed (PRN)', 'At night', 'Before meals'];
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months', 'Ongoing'];

const emptyRx = () => ({ medicine: '', dosage: '', frequency: 'Twice daily', duration: '7 days', instructions: '' });

const DoctorConsultation = () => {
  const { appointmentId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentEMR, emrLoading, emrSaving, emrError, emrSuccess, sessionLoading } = useSelector((s) => s.doctor);
  const { appointments } = useSelector((s) => s.appointment);

  const appointment = appointments.find((a) => String(a.id) === String(appointmentId));

  const [form, setForm] = useState({
    chiefComplaint: '',
    diagnosis: '',
    icdCode: '',
    treatmentNotes: '',
    followUpDate: '',
    followUpNotes: '',
    prescriptions: [emptyRx()],
    isFinalized: false,
  });
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    dispatch(fetchEMRByAppointment(appointmentId));
    if (!appointment) dispatch(fetchAllAppointments({ page: 1, limit: 100 }));
    return () => { dispatch(clearEMRState()); };
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (currentEMR) {
      setForm({
        chiefComplaint: currentEMR.chiefComplaint || '',
        diagnosis: currentEMR.diagnosis || '',
        icdCode: currentEMR.icdCode || '',
        treatmentNotes: currentEMR.treatmentNotes || '',
        followUpDate: currentEMR.followUpDate ? currentEMR.followUpDate.slice(0, 10) : '',
        followUpNotes: currentEMR.followUpNotes || '',
        prescriptions: currentEMR.prescriptions?.length ? currentEMR.prescriptions : [emptyRx()],
        isFinalized: currentEMR.isFinalized || false,
      });
    }
  }, [currentEMR]);

  useEffect(() => {
    if (emrSuccess) { setSuccess(emrSuccess); setTimeout(() => setSuccess(''), 4000); }
  }, [emrSuccess]);

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRx = (idx, field) => (e) => {
    setForm((f) => {
      const rxs = [...f.prescriptions];
      rxs[idx] = { ...rxs[idx], [field]: e.target.value };
      return { ...f, prescriptions: rxs };
    });
  };

  const addRx = () => setForm((f) => ({ ...f, prescriptions: [...f.prescriptions, emptyRx()] }));
  const removeRx = (idx) => setForm((f) => ({ ...f, prescriptions: f.prescriptions.filter((_, i) => i !== idx) }));

  const buildPayload = (finalize = false) => ({
    appointment: appointmentId,
    patient: appointment?.patientId || currentEMR?.patientId,
    chiefComplaint: form.chiefComplaint,
    diagnosis: form.diagnosis,
    icdCode: form.icdCode,
    treatmentNotes: form.treatmentNotes,
    followUpDate: form.followUpDate || null,
    followUpNotes: form.followUpNotes,
    prescriptions: form.prescriptions.filter((rx) => rx.medicine.trim()),
    isFinalized: finalize,
  });

  const handleSaveDraft = async () => {
    const payload = buildPayload(false);
    if (currentEMR?.id) {
      await dispatch(updateEMR({ id: currentEMR.id, data: payload }));
    } else {
      await dispatch(createEMR(payload));
    }
  };

  const handleFinalize = async () => {
    setConfirmFinalize(false);
    const payload = buildPayload(true);
    let result;
    if (currentEMR?.id) {
      result = await dispatch(updateEMR({ id: currentEMR.id, data: payload }));
    } else {
      result = await dispatch(createEMR(payload));
    }
    if (!result.error) {
      await dispatch(completeAppointment(appointmentId));
      setSuccess('Consultation finalized. Appointment marked complete!');
      setTimeout(() => navigate('/doctor'), 2000);
    }
  };

  const patient = appointment?.patient || currentEMR?.patient;
  const isFinalized = form.isFinalized;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate('/doctor')} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" fontWeight={800}>Consultation</Typography>
          <Typography variant="body2" color="text.secondary">
            Appointment #{appointmentId} {appointment?.date ? `• ${new Date(appointment.date).toLocaleDateString()}` : ''}
          </Typography>
        </Box>
        {isFinalized && <Chip label="Finalized" color="success" icon={<CheckCircleIcon />} />}
      </Stack>

      {/* Patient Info Card */}
      {patient && (
        <Card sx={{ p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: `${TEAL}22`, color: TEAL, width: 52, height: 52, fontWeight: 700 }}>
            {(patient.name || patient.user?.name || '?')[0].toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography fontWeight={700}>{patient.name || patient.user?.name}</Typography>
            <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
              {patient.patientId && <Chip label={patient.patientId} size="small" sx={{ bgcolor: `${TEAL}15`, color: TEAL, fontWeight: 600 }} />}
              {patient.gender && <Chip label={patient.gender} size="small" sx={{ textTransform: 'capitalize' }} />}
              {patient.bloodGroup && <Chip label={`Blood: ${patient.bloodGroup}`} size="small" color="error" variant="outlined" />}
              {(patient.allergies || []).map((a, i) => <Chip key={i} label={a} size="small" color="warning" variant="outlined" />)}
            </Stack>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Appointment Time</Typography>
            <Typography fontWeight={700}>{appointment?.timeSlot || '—'}</Typography>
          </Box>
        </Card>
      )}

      {emrLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: TEAL }} /></Box>}
      {!emrLoading && (
        <Grid container spacing={3}>
          {/* Left Column — Diagnosis */}
          <Grid item xs={12} lg={7}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                <MedicalServicesIcon sx={{ color: TEAL }} />
                <Typography variant="h6" fontWeight={700}>Clinical Notes</Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={2} label="Chief Complaint" value={form.chiefComplaint}
                    onChange={handleField('chiefComplaint')} disabled={isFinalized}
                    placeholder="Patient's primary reason for visit…" />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField fullWidth label="Diagnosis" value={form.diagnosis}
                    onChange={handleField('diagnosis')} disabled={isFinalized}
                    placeholder="e.g. Type 2 Diabetes Mellitus" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="ICD Code" value={form.icdCode}
                    onChange={handleField('icdCode')} disabled={isFinalized}
                    placeholder="e.g. E11.9" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={3} label="Treatment Notes" value={form.treatmentNotes}
                    onChange={handleField('treatmentNotes')} disabled={isFinalized}
                    placeholder="Treatment plan, observations, advice…" />
                </Grid>
              </Grid>
            </Card>

            {/* Follow-up */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Follow-up</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField fullWidth type="date" label="Follow-up Date" InputLabelProps={{ shrink: true }}
                    value={form.followUpDate} onChange={handleField('followUpDate')} disabled={isFinalized} />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField fullWidth label="Follow-up Notes" value={form.followUpNotes}
                    onChange={handleField('followUpNotes')} disabled={isFinalized}
                    placeholder="Instructions for next visit…" />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Right Column — Prescriptions */}
          <Grid item xs={12} lg={5}>
            <Card sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MonitorHeartIcon sx={{ color: TEAL }} />
                  <Typography variant="h6" fontWeight={700}>Prescriptions</Typography>
                </Stack>
                {!isFinalized && (
                  <Button size="small" startIcon={<AddIcon />} onClick={addRx}
                    sx={{ color: TEAL, textTransform: 'none', fontWeight: 700 }}>
                    Add Medicine
                  </Button>
                )}
              </Stack>

              <Stack spacing={2}>
                {form.prescriptions.map((rx, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                      #{idx + 1}
                    </Typography>
                    {!isFinalized && form.prescriptions.length > 1 && (
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => removeRx(idx)}
                          sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Medicine Name" value={rx.medicine}
                          onChange={handleRx(idx, 'medicine')} disabled={isFinalized} placeholder="e.g. Metformin 500mg" />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Dosage" value={rx.dosage}
                          onChange={handleRx(idx, 'dosage')} disabled={isFinalized} placeholder="e.g. 1 tablet" />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" select label="Frequency" value={rx.frequency}
                          onChange={handleRx(idx, 'frequency')} disabled={isFinalized}>
                          {FREQUENCIES.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" select label="Duration" value={rx.duration}
                          onChange={handleRx(idx, 'duration')} disabled={isFinalized}>
                          {DURATIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Instructions" value={rx.instructions}
                          onChange={handleRx(idx, 'instructions')} disabled={isFinalized} placeholder="e.g. After meals" />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12}>
            {(emrError) && <Alert severity="error" sx={{ mb: 2 }}>{emrError}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          </Grid>

          {/* Action Buttons */}
          {!isFinalized && (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSaveDraft}
                  disabled={emrSaving || sessionLoading}
                  sx={{ borderColor: TEAL, color: TEAL, fontWeight: 700, px: 3 }}>
                  {emrSaving ? <CircularProgress size={16} /> : 'Save Draft'}
                </Button>
                <Button variant="contained" startIcon={<CheckCircleIcon />}
                  onClick={() => setConfirmFinalize(true)}
                  disabled={!form.diagnosis.trim() || emrSaving || sessionLoading}
                  sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' }, fontWeight: 700, px: 3 }}>
                  Finalize & Complete
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      )}

      {/* Finalize Confirm Dialog */}
      <Dialog open={confirmFinalize} onClose={() => setConfirmFinalize(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Finalize Consultation?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will save the EMR as finalized and mark the appointment as <strong>completed</strong>. You won't be able to edit it afterwards.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmFinalize(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleFinalize} variant="contained" disabled={sessionLoading}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' } }}>
            {sessionLoading ? <CircularProgress size={16} /> : 'Yes, Finalize'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorConsultation;
