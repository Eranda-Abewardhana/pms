import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button, IconButton, TextField,
  InputAdornment, Tooltip, CircularProgress, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPaymentHistory,
  fetchInvoiceById,
  clearSelectedInvoice,
} from '../../features/cashier/cashierSlice';

const TEAL = '#00C6B3';
const GREEN = '#34D399';

const fmt = (val) =>
  `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const methodLabel = (m) => {
  const map = { cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer', online: 'Online' };
  return map[m] || m || 'Cash';
};

const handlePrint = (invoice) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Receipt - ${invoice.invoiceId}</title>
    <style>
      @media print { @page { margin: 0.5cm; } }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #eee; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid ${TEAL}; padding-bottom: 10px; }
      .logo { font-size: 24px; font-weight: bold; color: ${TEAL}; margin: 0; }
      .subtitle { font-size: 12px; color: #666; margin: 2px 0 0 0; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; font-size: 13px; }
      .info-label { color: #888; font-weight: 600; font-size: 11px; text-transform: uppercase; }
      .info-value { font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { text-align: left; background: #f9f9f9; padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #ddd; }
      td { padding: 10px 8px; font-size: 13px; border-bottom: 1px dotted #eee; }
      .totals { margin-left: auto; width: 200px; }
      .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
      .grand-total { font-size: 16px; font-weight: 800; color: ${TEAL}; border-top: 1px solid #ddd; margin-top: 5px; padding-top: 10px; }
      .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      .verified-badge { display: inline-block; padding: 4px 8px; background: #34D39915; color: #34D399; border-radius: 4px; font-weight: bold; font-size: 10px; margin-top: 10px; }
    </style>
    </head><body>
    <div class="header">
      <p class="logo">MetroCare</p>
      <p class="subtitle">Patient Management System | Payment Receipt</p>
    </div>
    <div class="info-grid">
      <div>
        <div class="info-label">Invoice ID</div>
        <div class="info-value">${invoice.invoiceId}</div>
      </div>
      <div style="text-align: right">
        <div class="info-label">Date</div>
        <div class="info-value">${new Date(invoice.updatedAt).toLocaleDateString()}</div>
      </div>
      <div>
        <div class="info-label">Patient Name</div>
        <div class="info-value">${invoice.patient?.userId?.name || '—'}</div>
      </div>
      <div style="text-align: right">
        <div class="info-label">Payment Method</div>
        <div class="info-value">${methodLabel(invoice.paymentMethod)}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr>
      </thead>
      <tbody>
        ${(invoice.items || []).map((it) => `
          <tr>
            <td>${it.description} <br/><small style="color:#888">${it.category}</small></td>
            <td style="text-align:center">${it.quantity}</td>
            <td style="text-align:right">${fmt(it.amount)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
      ${invoice.taxAmount ? `<div class="total-row"><span>Tax (${invoice.taxRate}%)</span><span>${fmt(invoice.taxAmount)}</span></div>` : ''}
      ${invoice.discount ? `<div class="total-row" style="color:#34D399"><span>Discount</span><span>-${fmt(invoice.discount)}</span></div>` : ''}
      <div class="total-row grand-total"><span>Total Paid</span><span>${fmt(invoice.paidAmount)}</span></div>
    </div>
    <div class="footer">
      <div class="verified-badge">✓ PAYMENT VERIFIED</div>
      <p>This is a computer-generated receipt. No signature required.</p>
      <p>Thank you for choosing MetroCare Hospital.</p>
    </div>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

const InvoiceHistory = () => {
  const dispatch = useDispatch();
  const { paymentHistory, selectedInvoice, paymentsLoading, loading } = useSelector((s) => s.cashier);

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewOpen, setViewOpen] = useState(false);

  const load = useCallback(() => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    dispatch(fetchPaymentHistory(params));
  }, [dispatch, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const invoices = paymentHistory?.invoices || [];
  const filtered = invoices.filter((inv) => {
    const name = inv.patient?.userId?.name || '';
    const id = inv.invoiceId || '';
    const method = inv.paymentMethod || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || id.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'all' || method === methodFilter;
    return matchSearch && matchMethod;
  });

  const handleView = (row) => {
    setViewOpen(true);
    dispatch(fetchInvoiceById(row._id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Invoice & Payment History</Typography>
          <Typography variant="body2" color="text.secondary">Completed transactions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={load} title="Refresh" sx={{ color: TEAL }}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setFilterOpen(!filterOpen)}
            sx={{ borderRadius: '8px', textTransform: 'none' }}>Filter</Button>
        </Box>
      </Box>

      {filterOpen && (
        <Card sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField type="date" label="From" InputLabelProps={{ shrink: true }} size="small"
            value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <TextField type="date" label="To" InputLabelProps={{ shrink: true }} size="small"
            value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select value={methodFilter} label="Payment Method" onChange={(e) => setMethodFilter(e.target.value)}>
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="online">Online</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={load} sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none' }}>
            Apply
          </Button>
          <Button onClick={() => { setStartDate(''); setEndDate(''); setMethodFilter('all'); }} color="inherit" sx={{ textTransform: 'none' }}>
            Clear
          </Button>
        </Card>
      )}

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField fullWidth placeholder="Search by patient name or invoice ID…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: `${TEAL}0A` }}>
            <TableRow>
              {['Invoice ID', 'Patient', 'Method', 'Total', 'Paid', 'Date', 'Status', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentsLoading ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: TEAL }} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No paid invoices found.</TableCell></TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ fontWeight: 700, color: TEAL, fontSize: '0.82rem' }}>{row.invoiceId}</TableCell>
                  <TableCell>{row.patient?.userId?.name || '—'}</TableCell>
                  <TableCell>
                    <Chip label={methodLabel(row.paymentMethod)} size="small"
                      sx={{ bgcolor: 'rgba(75,158,255,0.12)', color: '#4B9EFF', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{fmt(row.totalAmount)}</TableCell>
                  <TableCell sx={{ color: GREEN, fontWeight: 700 }}>{fmt(row.paidAmount)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(row.paidAt || row.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label="Paid" size="small" sx={{ bgcolor: `${GREEN}18`, color: GREEN, fontWeight: 700 }} />
                      <VerifiedIcon sx={{ fontSize: 16, color: GREEN }} titleAccess="Payment Verified" />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Invoice">
                        <IconButton size="small" onClick={() => handleView(row)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Print Receipt">
                        <IconButton size="small" onClick={() => dispatch(fetchInvoiceById(row._id)).then((r) => {
                          if (r.payload) handlePrint(r.payload);
                        })}><PrintIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Invoice Dialog */}
      <Dialog open={viewOpen} onClose={() => { setViewOpen(false); dispatch(clearSelectedInvoice()); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          Invoice Details
          <IconButton onClick={() => { setViewOpen(false); dispatch(clearSelectedInvoice()); }}><CloseIcon /></IconButton>
        </DialogTitle>
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
                  <Typography variant="caption" color="text.secondary">Paid On</Typography>
                  <Typography fontWeight={600}>{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString() : '—'}</Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: `${TEAL}0A`, borderRadius: '8px' }}>
                <Typography variant="caption" color="text.secondary">Patient</Typography>
                <Typography fontWeight={700}>{selectedInvoice.patient?.userId?.name || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">{selectedInvoice.patient?.userId?.email}</Typography>
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
                <Typography fontWeight={800} fontSize="1.1rem">Total Paid: {fmt(selectedInvoice.paidAmount)}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={methodLabel(selectedInvoice.paymentMethod)} size="small" sx={{ bgcolor: 'rgba(75,158,255,0.12)', color: '#4B9EFF', fontWeight: 700 }} />
                  <Chip icon={<VerifiedIcon />} label="Verified" size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">Could not load invoice.</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => selectedInvoice && handlePrint(selectedInvoice)} startIcon={<PrintIcon />}
            sx={{ textTransform: 'none' }}>Print Receipt</Button>
          <Button onClick={() => { setViewOpen(false); dispatch(clearSelectedInvoice()); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceHistory;
