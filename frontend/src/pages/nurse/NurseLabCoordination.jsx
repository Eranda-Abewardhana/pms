import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem,
  CircularProgress, Chip, Avatar, Divider, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, useTheme,
  InputAdornment, IconButton, Tooltip, Badge,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatients, submitLabRequest, clearNurseSuccess, clearNurseError } from '../../features/nurse/nurseSlice';
import { getLabTests } from '../../api/nurseApi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const LAB_TESTS = [
  'CBC', 'Blood Glucose (Fasting)', 'Blood Glucose (Random)', 'HbA1c',
  'Lipid Profile', 'Liver Function Test', 'Kidney Function Test',
  'Thyroid Function Test', 'Urine Full Report', 'ESR', 'CRP',
  'PT/INR', 'Blood Culture', 'Urine Culture', 'ECG', 'Chest X-Ray', 'Other',
];

const PRIORITY_CONFIG = {
  routine:  { label: 'Routine',       color: '#4B9EFF',  bg: 'rgba(75,158,255,0.12)' },
  urgent:   { label: 'Urgent',        color: '#FF9F43',  bg: 'rgba(255,159,67,0.12)' },
  stat:     { label: 'STAT',          color: '#FF6B6B',  bg: 'rgba(255,107,107,0.12)' },
};

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     icon: <PendingIcon sx={{ fontSize: 14 }} />,      color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
  'in-progress':{ label: 'In Progress', icon: <ScienceIcon sx={{ fontSize: 14 }} />,     color: '#4B9EFF', bg: 'rgba(75,158,255,0.12)' },
  completed:   { label: 'Completed',   icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,  color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  cancelled:   { label: 'Cancelled',   icon: <WarningIcon sx={{ fontSize: 14 }} />,      color: '#8A94A6', bg: 'rgba(138,148,166,0.12)' },
};

const NurseLabCoordination = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { patients, patientsLoading, success, error } = useSelector((s) => s.nurse);

  const [labTests, setLabTests] = useState([]);
  const [labLoading, setLabLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog state
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    testType: '',
    customTestName: '',
    priority: 'routine',
    clinicalNotes: '',
  });

  const loadLabTests = async () => {
    setLabLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getLabTests(params);
      setLabTests(res.data.data?.tests || []);
    } catch {
      toast.error('Failed to load lab tests');
    } finally {
      setLabLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchPatients({ limit: 200 }));
    loadLabTests();
  }, [dispatch]);

  useEffect(() => {
    loadLabTests();
  }, [statusFilter]);

  useEffect(() => {
    if (success) { toast.success(success); dispatch(clearNurseSuccess()); }
    if (error)   { toast.error(error);   dispatch(clearNurseError());   }
  }, [success, error, dispatch]);

  const handleSubmit = async () => {
    if (!form.patientId) { toast.warn('Please select a patient'); return; }
    if (!form.testType)  { toast.warn('Please select a test type'); return; }
    setSubmitting(true);
    const result = await dispatch(submitLabRequest({
      patient:        form.patientId,
      testType:       form.testType === 'Other' ? form.customTestName : form.testType,
      customTestName: form.testType === 'Other' ? form.customTestName : undefined,
      priority:       form.priority,
      clinicalNotes:  form.clinicalNotes,
    }));
    setSubmitting(false);
    if (submitLabRequest.fulfilled.match(result)) {
      toast.success('Lab request submitted!');
      setOpen(false);
      setForm({ patientId: '', testType: '', customTestName: '', priority: 'routine', clinicalNotes: '' });
      loadLabTests();
    }
  };

  // Filter by search
  const filtered = labTests.filter((t) => {
    const name = t.patient?.name || '';
    const pid  = t.patient?.patientId || '';
    const test = t.testType || '';
    const q    = search.toLowerCase();
    return name.toLowerCase().includes(q) || pid.toLowerCase().includes(q) || test.toLowerCase().includes(q);
  });

  // Stats
  const counts = labTests.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: 'Pending',     value: counts.pending || 0,      color: '#FF9F43', bg: 'rgba(255,159,67,0.08)' },
    { label: 'In Progress', value: counts['in-progress'] || 0, color: '#4B9EFF', bg: 'rgba(75,158,255,0.08)' },
    { label: 'Completed',   value: counts.completed || 0,    color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
    { label: 'Total',       value: labTests.length,           color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Lab Coordination</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Request and track lab tests for patients
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={loadLabTests}
              sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#A78BFA', '&:hover': { bgcolor: '#9061ea' }, borderRadius: 2 }}
          >
            New Lab Request
          </Button>
        </Stack>
      </Stack>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: s.bg, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by patient, test name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
        />
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="in-progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
        {labLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#A78BFA' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  {['Patient', 'Test Type', 'Priority', 'Status', 'Requested By', 'Date'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8 }}>
                      <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.2, display: 'block', mx: 'auto', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No lab requests found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
                    const pri = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.routine;
                    const sta = STATUS_CONFIG[t.status]    || STATUS_CONFIG.pending;
                    return (
                      <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.72rem', fontWeight: 700, bgcolor: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>
                              {(t.patient?.name || '?')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{t.patient?.name || '—'}</Typography>
                              <Typography variant="caption" color="text.secondary">{t.patient?.patientId || ''}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{t.testType}</Typography>
                          {t.customTestName && <Typography variant="caption" color="text.secondary">{t.customTestName}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip label={pri.label} size="small" sx={{ bgcolor: pri.bg, color: pri.color, fontWeight: 700, fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={sta.icon}
                            label={sta.label}
                            size="small"
                            sx={{ bgcolor: sta.bg, color: sta.color, fontWeight: 700, fontSize: '0.65rem', '& .MuiChip-icon': { color: sta.color } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{t.requestedByUser?.name || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {t.createdAt ? format(new Date(t.createdAt), 'MMM d, HH:mm') : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* New Lab Request Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${theme.palette.divider}` } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ScienceIcon sx={{ color: '#A78BFA' }} />
            <Box>
              New Lab Request
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 400 }}>
                Submit a lab test request for a patient
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select fullWidth label="Patient" required
                value={form.patientId}
                onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
                disabled={patientsLoading}
              >
                {patients.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} — {p.patientId}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                select fullWidth label="Test Type" required
                value={form.testType}
                onChange={(e) => setForm((p) => ({ ...p, testType: e.target.value }))}
              >
                {LAB_TESTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select fullWidth label="Priority"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT (Critical)</MenuItem>
              </TextField>
            </Grid>
            {form.testType === 'Other' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Custom Test Name" required
                  value={form.customTestName}
                  onChange={(e) => setForm((p) => ({ ...p, customTestName: e.target.value }))}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} label="Clinical Notes"
                placeholder="Reason for request, symptoms, relevant history…"
                value={form.clinicalNotes}
                onChange={(e) => setForm((p) => ({ ...p, clinicalNotes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <ScienceIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#A78BFA', '&:hover': { bgcolor: '#9061ea' } }}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NurseLabCoordination;
