import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, TextField, Button, Grid, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  TableContainer, FormControl, InputLabel, Select, MenuItem, Divider,
  CircularProgress, InputAdornment, Autocomplete, Chip, Alert,
  Tooltip, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createInvoiceAction,
  clearCashierError,
  clearCashierSuccess,
  clearCreatedInvoice,
} from '../../features/cashier/cashierSlice';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';

const TEAL = '#00C6B3';
const BLUE = '#4B9EFF';

const CATEGORIES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'medication', label: 'Pharmacy/Medication' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'other', label: 'Other' },
];

const defaultItem = () => ({ description: '', category: 'other', quantity: 1, unitPrice: '' });

const fmt = (val) =>
  `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const CreateInvoice = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { createLoading, createdInvoice, error, success } = useSelector((s) => s.cashier);

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(location.state?.patient || null);
  const [patientLoading, setPatientLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(location.state?.appointment || null);
  const [selectedLabTest, setSelectedLabTest] = useState(location.state?.labTest || null);
  const [dataLoading, setDataLoading] = useState(false);

  const [items, setItems] = useState([defaultItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearCashierError()); }
    if (success) { toast.success(success); dispatch(clearCashierSuccess()); }
  }, [error, success, dispatch]);

  const searchPatients = useCallback(async (q) => {
    if (!q || q.length < 2) return;
    setPatientLoading(true);
    try {
      const res = await axiosInstance.get('/patients', { params: { search: q, limit: 10 } });
      const data = res.data.data?.patients || res.data.data || [];
      setPatients(data);
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

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!selectedPatient) {
        setAppointments([]);
        setLabTests([]);
        return;
      }
      setDataLoading(true);
      try {
        const [aptRes, labRes] = await Promise.all([
          axiosInstance.get('/appointments', { params: { patientId: selectedPatient._id, status: 'completed' } }),
          axiosInstance.get('/lab', { params: { patient: selectedPatient._id, status: 'pending,completed' } })
        ]);
        setAppointments(aptRes.data.data?.appointments || []);
        setLabTests(labRes.data.data?.tests || labRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch patient data', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchPatientData();
  }, [selectedPatient]);

  const addItem = () => setItems((prev) => [...prev, defaultItem()]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - Number(discount || 0);

  const handleLinkAppointment = (apt) => {
    setSelectedAppointment(apt);
    const existing = items.some(it => it.description.includes(apt.appointmentId));
    if (!existing) {
      setItems(prev => [
        { 
          description: `Consultation Fee (${apt.appointmentId})`, 
          category: 'consultation', 
          quantity: 1, 
          unitPrice: '1500' 
        },
        ...prev.filter(it => it.description !== '')
      ]);
    }
  };

  const handleLinkLabTest = (lab) => {
    setSelectedLabTest(lab);
    const testName = lab.testType === 'Other' ? lab.customTestName : lab.testType;
    const existing = items.some(it => it.description.includes(lab.testId));
    if (!existing) {
      setItems(prev => [
        { 
          description: `Lab Test: ${testName} (${lab.testId})`, 
          category: 'lab', 
          quantity: 1, 
          unitPrice: '2500',
          labTestId: lab._id
        },
        ...prev.filter(it => it.description !== '')
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Please select a patient'); return; }
    const validItems = items.filter((it) => it.description && it.unitPrice > 0);
    if (validItems.length === 0) { toast.error('Add at least one valid line item'); return; }

    dispatch(createInvoiceAction({
      patient: selectedPatient._id,
      appointment: selectedAppointment?._id,
      labTest: selectedLabTest?._id,
      items: validItems.map((it) => ({
        description: it.description,
        category: it.category,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        labTestId: it.labTestId
      })),
      taxRate: Number(taxRate),
      discount: Number(discount),
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    }));
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setSelectedAppointment(null);
    setSelectedLabTest(null);
    setItems([defaultItem()]);
    setTaxRate(0);
    setDiscount(0);
    setNotes('');
    setDueDate('');
    dispatch(clearCreatedInvoice());
  };

  if (createdInvoice) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: `${TEAL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: TEAL }} />
          </Box>
          <Typography variant="h4" fontWeight={800} mb={1}>Invoice Created!</Typography>
          <Typography color="text.secondary" mb={4}>
            Invoice <strong style={{ color: TEAL }}>{createdInvoice.invoiceId}</strong> has been generated successfully.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={handleReset} sx={{ borderRadius: '12px', px: 4 }}>Create Another</Button>
            <Button variant="contained" startIcon={<ReceiptIcon />} onClick={() => navigate('/cashier/pending-payments')} sx={{ bgcolor: BLUE, borderRadius: '12px', px: 4 }}>Go to Payments</Button>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px' }}>Create Invoice</Typography>
          <Typography variant="body1" color="text.secondary">Generate a new bill for patient services</Typography>
        </Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} color="inherit" sx={{ textTransform: 'none' }}>Back to Dashboard</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Patient Details</Typography>
            <Autocomplete
              options={patients}
              loading={patientLoading}
              filterOptions={(x) => x} // Disable local filtering to show all server results
              inputValue={patientSearch}
              onInputChange={(_, v) => setPatientSearch(v)}
              value={selectedPatient}
              onChange={(_, v) => setSelectedPatient(v)}
              getOptionLabel={(opt) => opt.name ? `${opt.name} (${opt.patientId})` : ''}
              isOptionEqualToValue={(opt, val) => opt._id === val._id}
              renderInput={(params) => (
                <TextField {...params} label="Search Patient by Name, ID or NIC" fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                  }} />
              )}
            />

            {selectedPatient && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: `${TEAL}08`, borderRadius: '12px', border: `1px dashed ${TEAL}44` }}>
                  <Typography variant="subtitle2" sx={{ color: TEAL, fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventAvailableIcon fontSize="small" /> Link Completed Appointment
                  </Typography>
                  {dataLoading ? <CircularProgress size={20} /> : appointments.length === 0 ? <Typography variant="caption">No completed appointments found.</Typography> : (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {appointments.map((apt) => (
                        <Chip key={apt._id} label={apt.appointmentId} onClick={() => handleLinkAppointment(apt)}
                          variant={selectedAppointment?._id === apt._id ? "filled" : "outlined"}
                          sx={{ borderColor: TEAL, color: selectedAppointment?._id === apt._id ? '#fff' : 'inherit', bgcolor: selectedAppointment?._id === apt._id ? TEAL : 'transparent' }} />
                      ))}
                    </Box>
                  )}
                </Box>

                <Box sx={{ p: 2, bgcolor: `${BLUE}08`, borderRadius: '12px', border: `1px dashed ${BLUE}44` }}>
                  <Typography variant="subtitle2" sx={{ color: BLUE, fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon fontSize="small" /> Link Lab Test
                  </Typography>
                  {dataLoading ? <CircularProgress size={20} /> : labTests.length === 0 ? <Typography variant="caption">No pending lab tests found.</Typography> : (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {labTests.map((lab) => (
                        <Chip key={lab._id} label={lab.testId} onClick={() => handleLinkLabTest(lab)}
                          variant={selectedLabTest?._id === lab._id ? "filled" : "outlined"}
                          sx={{ borderColor: BLUE, color: selectedLabTest?._id === lab._id ? '#fff' : 'inherit', bgcolor: selectedLabTest?._id === lab._id ? BLUE : 'transparent' }} />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Card>

          <Card sx={{ p: 3, mb: 3, borderRadius: '16px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Services & Items</Typography>
              <Button startIcon={<AddIcon />} onClick={addItem} size="small" variant="contained" sx={{ bgcolor: TEAL, borderRadius: '8px' }}>Add Item</Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} width={80}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} width={120}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                    <TableCell width={40}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell><TextField fullWidth variant="standard" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} /></TableCell>
                      <TableCell>
                        <Select variant="standard" value={item.category} fullWidth onChange={(e) => updateItem(i, 'category', e.target.value)}>
                          {CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                      </TableCell>
                      <TableCell><TextField type="number" variant="standard" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} /></TableCell>
                      <TableCell><TextField type="number" variant="standard" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(item.quantity * item.unitPrice)}</TableCell>
                      <TableCell><IconButton size="small" onClick={() => removeItem(i)} color="error" disabled={items.length === 1}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 100, borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight={800} mb={3}>Invoice Summary</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <TextField label="Tax Rate (%)" type="number" size="small" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              <TextField label="Discount (Rs.)" type="number" size="small" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </Box>
            <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography fontWeight={600}>{fmt(subtotal)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Tax</Typography><Typography fontWeight={600}>{fmt(taxAmount)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: '12px' }}>
                <Typography fontWeight={800} variant="h6">Total</Typography>
                <Typography fontWeight={800} color={TEAL} variant="h6">{fmt(total)}</Typography>
              </Box>
            </Box>
            <Button fullWidth variant="contained" onClick={handleSubmit} disabled={createLoading}
              sx={{ mt: 4, py: 1.5, bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, borderRadius: '14px', fontWeight: 800 }}>
              {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Invoice'}
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateInvoice;
