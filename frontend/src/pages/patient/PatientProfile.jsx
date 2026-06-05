import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Grid, Stack, Chip, CircularProgress,
  Avatar, TextField, Button, Divider, Alert, Paper, IconButton,
  InputAdornment, MenuItem,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyProfile } from '../../features/patient/patientSlice';
import axiosInstance from '../../api/axiosInstance';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';

const TEAL = '#00C6B3';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

const InfoRow = ({ icon: Icon, label, value }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start">
    <Box sx={{ mt: 0.4, color: 'text.secondary' }}><Icon fontSize="small" /></Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} mt={0.25}>{value || '—'}</Typography>
    </Box>
  </Stack>
);

const ChipEditor = ({ label, values = [], onChange, disabled, color = 'default' }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); setInput(''); }
  };
  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.75}>
        {values.map((v, i) => (
          <Chip key={i} label={v} size="small" color={color}
            onDelete={disabled ? undefined : () => remove(i)} variant="outlined" />
        ))}
        {!disabled && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <TextField size="small" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder={`Add ${label.toLowerCase()}…`}
              sx={{ '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: '0.8rem' }, width: 160 }} />
            <IconButton size="small" onClick={add} sx={{ color: TEAL }}><AddIcon fontSize="small" /></IconButton>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

const PatientProfile = () => {
  const dispatch = useDispatch();
  const { myProfile, profileLoading } = useSelector((s) => s.patient);
  const { user } = useSelector((s) => s.auth);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { dispatch(fetchMyProfile()); }, [dispatch]);

  useEffect(() => {
    if (myProfile) {
      setForm({
        phone: myProfile.phone || '',
        address: myProfile.address || '',
        bloodGroup: myProfile.bloodGroup || '',
        gender: myProfile.gender || '',
        dateOfBirth: myProfile.dateOfBirth ? myProfile.dateOfBirth.slice(0, 10) : '',
        allergies: myProfile.allergies || [],
        chronicConditions: myProfile.chronicConditions || [],
        guardian: myProfile.guardian || '',
      });
    }
  }, [myProfile]);

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/patients/me', form);
      dispatch(fetchMyProfile());
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const calcAge = (dob) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25));
  };

  if (profileLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>;

  const profile = myProfile;
  const age = calcAge(profile?.dateOfBirth);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Profile</Typography>
          <Typography variant="body2" color="text.secondary">View and update your personal health information</Typography>
        </Box>
        {!editing ? (
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditing(true)}
            sx={{ borderColor: TEAL, color: TEAL, fontWeight: 700 }}>
            Edit Profile
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button startIcon={<CancelIcon />} variant="outlined" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
              variant="contained" onClick={handleSave} disabled={saving}
              sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' }, fontWeight: 700 }}>
              Save Changes
            </Button>
          </Stack>
        )}
      </Stack>

      <Grid container spacing={3}>
        {/* Identity Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{
              width: 96, height: 96, mx: 'auto', mb: 2,
              bgcolor: `${TEAL}22`, color: TEAL, fontSize: 36, fontWeight: 800,
            }}>
              {(user?.name || 'P')[0].toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={800}>{user?.name || profile?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            {profile?.patientId && (
              <Chip label={profile.patientId} size="small" sx={{ mt: 1.5, bgcolor: `${TEAL}15`, color: TEAL, fontWeight: 700 }} />
            )}
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              {age && <InfoRow icon={PersonIcon} label="Age" value={`${age} years old`} />}
              <InfoRow icon={PersonIcon} label="Gender" value={profile?.gender} />
              <InfoRow icon={BloodtypeIcon} label="Blood Group" value={profile?.bloodGroup} />
            </Stack>
          </Card>
        </Grid>

        {/* Editable Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Personal Information</Typography>
            {editing ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone Number" value={form.phone} onChange={handleField('phone')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Gender" value={form.gender} onChange={handleField('gender')}>
                    {GENDERS.map((g) => <MenuItem key={g} value={g} sx={{ textTransform: 'capitalize' }}>{g.charAt(0).toUpperCase() + g.slice(1)}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Blood Group" value={form.bloodGroup} onChange={handleField('bloodGroup')}>
                    {BLOOD_GROUPS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="date" label="Date of Birth" value={form.dateOfBirth}
                    onChange={handleField('dateOfBirth')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" value={form.address} onChange={handleField('address')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><HomeIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Emergency Contact / Guardian" value={form.guardian} onChange={handleField('guardian')}
                    placeholder="Name, relation, phone" />
                </Grid>
                <Grid item xs={12}>
                  <ChipEditor label="Allergies" values={form.allergies}
                    onChange={(v) => setForm((f) => ({ ...f, allergies: v }))} color="error" />
                </Grid>
                <Grid item xs={12}>
                  <ChipEditor label="Chronic Conditions" values={form.chronicConditions}
                    onChange={(v) => setForm((f) => ({ ...f, chronicConditions: v }))} color="warning" />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><InfoRow icon={PhoneIcon} label="Phone" value={profile?.phone} /></Grid>
                <Grid item xs={12} sm={6}><InfoRow icon={HomeIcon} label="Address" value={profile?.address} /></Grid>
                <Grid item xs={12} sm={6}><InfoRow icon={PersonIcon} label="Date of Birth" value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null} /></Grid>
                <Grid item xs={12} sm={6}><InfoRow icon={PersonIcon} label="Guardian / Emergency" value={profile?.guardian} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Allergies</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.75}>
                    {(profile?.allergies || []).length === 0
                      ? <Typography variant="body2" color="text.secondary">None recorded</Typography>
                      : (profile.allergies || []).map((a, i) => <Chip key={i} label={a} size="small" color="error" variant="outlined" />)}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>Chronic Conditions</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.75}>
                    {(profile?.chronicConditions || []).length === 0
                      ? <Typography variant="body2" color="text.secondary">None recorded</Typography>
                      : (profile.chronicConditions || []).map((c, i) => <Chip key={i} label={c} size="small" color="warning" variant="outlined" />)}
                  </Stack>
                </Grid>
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientProfile;
