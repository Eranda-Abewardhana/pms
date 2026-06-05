import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, Chip, CircularProgress, TextField,
  InputAdornment, Button, IconButton, Tooltip, Collapse, Paper, Divider,
  Avatar, Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorPrescriptions } from '../../features/doctor/doctorSlice';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const TEAL = '#00C6B3';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const PrescriptionPrintTemplate = ({ emr }) => {
  const rxs = emr.prescriptions || [];
  return (
    <Box sx={{ p: 4, minWidth: 600, fontFamily: 'Arial, sans-serif', '@media print': { display: 'block' } }}>
      <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #00C6B3', pb: 2 }}>
        <Typography variant="h5" fontWeight={800} color="#00C6B3">Metro Medi Care</Typography>
        <Typography variant="body2" color="text.secondary">Medical Prescription</Typography>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Patient</Typography>
          <Typography fontWeight={700}>{emr.patient?.name || emr.patient?.user?.name || '—'}</Typography>
          <Typography variant="caption">{emr.patient?.patientId || ''}</Typography>
        </Grid>
        <Grid item xs={6} textAlign="right">
          <Typography variant="caption" color="text.secondary">Doctor</Typography>
          <Typography fontWeight={700}>{emr.doctor?.name || '—'}</Typography>
          <Typography variant="caption">{emr.doctor?.specialization || ''}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">Date</Typography>
          <Typography fontWeight={600}>{fmt(emr.createdAt)}</Typography>
        </Grid>
        {emr.followUpDate && (
          <Grid item xs={6} textAlign="right">
            <Typography variant="caption" color="text.secondary">Follow-up</Typography>
            <Typography fontWeight={600}>{fmt(emr.followUpDate)}</Typography>
          </Grid>
        )}
      </Grid>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Diagnosis: {emr.diagnosis || '—'}</Typography>
      <Typography fontWeight={700} mb={1.5}>℞ Medications</Typography>
      {rxs.map((rx, i) => (
        <Box key={i} sx={{ mb: 1.5, pl: 2, borderLeft: '3px solid #00C6B3' }}>
          <Typography fontWeight={700}>{i + 1}. {rx.medicine}</Typography>
          <Typography variant="caption">{rx.dosage} — {rx.frequency} — {rx.duration}</Typography>
          {rx.instructions && <Typography variant="caption" display="block" color="text.secondary">{rx.instructions}</Typography>}
        </Box>
      ))}
      <Box sx={{ mt: 4, borderTop: '1px dashed #ccc', pt: 2, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">Doctor's Signature</Typography>
        <Box sx={{ mt: 3, borderTop: '1px solid #333', width: 200, ml: 'auto' }} />
      </Box>
    </Box>
  );
};

const RxRow = ({ emr }) => {
  const [open, setOpen] = useState(false);
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=700,height=900');
    win.document.write(`<html><head><title>Prescription</title></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const rxs = emr.prescriptions || [];
  const patient = emr.patient?.user?.name || emr.patient?.name || '—';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: `${TEAL}22`, color: TEAL, width: 36, height: 36, fontWeight: 700, fontSize: 14 }}>
              {patient[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700}>{patient}</Typography>
              <Typography variant="caption" color="text.secondary">{emr.patient?.patientId || ''}</Typography>
            </Box>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600}>{emr.diagnosis || '—'}</Typography>
          {emr.icdCode && <Typography variant="caption" color="text.secondary">ICD: {emr.icdCode}</Typography>}
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {rxs.slice(0, 2).map((rx, i) => (
              <Chip key={i} label={rx.medicine} size="small" sx={{ bgcolor: `${TEAL}12`, color: TEAL, fontSize: '0.68rem' }} />
            ))}
            {rxs.length > 2 && <Chip label={`+${rxs.length - 2}`} size="small" />}
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption">{fmt(emr.createdAt)}</Typography>
          </Stack>
        </TableCell>
        <TableCell>
          {emr.followUpDate ? (
            <Chip label={fmt(emr.followUpDate)} size="small" color="info" variant="outlined" sx={{ fontSize: '0.68rem' }} />
          ) : '—'}
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Expand prescription">
              <IconButton size="small" onClick={() => setOpen((o) => !o)}>
                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Print prescription">
              <IconButton size="small" color="primary" onClick={handlePrint}><PrintIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
          <Collapse in={open}>
            <Box sx={{ py: 2, px: 3 }}>
              {rxs.length === 0 ? (
                <Typography variant="caption" color="text.secondary">No medications recorded.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {rxs.map((rx, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={700}>{rx.medicine}</Typography>
                        <Typography variant="caption" color="text.secondary">{rx.dosage} · {rx.frequency} · {rx.duration}</Typography>
                        {rx.instructions && <Typography variant="caption" display="block" color={TEAL}>{rx.instructions}</Typography>}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
              {emr.treatmentNotes && (
                <Box mt={1.5}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">TREATMENT NOTES</Typography>
                  <Typography variant="body2" mt={0.5}>{emr.treatmentNotes}</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {/* Hidden print template */}
      <TableRow sx={{ display: 'none' }}>
        <TableCell>
          <div ref={printRef}>
            <PrescriptionPrintTemplate emr={emr} />
          </div>
        </TableCell>
      </TableRow>
    </>
  );
};

const DoctorPrescriptions = () => {
  const dispatch = useDispatch();
  const { prescriptions, prescriptionsLoading } = useSelector((s) => s.doctor);
  const [search, setSearch] = useState('');

  const load = () => dispatch(fetchDoctorPrescriptions());

  useEffect(() => { load(); }, [dispatch]);

  const filtered = (prescriptions || []).filter((emr) => {
    const q = search.toLowerCase();
    const patient = emr.patient?.name || emr.patient?.user?.name || '';
    return patient.toLowerCase().includes(q) || (emr.diagnosis || '').toLowerCase().includes(q);
  });

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Prescriptions</Typography>
          <Typography variant="body2" color="text.secondary">All prescriptions issued by you</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={load} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField fullWidth size="small" placeholder="Search by patient name or diagnosis…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
        />
      </Paper>

      <Card sx={{ overflow: 'hidden' }}>
        {prescriptionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell>Medications</TableCell>
                  <TableCell>Date Issued</TableCell>
                  <TableCell>Follow-up</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <MedicalServicesIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No prescriptions found</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((emr) => <RxRow key={emr.id} emr={emr} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default DoctorPrescriptions;
