import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button,
  Switch, FormControlLabel, Tabs, Tab, Divider,
  CircularProgress, Alert, Snackbar
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import SaveIcon from '@mui/icons-material/Save';
import { fetchSystemConfig, updateSystemConfig } from '../../features/admin/adminSlice';

const AdminSettings = () => {
  const dispatch = useDispatch();
  const { config, configLoading } = useSelector((state) => state.admin);
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    clinicName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    currency: 'LKR',
    notifications: {
      emailEnabled: true,
      smsEnabled: false
    },
    mfaRequired: false
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    dispatch(fetchSystemConfig());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      setFormData({
        clinicName: config.clinicName || '',
        contactEmail: config.contactEmail || '',
        contactPhone: config.contactPhone || '',
        address: config.address || '',
        currency: config.currency || 'LKR',
        notifications: config.notifications || { emailEnabled: true, smsEnabled: false },
        mfaRequired: config.mfaRequired || false
      });
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: checked }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateSystemConfig(formData)).then(() => {
      setSnackbar({ open: true, message: 'Settings updated successfully!' });
    });
  };

  if (configLoading && !config) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#00C6B3' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4', mb: 3 }}>
        System Settings
      </Typography>

      <Card sx={{ bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            '& .MuiTab-root': { color: '#8A94A6', textTransform: 'none', fontWeight: 600 }
          }}
        >
          <Tab label="General" />
          <Tab label="Notifications" />
          <Tab label="Security & Access" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Clinic Name" name="clinicName"
                    value={formData.clinicName} onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Currency" name="currency"
                    value={formData.currency} onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Contact Email" name="contactEmail"
                    value={formData.contactEmail} onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Contact Phone" name="contactPhone"
                    value={formData.contactPhone} onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Clinic Address" name="address"
                    multiline rows={3}
                    value={formData.address} onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}

            {tab === 1 && (
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 600 }}>
                  Email Notifications
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.emailEnabled}
                      onChange={handleToggle}
                      name="notifications.emailEnabled"
                      color="primary"
                    />
                  }
                  label={<Typography sx={{ color: '#8A94A6' }}>Enable Appointment Reminders</Typography>}
                />
                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.05)' }} />
                <Typography variant="subtitle1" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 600 }}>
                  SMS Notifications (Premium)
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.notifications.smsEnabled}
                      onChange={handleToggle}
                      name="notifications.smsEnabled"
                      color="primary"
                    />
                  }
                  label={<Typography sx={{ color: '#8A94A6' }}>Enable SMS Alerts</Typography>}
                />
              </Box>
            )}

            {tab === 2 && (
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 600 }}>
                  Authentication Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.mfaRequired}
                      onChange={handleToggle}
                      name="mfaRequired"
                      color="primary"
                    />
                  }
                  label={<Typography sx={{ color: '#8A94A6' }}>Require Multi-Factor Authentication (MFA) for all Staff</Typography>}
                />
              </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  bgcolor: '#00C6B3',
                  '&:hover': { bgcolor: '#00A89A' },
                  textTransform: 'none',
                  px: 4
                }}
              >
                Save Settings
              </Button>
            </Box>
          </form>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettings;
