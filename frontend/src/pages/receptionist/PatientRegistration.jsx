import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, MenuItem,
  Button, Divider, Stack, Chip, InputAdornment, CircularProgress,
  Stepper, Step, StepLabel, Alert, useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BadgeIcon from '@mui/icons-material/Badge';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerPatient } from '../../api/receptionistApi';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const steps = ['Personal Info', 'Contact & Identity', 'Medical Background'];

const INITIAL_FORM = {
  name: '', email: '', phone: '', nic: '',
  dateOfBirth: '', gender: '', bloodGroup: '',
  address: { street: '', city: '', state: '' },
  guardian: { name: '', phone: '', relationship: '' },
  allergies: '', chronicConditions: '',
};

const FieldLabel = ({ children }) => (
  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
    {children}
  </Typography>
);

const SectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: '#fff' }}>{icon}</Box>
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
    </Box>
  </Box>
);

export default function PatientRegistration() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const setNested = (parent, key, value) => {
    setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));
  };

  // ── Validation per step ──────────────────────────────────────────
  const validateStep = () => {
    const errs = {};
    if (activeStep === 0) {
      if (!form.name.trim()) errs.name = 'Full name is required';
      if (!form.gender) errs.gender = 'Gender is required';
      if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    }
    if (activeStep === 1) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errs.email = 'Enter a valid email address';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        allergies: form.allergies
          ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        chronicConditions: form.chronicConditions
          ? form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await registerPatient(payload);
      setSuccess(res.data);
      toast.success(`Patient registered! ID: ${res.data.patientId}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────────
  if (success) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4 }}>
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#10b981' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Patient Registered!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {success.name} has been successfully registered in the system.
          </Typography>
          <Chip
            label={`Patient ID: ${success.patientId}`}
            sx={{ bgcolor: '#10b98115', color: '#10b981', fontWeight: 800, fontSize: '1rem', py: 2.5, px: 2, mb: 4 }}
          />
          <Stack spacing={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => { setSuccess(null); setForm(INITIAL_FORM); setActiveStep(0); }}
              sx={{ py: 1.5, fontWeight: 700, borderRadius: 2.5 }}
            >
              Register Another Patient
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/receptionist/patients')}
              sx={{ py: 1.5, fontWeight: 700, borderRadius: 2.5 }}
            >
              Search Patients
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/receptionist')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Dashboard
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

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
            Register New Patient
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the patient's information to create a new record
          </Typography>
        </Box>
      </Stack>

      {/* ── Stepper ─────────────────────────────────────── */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': { fontWeight: 600, fontSize: '0.85rem' },
                '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card sx={{ maxWidth: 860, mx: 'auto' }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>

          {/* ── Step 0: Personal Info ─────────────────────── */}
          {activeStep === 0 && (
            <Box>
              <SectionHeader
                icon={<PersonIcon />}
                title="Personal Information"
                subtitle="Basic patient demographics"
              />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <FieldLabel>Full Name *</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-name"
                    placeholder="e.g. Nimali Perera"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Gender *</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-gender"
                    select
                    value={form.gender}
                    onChange={(e) => set('gender', e.target.value)}
                    error={!!errors.gender}
                    helperText={errors.gender}
                  >
                    {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Date of Birth *</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set('dateOfBirth', e.target.value)}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Blood Group</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-bloodgroup"
                    select
                    value={form.bloodGroup}
                    onChange={(e) => set('bloodGroup', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BloodtypeIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Step 1: Contact & Identity ────────────────── */}
          {activeStep === 1 && (
            <Box>
              <SectionHeader
                icon={<ContactPhoneIcon />}
                title="Contact & Identity"
                subtitle="How to reach and identify the patient"
              />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Phone Number *</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-phone"
                    placeholder="+94 77 123 4567"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    inputProps={{ maxLength: 15 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email Address</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-email"
                    type="email"
                    placeholder="patient@example.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>NIC / Passport</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-nic"
                    placeholder="e.g. 200012345678"
                    value={form.nic}
                    onChange={(e) => set('nic', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>City</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-city"
                    placeholder="e.g. Colombo"
                    value={form.address.city}
                    onChange={(e) => setNested('address', 'city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FieldLabel>Street Address</FieldLabel>
                  <TextField
                    fullWidth
                    id="patient-address"
                    placeholder="No. 12, Galle Road, Colombo 3"
                    value={form.address.street}
                    onChange={(e) => setNested('address', 'street', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      GUARDIAN / EMERGENCY CONTACT
                    </Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Guardian Name</FieldLabel>
                  <TextField
                    fullWidth
                    id="guardian-name"
                    placeholder="Full name"
                    value={form.guardian.name}
                    onChange={(e) => setNested('guardian', 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Guardian Phone</FieldLabel>
                  <TextField
                    fullWidth
                    id="guardian-phone"
                    placeholder="+94 77 xxx xxxx"
                    value={form.guardian.phone}
                    onChange={(e) => setNested('guardian', 'phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Relationship</FieldLabel>
                  <TextField
                    fullWidth
                    id="guardian-relationship"
                    placeholder="e.g. Parent, Spouse"
                    value={form.guardian.relationship}
                    onChange={(e) => setNested('guardian', 'relationship', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ── Step 2: Medical Background ────────────────── */}
          {activeStep === 2 && (
            <Box>
              <SectionHeader
                icon={<MedicalServicesIcon />}
                title="Medical Background"
                subtitle="Known conditions and allergies (comma-separated)"
              />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FieldLabel>Known Allergies</FieldLabel>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    id="patient-allergies"
                    placeholder="e.g. Penicillin, Aspirin, Peanuts"
                    value={form.allergies}
                    onChange={(e) => set('allergies', e.target.value)}
                    helperText="Separate multiple allergies with commas"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FieldLabel>Chronic Conditions</FieldLabel>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    id="patient-conditions"
                    placeholder="e.g. Diabetes Type 2, Hypertension, Asthma"
                    value={form.chronicConditions}
                    onChange={(e) => set('chronicConditions', e.target.value)}
                    helperText="Separate multiple conditions with commas"
                  />
                </Grid>
              </Grid>

              {/* Review Summary */}
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Review Before Submitting
                </Typography>
                <Grid container spacing={1}>
                  {[
                    ['Name', form.name],
                    ['Gender', form.gender],
                    ['DOB', form.dateOfBirth],
                    ['Phone', form.phone],
                    ['Email', form.email || '—'],
                    ['NIC', form.nic || '—'],
                    ['Blood Group', form.bloodGroup || '—'],
                    ['City', form.address.city || '—'],
                  ].map(([k, v]) => (
                    <Grid item xs={6} key={k}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{k}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Alert>
            </Box>
          )}

          {/* ── Navigation Buttons ───────────────────────── */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              onClick={activeStep === 0 ? () => navigate('/receptionist') : handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3 }}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3 }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckCircleIcon />}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                }}
              >
                {submitting ? 'Registering…' : 'Register Patient'}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
