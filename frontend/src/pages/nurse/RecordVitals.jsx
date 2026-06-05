import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Autocomplete,
  CircularProgress, Alert, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar, Divider,
  InputAdornment, LinearProgress, useTheme,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ScaleIcon from '@mui/icons-material/Scale';
import AirIcon from '@mui/icons-material/Air';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatients, submitVitals, fetchVitalsByPatient, clearNurseSuccess, clearNurseError } from '../../features/nurse/nurseSlice';
import { fetchPatientQueue } from '../../features/nurse/nurseSlice';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  systolic: '', diastolic: '',
  temperature: '',
  pulse: '',
  respiratoryRate: '',
  oxygenSaturation: '',
  weight: '',
  height: '',
  notes: '',
};

const VitalField = ({ icon, label, value, onChange, name, unit, min, max, color, type = 'number' }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 2, borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        transition: 'border-color 0.2s',
        '&:focus-within': { borderColor: color || '#00C6B3' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: color || '#00C6B3', display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
          {label}
        </Typography>
      </Box>
      <TextField
        fullWidth size="small" type={type} name={name}
        value={value} onChange={onChange}
        placeholder={`Enter ${label}`}
        inputProps={{ min, max }}
        InputProps={unit ? { endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">{unit}</Typography></InputAdornment> } : undefined}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: color || '#00C6B3' },
            '&.Mui-focused fieldset': { borderColor: color || '#00C6B3' },
          },
          '& .MuiInputBase-input': { fontWeight: 700, fontSize: '1.1rem', color: theme.palette.text.primary },
        }}
      />
    </Box>
  );
};

