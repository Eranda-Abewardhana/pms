import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Card, TextField, Button, InputAdornment,
  Autocomplete, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, CircularProgress, Divider,
  Alert, Tabs, Tab, Avatar, Tooltip, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ScienceIcon from '@mui/icons-material/Science';
import EventNoteIcon from '@mui/icons-material/EventNote';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  verifyPatientPayments,
  clearVerification,
} from '../../features/cashier/cashierSlice';
import axiosInstance from '../../api/axiosInstance';

const TEAL = '#00C6B3';
const AMBER = '#FF9F43';
const GREEN = '#34D399';
const BLUE = '#4B9EFF';
const RED = '#F87171';

const fmt = (val) =>
  `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const StatusBadge = ({ status }) => {
  const map = {
    paid:     { icon: <VerifiedIcon sx={{ fontSize: 14 }} />, label: 'Paid',     bg: `${GREEN}18`, color: GREEN },
    partial:  { icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} />, label: 'Partial', bg: 'rgba(251,191,36,0.12)', color: '#FCD34D' },
    unpaid:   { icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />, label: 'Unpaid',   bg: `${AMBER}18`,  color: AMBER },
    draft:    { icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} />, label: 'Draft',    bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
    none:     { icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} />, label: 'No Invoice', bg: `${RED}18`,   color: RED },
  };
  const s = map[status] || map.none;
  return (
    <Chip
      icon={s.icon}
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem', '& .MuiChip-icon': { color: s.color } }}
    />
  );
};

const PaymentVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { verification, verifyLoading } = useSelector((s) => s.cashier);

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [tab, setTab] = useState(0);

  /* Patient search autocomplete */
  const searchPatients = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setPatientLoading(true);
    try {
      const res = await axiosInstance.get('/patients', { params: { search: q, limit: 10 } });
      setPatients(res.data.data?.patients || res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientSearch), 350);
    return () => clearTimeout(t);
  }, [patientSearch, searchPatients]);

  /* Load verification data when patient changes */
  useEffect(() => {
    if (selectedPatient) {
      dispatch(verifyPatientPayments(selectedPatient.id));
    } else {
      dispatch(clearVerification());
    }
  }, [selectedPatient, dispatch]);

  const handleReset = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    dispatch(clearVerification());
  };

  const appointments = verification?.appointments || [];
  const labTests = verification?.labTests || [];

  const paidAppointments = appointments.filter((a) => a.invoiceStatus === 'paid').length;
  const pendingAppointments = appointments.filter((a) => a.invoiceStatus !== 'paid').length;
  const paidLabs = labTests.filter((l) => l.invoiceStatus === 'paid').length;
  const pendingLabs = labTests.filter((l) => l.invoiceStatus !== 'paid').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Payment Verification</Typography>
          <Typography variant="body2" color="text.secondary">
            Verify consultation & lab payment status for any patient
          </Typography>
        </Box>
        {selectedPatient && (
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => dispatch(verifyPatientPayments(selectedPatient.id))}
            sx={{ textTransform: 'none', color: TEAL }}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Patient Search Card */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon sx={{ color: TEAL }} /> Search Patient
        </Typography>
        <Autocomplete
          options={patients}
          loading={patientLoading}
          inputValue={patientSearch}
          onInputChange={(_, v) => setPatientSearch(v)}
          value={selectedPatient}
          onChange={(_, v) => setSelectedPatient(v)}
          getOptionLabel={(opt) => opt?.name || opt?.patientId || ''}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderOption={(props, opt) => (
            <Box component="li" {...props} key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: TEAL, fontSize: '0.8rem', fontWeight: 700 }}>
                {opt.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={600} fontSize="0.9rem">{opt.name}</Typography>
                <Typography variant="caption" color="text.secondary">{opt.email} · {opt.patientId}</Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Type patient name to search..."
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
              }}
            />
          )}
        />

        {selectedPatient && (
          <Box sx={{ mt: 2, p: 2, bgcolor: `${TEAL}08`, borderRadius: '10px', border: `1px dashed ${TEAL}44`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: TEAL, fontWeight: 700 }}>
                {selectedPatient.name?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{selectedPatient.name}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedPatient.email} · {selectedPatient.phone || 'No phone'}</Typography>
              </Box>
            </Box>
            <Button size="small" onClick={handleReset} color="inherit" sx={{ textTransform: 'none' }}>
              Clear
            </Button>
          </Box>
        )}
      </Card>

      {/* Content: no patient selected */}
      {!selectedPatient && (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <PersonSearchIcon sx={{ fontSize: 64, color: `${TEAL}44`, mb: 2 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Select a Patient to Verify Payments
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Search for a patient above to view their consultation and lab payment statuses.
          </Typography>
        </Card>
      )}

      {/* Loading */}
      {selectedPatient && verifyLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: TEAL }} />
        </Box>
      )}

      {/* Summary Stats */}
      {selectedPatient && !verifyLoading && verification && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {[
              { label: 'Appointments', paid: paidAppointments, pending: pendingAppointments, icon: <EventNoteIcon />, color: BLUE },
              { label: 'Lab Tests', paid: paidLabs, pending: pendingLabs, icon: <ScienceIcon />, color: TEAL },
            ].map(({ label, paid, pending, icon, color }) => (
              <Card key={label} sx={{ p: 2.5, flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  {icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: GREEN, fontWeight: 700 }}>{paid} Paid</Typography>
                    <Typography variant="body2" color="text.secondary">·</Typography>
                    <Typography variant="body2" sx={{ color: pending > 0 ? AMBER : 'text.secondary', fontWeight: pending > 0 ? 700 : 400 }}>{pending} Pending</Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>

          {/* Tabs */}
          <Card sx={{ overflow: 'hidden' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: 2,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: `${TEAL} !important` },
                '& .MuiTabs-indicator': { bgcolor: TEAL },
              }}
            >
              <Tab
                icon={<EventNoteIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Consultations (${appointments.length})`}
              />
              <Tab
                icon={<ScienceIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={`Lab Tests (${labTests.length})`}
              />
            </Tabs>

            {/* Appointments Tab */}
            {tab === 0 && (
              <Box sx={{ p: 0 }}>
                {appointments.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <EventNoteIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                    <Typography variant="body2">No appointments found for this patient.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: `${TEAL}08` }}>
                        <TableRow>
                          {['Appointment ID', 'Date', 'Type', 'Doctor', 'Status', 'Invoice', 'Amount', 'Actions'].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appointments.map((apt) => (
                          <TableRow key={apt._id} hover>
                            <TableCell sx={{ fontWeight: 700, color: BLUE, fontSize: '0.82rem' }}>{apt.appointmentId}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{new Date(apt.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip label={apt.type || 'OPD'} size="small" sx={{ bgcolor: `${BLUE}18`, color: BLUE, fontWeight: 600, fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{apt.doctor?.userId?.name || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                label={apt.appointmentStatus || apt.status}
                                size="small"
                                sx={{ fontSize: '0.72rem', fontWeight: 600,
                                  bgcolor: apt.appointmentStatus === 'completed' ? `${GREEN}18` : `${AMBER}18`,
                                  color: apt.appointmentStatus === 'completed' ? GREEN : AMBER }}
                              />
                            </TableCell>
                            <TableCell><StatusBadge status={apt.invoiceStatus || 'none'} /></TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{apt.invoiceAmount ? fmt(apt.invoiceAmount) : '—'}</TableCell>
                            <TableCell>
                              {apt.invoiceStatus === 'paid' ? (
                                <Tooltip title="Payment Verified">
                                  <VerifiedIcon sx={{ color: GREEN, fontSize: 20 }} />
                                </Tooltip>
                              ) : apt.invoiceId ? (
                                <Tooltip title="Process Payment">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<PaymentsIcon />}
                                    onClick={() => navigate('/cashier/pending-payments')}
                                    sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none', fontSize: '0.75rem', borderRadius: '6px' }}
                                  >
                                    Pay
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Create Invoice">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ReceiptIcon />}
                                    onClick={() => navigate('/cashier/create-invoice')}
                                    sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '6px', borderColor: `${TEAL}66`, color: TEAL }}
                                  >
                                    Invoice
                                  </Button>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* Lab Tests Tab */}
            {tab === 1 && (
              <Box>
                {labTests.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <ScienceIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                    <Typography variant="body2">No lab tests found for this patient.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: `${TEAL}08` }}>
                        <TableRow>
                          {['Test Name', 'Requested', 'Category', 'Status', 'Payment', 'Amount', 'Actions'].map((h) => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {labTests.map((lab) => (
                          <TableRow key={lab._id} hover>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{lab.testName}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem' }}>{new Date(lab.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip label={lab.category || 'General'} size="small" sx={{ bgcolor: `${TEAL}18`, color: TEAL, fontWeight: 600, fontSize: '0.72rem' }} />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={lab.status}
                                size="small"
                                sx={{ fontSize: '0.72rem', fontWeight: 600,
                                  bgcolor: lab.status === 'completed' ? `${GREEN}18` : `${AMBER}18`,
                                  color: lab.status === 'completed' ? GREEN : AMBER }}
                              />
                            </TableCell>
                            <TableCell><StatusBadge status={lab.invoiceStatus || 'none'} /></TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{lab.invoiceAmount ? fmt(lab.invoiceAmount) : '—'}</TableCell>
                            <TableCell>
                              {lab.invoiceStatus === 'paid' ? (
                                <Tooltip title="Payment Verified">
                                  <VerifiedIcon sx={{ color: GREEN, fontSize: 20 }} />
                                </Tooltip>
                              ) : lab.invoiceId ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PaymentsIcon />}
                                  onClick={() => navigate('/cashier/pending-payments')}
                                  sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none', fontSize: '0.75rem', borderRadius: '6px' }}
                                >
                                  Pay
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<ReceiptIcon />}
                                  onClick={() => navigate('/cashier/create-invoice')}
                                  sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: '6px', borderColor: `${TEAL}66`, color: TEAL }}
                                >
                                  Invoice
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Card>
        </>
      )}
    </Box>
  );
};

export default PaymentVerification;
