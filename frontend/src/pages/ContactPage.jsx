import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, TextField, Button,
  Chip, InputAdornment, Alert, Snackbar, CircularProgress,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import SubjectIcon from '@mui/icons-material/Subject';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import SendIcon from '@mui/icons-material/Send';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const contactInfo = [
  {
    icon: LocationOnOutlinedIcon,
    color: '#00C6B3',
    label: 'Our Location',
    lines: ['No. 45, Hospital Road,', 'Colombo 07, Sri Lanka'],
  },
  {
    icon: PhoneOutlinedIcon,
    color: '#4B9EFF',
    label: 'Phone Numbers',
    lines: ['+94 11 234 5678 (Main)', '+94 77 800 1234 (Emergency)'],
  },
  {
    icon: EmailOutlinedIcon,
    color: '#FF9F43',
    label: 'Email Addresses',
    lines: ['info@metrocare.lk', 'support@metrocare.lk'],
  },
  {
    icon: AccessTimeOutlinedIcon,
    color: '#A78BFA',
    label: 'Working Hours',
    lines: ['Mon – Fri: 8:00 AM – 8:00 PM', 'Sat – Sun: 9:00 AM – 5:00 PM'],
  },
];

const departments = [
  { name: 'General Inquiries',    email: 'info@metrocare.lk' },
  { name: 'Appointments',         email: 'appointments@metrocare.lk' },
  { name: 'Emergency Services',   email: 'emergency@metrocare.lk' },
  { name: 'Billing & Finance',    email: 'billing@metrocare.lk' },
  { name: 'Lab & Diagnostics',    email: 'lab@metrocare.lk' },
  { name: 'Patient Support',      email: 'support@metrocare.lk' },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, type: 'success', msg: '' });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setSnack({ open: true, type: 'error', msg: 'Please fill in all fields.' });
      return;
    }
    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setForm({ name: '', email: '', subject: '', message: '' });
    setSnack({ open: true, type: 'success', msg: 'Message sent! We\'ll get back to you within 24 hours.' });
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
  };

  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Hero ── */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '20px',
          background: 'linear-gradient(135deg,#0E2A30 0%,#0A1628 50%,#131929 100%)',
          border: '1px solid rgba(0,198,179,0.12)',
          p: { xs: 4, md: 6 },
          mb: 4,
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'absolute', top: -60, right: '20%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(75,158,255,0.1) 0%,transparent 70%)', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '18px', background: 'linear-gradient(135deg,#4B9EFF,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: '0 8px 32px rgba(75,158,255,0.35)' }}>
            <MessageOutlinedIcon sx={{ fontSize: 36, color: '#fff' }} />
          </Box>
          <Chip label="GET IN TOUCH" size="small" sx={{ bgcolor: 'rgba(75,158,255,0.1)', color: '#4B9EFF', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', border: '1px solid rgba(75,158,255,0.25)', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(135deg,#E8ECF4 30%,#4B9EFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
            We're Here to Help
          </Typography>
          <Typography variant="body1" sx={{ color: '#8A94A6', maxWidth: 520, mx: 'auto', lineHeight: 1.8 }}>
            Have questions about appointments, services, or billing? Our team is available to assist you.
            Reach out and we'll respond within 24 hours.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>

        {/* ── Contact Form ── */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: { xs: 3, md: 4 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(0,198,179,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SendIcon sx={{ color: '#00C6B3', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4', lineHeight: 1 }}>Send a Message</Typography>
                <Typography variant="caption" sx={{ color: '#8A94A6' }}>We typically reply within 24 hours</Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SubjectIcon sx={{ color: '#8A94A6', fontSize: 20 }} /></InputAdornment> }}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Message"
                    name="message"
                    multiline
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={sending}
                    endIcon={sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
                    sx={{
                      py: 1.6,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: 'linear-gradient(135deg,#00C6B3,#00A89A)',
                      boxShadow: '0 8px 24px rgba(0,198,179,0.3)',
                      borderRadius: '12px',
                      textTransform: 'none',
                      letterSpacing: '0.02em',
                      '&:hover': { background: 'linear-gradient(135deg,#33D4C5,#00C6B3)', transform: 'translateY(-1px)', boxShadow: '0 12px 32px rgba(0,198,179,0.4)' },
                      '&:disabled': { background: 'rgba(0,198,179,0.3)', color: 'rgba(255,255,255,0.5)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {sending ? 'Sending…' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* ── Contact Info + Departments ── */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Contact Info Cards */}
            {contactInfo.map(({ icon: Icon, color, label, lines }) => (
              <Card key={label} sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start', transition: 'transform 0.2s', '&:hover': { transform: 'translateX(4px)' } }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ color, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, letterSpacing: '0.06em', fontSize: '0.68rem', textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                    {label}
                  </Typography>
                  {lines.map((line) => (
                    <Typography key={line} variant="body2" sx={{ color: '#E8ECF4', fontWeight: 500, lineHeight: 1.6 }}>{line}</Typography>
                  ))}
                </Box>
              </Card>
            ))}

            {/* Emergency Banner */}
            <Card sx={{ p: 2.5, background: 'linear-gradient(135deg,rgba(255,107,107,0.12),rgba(255,107,107,0.05))', border: '1px solid rgba(255,107,107,0.2)' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(255,107,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LocalHospitalOutlinedIcon sx={{ color: '#FF6B6B', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FF6B6B', mb: 0.25 }}>24/7 Emergency Hotline</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#E8ECF4', lineHeight: 1 }}>+94 11 911 0000</Typography>
                  <Typography variant="caption" sx={{ color: '#8A94A6' }}>Immediate medical assistance</Typography>
                </Box>
              </Box>
            </Card>

            {/* WhatsApp */}
            <Button
              fullWidth
              startIcon={<WhatsAppIcon />}
              href="https://wa.me/94778001234"
              target="_blank"
              sx={{
                py: 1.4,
                fontWeight: 700,
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg,#25D366,#128C7E)',
                color: '#fff',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 16px rgba(37,211,102,0.25)',
                '&:hover': { background: 'linear-gradient(135deg,#34E874,#25D366)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
              }}
            >
              Chat on WhatsApp
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* ── Department Contacts ── */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Chip label="DEPARTMENTS" size="small" sx={{ bgcolor: 'rgba(167,139,250,0.1)', color: '#A78BFA', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', border: '1px solid rgba(167,139,250,0.25)', mb: 1.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>Department Contacts</Typography>
        </Box>
        <Grid container spacing={2}>
          {departments.map(({ name, email }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card sx={{ p: 2.5, display: 'flex', gap: 1.5, alignItems: 'center', transition: 'transform 0.2s,box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00C6B3', flexShrink: 0 }} />
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#E8ECF4', mb: 0.25 }}>{name}</Typography>
                  <Typography variant="caption" sx={{ color: '#00C6B3', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{email}</Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert
          severity={snack.type}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{
            bgcolor: snack.type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(255,107,107,0.15)',
            color: snack.type === 'success' ? '#34D399' : '#FF6B6B',
            border: `1px solid ${snack.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(255,107,107,0.3)'}`,
            '& .MuiAlert-icon': { color: snack.type === 'success' ? '#34D399' : '#FF6B6B' },
          }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default ContactPage;