const RecordVitals = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { patients, queue, patientVitals, vitalsLoading, patientsLoading, queueLoading, success, error } = useSelector((s) => s.nurse);

  const [tab, setTab] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchPatients({ limit: 100 }));
    dispatch(fetchPatientQueue());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearNurseSuccess());
      setForm(EMPTY_FORM);
      setSelectedAppointment(null);
    }
    if (error) {
      toast.error(error);
      dispatch(clearNurseError());
    }
  }, [success, error, dispatch]);

  useEffect(() => {
    if (selectedPatient?._id) {
      dispatch(fetchVitalsByPatient(selectedPatient._id));
    }
  }, [selectedPatient, dispatch]);

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Auto BMI
  const bmi = (form.weight && form.height)
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#4B9EFF' }
    : bmi < 25 ? { label: 'Normal', color: '#34D399' }
    : bmi < 30 ? { label: 'Overweight', color: '#FF9F43' }
    : { label: 'Obese', color: '#FF6B6B' }
    : null;

  // Patient's today appointments
  const patientAppts = selectedPatient
    ? queue.filter((a) => {
        const pid = a.patientId?._id || a.patientId;
        return pid?.toString() === selectedPatient._id?.toString();
      })
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) { toast.warn('Please select a patient'); return; }

    const payload = {
      patient: selectedPatient._id,
      appointment: selectedAppointment?._id || undefined,
      bloodPressure: form.systolic && form.diastolic ? { systolic: Number(form.systolic), diastolic: Number(form.diastolic) } : undefined,
      temperature: form.temperature ? { value: Number(form.temperature) } : undefined,
      pulse: form.pulse ? Number(form.pulse) : undefined,
      respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
      oxygenSaturation: form.oxygenSaturation ? Number(form.oxygenSaturation) : undefined,
      weight: form.weight ? { value: Number(form.weight) } : undefined,
      height: form.height ? { value: Number(form.height) } : undefined,
      notes: form.notes || undefined,
    };

    dispatch(submitVitals(payload));
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
          Record Vitals
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          Measure and record patient vitals before consultation
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': { bgcolor: '#00C6B3' },
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
          '& .Mui-selected': { color: '#00C6B3 !important' },
        }}
      >
        <Tab icon={<MonitorHeartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Record Vitals" />
        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Vitals History" />
      </Tabs>

      {/* ── TAB 0: Record ── */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Patient Selection */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>
                Select Patient
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={patients}
                    loading={patientsLoading}
                    getOptionLabel={(opt) => opt.name || opt.user?.name || ''}
                    value={selectedPatient}
                    onChange={(_, v) => { setSelectedPatient(v); setSelectedAppointment(null); }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(0,198,179,0.15)', color: '#00C6B3', fontSize: '0.7rem' }}>
                          {(option.name || option.user?.name || '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.name || option.user?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.patientId}</Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Patient" placeholder="Type patient name…"
                        InputProps={{ ...params.InputProps, endAdornment: (<>{patientsLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={patientAppts}
                    disabled={!selectedPatient}
                    getOptionLabel={(opt) => `${opt.appointmentId || ''} — ${opt.timeSlot || ''} (${opt.status})`}
                    value={selectedAppointment}
                    onChange={(_, v) => setSelectedAppointment(v)}
                    renderInput={(params) => (
                      <TextField {...params} label="Link to Appointment (optional)" placeholder="Select today's appointment" />
                    )}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Vitals Form */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: theme.palette.text.primary }}>
                Vitals Measurements
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Blood Pressure */}
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,107,107,0.04)' : 'rgba(255,107,107,0.02)', '&:focus-within': { borderColor: '#FF6B6B' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <FavoriteIcon sx={{ color: '#FF6B6B', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>Blood Pressure</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" type="number" name="systolic" value={form.systolic} onChange={handleFormChange}
                            label="Systolic" placeholder="120" inputProps={{ min: 60, max: 250 }}
                            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">mmHg</Typography></InputAdornment> }} />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField fullWidth size="small" type="number" name="diastolic" value={form.diastolic} onChange={handleFormChange}
                            label="Diastolic" placeholder="80" inputProps={{ min: 40, max: 150 }}
                            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">mmHg</Typography></InputAdornment> }} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<ThermostatIcon sx={{ fontSize: 18 }} />} label="Temperature" name="temperature" value={form.temperature} onChange={handleFormChange} unit="°C" min={34} max={42} color="#FF9F43" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<MonitorHeartIcon sx={{ fontSize: 18 }} />} label="Heart Rate" name="pulse" value={form.pulse} onChange={handleFormChange} unit="bpm" min={30} max={250} color="#00C6B3" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<AirIcon sx={{ fontSize: 18 }} />} label="Oxygen Saturation" name="oxygenSaturation" value={form.oxygenSaturation} onChange={handleFormChange} unit="%" min={50} max={100} color="#4B9EFF" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<ScaleIcon sx={{ fontSize: 18 }} />} label="Weight" name="weight" value={form.weight} onChange={handleFormChange} unit="kg" min={1} max={300} color="#A78BFA" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<ScaleIcon sx={{ fontSize: 18 }} />} label="Height" name="height" value={form.height} onChange={handleFormChange} unit="cm" min={30} max={250} color="#34D399" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <VitalField icon={<AirIcon sx={{ fontSize: 18 }} />} label="Respiratory Rate" name="respiratoryRate" value={form.respiratoryRate} onChange={handleFormChange} unit="/min" min={5} max={60} color="#FF6B6B" />
                  </Grid>

                  {/* BMI Display */}
                  {bmi && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${bmiCategory.color}10`, border: `1px solid ${bmiCategory.color}44`, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Auto-calculated BMI:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: bmiCategory.color }}>{bmi}</Typography>
                        <Chip label={bmiCategory.label} size="small" sx={{ bgcolor: `${bmiCategory.color}22`, color: bmiCategory.color, fontWeight: 700 }} />
                      </Box>
                    </Grid>
                  )}

                  {/* Notes */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth multiline rows={3}
                      label="Nursing Notes"
                      name="notes" value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Add any observations, symptoms, or nursing notes here…"
                    />
                  </Grid>

                  {/* Submit */}
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => setForm(EMPTY_FORM)}
                        sx={{ textTransform: 'none', borderColor: theme.palette.divider, color: 'text.secondary' }}>
                        Clear
                      </Button>
                      <Button
                        type="submit" variant="contained"
                        startIcon={vitalsLoading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />}
                        disabled={vitalsLoading || !selectedPatient}
                        sx={{
                          textTransform: 'none', fontWeight: 700, px: 4,
                          bgcolor: '#00C6B3', '&:hover': { bgcolor: '#00a896' },
                          '&.Mui-disabled': { bgcolor: 'rgba(0,198,179,0.3)', color: '#fff' },
                        }}
                      >
                        {vitalsLoading ? 'Recording…' : 'Record Vitals'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── TAB 1: History ── */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Select Patient to View History</Typography>
              <Autocomplete
                options={patients}
                loading={patientsLoading}
                getOptionLabel={(opt) => opt.name || opt.user?.name || ''}
                value={selectedPatient}
                onChange={(_, v) => setSelectedPatient(v)}
                renderInput={(params) => <TextField {...params} label="Search Patient" placeholder="Type name…" />}
                sx={{ maxWidth: 400 }}
              />
            </Paper>
          </Grid>

          {selectedPatient && (
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Vitals History — {selectedPatient.name || selectedPatient.user?.name}
                  </Typography>
                </Box>
                {vitalsLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {['Date', 'BP (mmHg)', 'Temp (°C)', 'Heart Rate', 'SpO2 (%)', 'Weight (kg)', 'BMI', 'Notes'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patientVitals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>No vitals recorded for this patient</TableCell>
                        </TableRow>
                      ) : (
                        patientVitals.map((v) => (
                          <TableRow key={v._id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' } }}>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                              {v.recordedAt ? format(new Date(v.recordedAt), 'MMM d, yyyy hh:mm a') : '—'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#FF6B6B' }}>
                              {v.bloodPressure?.systolic ? `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}` : '—'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#FF9F43' }}>{v.temperature?.value ?? '—'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#00C6B3' }}>{v.pulse ? `${v.pulse} bpm` : '—'}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#4B9EFF' }}>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '—'}</TableCell>
                            <TableCell>{v.weight?.value ?? '—'}</TableCell>
                            <TableCell>
                              {v.bmi ? (
                                <Chip label={v.bmi} size="small"
                                  sx={{ fontWeight: 700, bgcolor: v.bmi < 25 ? 'rgba(52,211,153,0.12)' : 'rgba(255,159,67,0.12)', color: v.bmi < 25 ? '#34D399' : '#FF9F43' }} />
                              ) : '—'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', maxWidth: 200 }}>
                              <Typography noWrap>{v.notes || '—'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default RecordVitals;
