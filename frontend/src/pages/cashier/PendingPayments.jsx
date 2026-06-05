import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button, IconButton, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Alert, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PaymentsIcon from '@mui/icons-material/Payments';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPendingPayments,
  processPaymentAction,
  fetchInvoiceById,
  clearCashierError,
  clearCashierSuccess,
  clearSelectedInvoice,
} from '../../features/cashier/cashierSlice';
import { toast } from 'react-toastify';

const TEAL = '#00C6B3';
const AMBER = '#FF9F43';

const statusChip = (status) => {
  const map = {
    unpaid: { label: 'Unpaid', bg: `${AMBER}18`, color: AMBER },
    partial: { label: 'Partial', bg: 'rgba(251,191,36,0.12)', color: '#FCD34D' },
    draft: { label: 'Draft', bg: 'rgba(148,163,184,0.12)', color: '#94A3B8' },
  };
  const s = map[status] || map.unpaid;
  return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem' }} />;
};

const fmt = (val) =>
  `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const PendingPayments = () => {
  const dispatch = useDispatch();
  const { pendingPayments, selectedInvoice, paymentsLoading, loading, error, success } = useSelector((s) => s.cashier);

  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [openProcess, setOpenProcess] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [txnId, setTxnId] = useState('');

  const load = useCallback(() => {
    dispatch(fetchPendingPayments());
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (success) { toast.success(success); dispatch(clearCashierSuccess()); load(); }
    if (error) { toast.error(error); dispatch(clearCashierError()); }
  }, [success, error, dispatch, load]);

  const handleOpenProcess = (row) => {
    setSelectedRow(row);
    setAmount(String(row.balanceDue?.toFixed(2) || row.totalAmount?.toFixed(2) || ''));
    setPaymentMethod('cash');
    setTxnId('');
    setOpenProcess(true);
  };

  const handleOpenView = (row) => {
    setOpenView(true);
    dispatch(fetchInvoiceById(row.id));
  };

  const handleProcess = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    await dispatch(processPaymentAction({
      id: selectedRow.id,
      data: { amount: Number(amount), paymentMethod, transactionId: txnId || undefined },
    }));
    setOpenProcess(false);
  };

  const invoices = pendingPayments?.invoices || [];
  const filtered = invoices.filter((inv) => {
    const name = inv.patient?.name || inv.patient?.user?.name || '';
    const id = inv.invoiceId || '';
    return name.toLowerCase().includes(search.toLowerCase()) || id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Pending Payments</Typography>
          <Typography variant="body2" color="text.secondary">Unpaid & partially paid invoices</Typography>
        </Box>
        <IconButton onClick={load} title="Refresh" sx={{ color: TEAL }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField fullWidth placeholder="Search by patient name or invoice ID…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: `${TEAL}0A` }}>
            <TableRow>
              {['Invoice ID', 'Patient', 'Items', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentsLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                {search ? 'No results found.' : 'No pending payments. 🎉'}
              </TableCell></TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: TEAL }}>{row.invoiceId}</TableCell>
                  <TableCell>{row.patient?.name || row.patient?.user?.name || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{row.items?.length || 0} item(s)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{fmt(row.totalAmount)}</TableCell>
                  <TableCell sx={{ color: '#34D399', fontWeight: 600 }}>{fmt(row.paidAmount)}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: AMBER }}>{fmt(row.balanceDue)}</TableCell>
                  <TableCell>{statusChip(row.status)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => handleOpenView(row)} title="View Details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <Button variant="contained" size="small" startIcon={<PaymentsIcon />}
                        onClick={() => handleOpenProcess(row)}
                        sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none', borderRadius: '8px', fontSize: '0.78rem' }}>
                        Pay
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Process Payment Dialog */}
      <Dialog open={openProcess} onClose={() => setOpenProcess(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Process Payment</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Patient</Typography>
            <Typography fontWeight={700}>{selectedRow?.patient?.name || selectedRow?.patient?.user?.name || '—'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Invoice</Typography>
              <Typography fontWeight={600} fontSize="0.85rem">{selectedRow?.invoiceId}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Balance Due</Typography>
              <Typography fontWeight={800} color={TEAL}>{fmt(selectedRow?.balanceDue)}</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TextField fullWidth label="Payment Amount (Rs.)" type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} sx={{ mb: 2 }}
            inputProps={{ min: 0, step: '0.01' }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select value={paymentMethod} label="Payment Method" onChange={(e) => setPaymentMethod(e.target.value)}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Credit / Debit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="online">Online Payment</MenuItem>
            </Select>
          </FormControl>
          {(paymentMethod === 'card' || paymentMethod === 'bank_transfer' || paymentMethod === 'online') && (
            <TextField fullWidth label="Transaction / Reference ID" value={txnId}
              onChange={(e) => setTxnId(e.target.value)} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenProcess(false)} color="inherit">Cancel</Button>
          <Button onClick={handleProcess} variant="contained" disabled={loading}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' } }}>
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={openView} onClose={() => { setOpenView(false); dispatch(clearSelectedInvoice()); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Invoice Details</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress sx={{ color: TEAL }} /></Box>
          ) : selectedInvoice ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Invoice ID</Typography>
                  <Typography fontWeight={700} color={TEAL}>{selectedInvoice.invoiceId}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography fontWeight={600}>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</Typography>
                </Box>
                <Box>{statusChip(selectedInvoice.status)}</Box>
              </Box>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: `${TEAL}0A`, borderRadius: '8px' }}>
                <Typography variant="caption" color="text.secondary">Patient</Typography>
                <Typography fontWeight={700}>{selectedInvoice.patient?.name || selectedInvoice.patient?.user?.name || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedInvoice.patient?.email || selectedInvoice.patient?.user?.email}</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedInvoice.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell><Chip label={item.category} size="small" /></TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Typography variant="body2">Subtotal: <strong>{fmt(selectedInvoice.subtotal)}</strong></Typography>
                {selectedInvoice.taxRate > 0 && <Typography variant="body2">Tax ({selectedInvoice.taxRate}%): <strong>{fmt(selectedInvoice.taxAmount)}</strong></Typography>}
                {selectedInvoice.discount > 0 && <Typography variant="body2" color="success.main">Discount: -<strong>{fmt(selectedInvoice.discount)}</strong></Typography>}
                <Divider sx={{ width: '100%', my: 0.5 }} />
                <Typography fontWeight={800} fontSize="1.1rem">Total: {fmt(selectedInvoice.totalAmount)}</Typography>
                <Typography color="#34D399" fontWeight={600}>Paid: {fmt(selectedInvoice.paidAmount)}</Typography>
                <Typography color={AMBER} fontWeight={700}>Balance: {fmt(selectedInvoice.balanceDue)}</Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Could not load invoice.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpenView(false); dispatch(clearSelectedInvoice()); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingPayments;
