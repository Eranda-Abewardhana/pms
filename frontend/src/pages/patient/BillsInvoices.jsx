import React, { useEffect } from 'react';
import {
  Box, Typography, Card, Chip, CircularProgress, Alert, Grid,
  Accordion, AccordionSummary, AccordionDetails, Divider,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/Pending';
import PaymentIcon from '@mui/icons-material/Payment';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyInvoices } from '../../features/patient/patientSlice';

const statusConfig = {
  paid:            { label: 'Paid',           color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  pending:         { label: 'Pending',         color: '#FF9F43', bg: 'rgba(255,159,67,0.12)'  },
  partially_paid:  { label: 'Partial',         color: '#4B9EFF', bg: 'rgba(75,158,255,0.12)'  },
  overdue:         { label: 'Overdue',         color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
};

const methodLabel = { cash: 'Cash', card: 'Card', online: 'Online', insurance: 'Insurance' };

const BillsInvoices = () => {
  const dispatch = useDispatch();
  const { invoices, invoicesLoading, invoicesError } = useSelector((s) => s.patient);

  useEffect(() => { dispatch(fetchMyInvoices()); }, [dispatch]);

  const totalDue = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + ((i.totalAmount || 0) - (i.paidAmount || 0)), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.paidAmount || 0), 0);

  if (invoicesLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: '#00C6B3' }} />
    </Box>
  );

  if (invoicesError) return <Alert severity="error" sx={{ m: 2 }}>{invoicesError}</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>Bills & Invoices</Typography>
        <Typography variant="body2" sx={{ color: '#8A94A6', mt: 0.5 }}>View your billing history and payment status</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Invoices', value: invoices.length, color: '#4B9EFF', bg: 'rgba(75,158,255,0.1)', icon: ReceiptLongIcon },
          { label: 'Amount Paid',    value: `LKR ${totalPaid.toLocaleString()}`, color: '#34D399', bg: 'rgba(52,211,153,0.1)', icon: CheckCircleOutlineIcon },
          { label: 'Amount Due',     value: `LKR ${totalDue.toLocaleString()}`,  color: totalDue > 0 ? '#FF9F43' : '#34D399', bg: totalDue > 0 ? 'rgba(255,159,67,0.1)' : 'rgba(52,211,153,0.1)', icon: PendingIcon },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <Grid item xs={12} sm={4} key={label}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon sx={{ color, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>{label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {invoices.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <ReceiptLongIcon sx={{ fontSize: 56, color: '#4A5568', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#8A94A6', fontWeight: 600 }}>No Invoices Yet</Typography>
          <Typography variant="body2" sx={{ color: '#4A5568', mt: 1 }}>Your billing history will appear here after your visits.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invoices.map((inv) => {
            const cfg = statusConfig[inv.status] || statusConfig.pending;
            const itemTotal = (inv.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
            const taxAmount = itemTotal * ((inv.taxRate || 0) / 100);
            const total = itemTotal + taxAmount - (inv.discount || 0);

            return (
              <Accordion
                key={inv._id}
                sx={{
                  bgcolor: '#1A2236',
                  border: `1px solid ${inv.status === 'overdue' ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#8A94A6' }} />} sx={{ px: 3, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ReceiptLongIcon sx={{ color: cfg.color, fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                        Invoice #{String(inv._id).slice(-6).toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8A94A6' }}>
                        {new Date(inv.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {inv.appointment?.appointmentId && ` • Apt: ${inv.appointment.appointmentId}`}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#E8ECF4' }}>
                        LKR {total.toLocaleString()}
                      </Typography>
                      <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${cfg.color}40`, mt: 0.25 }} />
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                  {/* Items Table */}
                  {(inv.items || []).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>Items</Typography>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {inv.items.map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.2, borderBottom: idx < inv.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <Box>
                              <Typography variant="body2" sx={{ color: '#E8ECF4', fontWeight: 500 }}>{item.description}</Typography>
                              <Typography variant="caption" sx={{ color: '#8A94A6' }}>Qty: {item.quantity} × LKR {item.unitPrice?.toLocaleString()}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#E8ECF4', fontWeight: 700 }}>LKR {item.amount?.toLocaleString()}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Totals */}
                  <Box sx={{ bgcolor: 'rgba(0,198,179,0.04)', borderRadius: '8px', p: 2, border: '1px solid rgba(0,198,179,0.1)' }}>
                    {[
                      { label: 'Subtotal', value: itemTotal },
                      inv.taxRate && { label: `Tax (${inv.taxRate}%)`, value: taxAmount },
                      inv.discount && { label: 'Discount', value: -inv.discount },
                    ].filter(Boolean).map(({ label, value }) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#8A94A6' }}>{label}</Typography>
                        <Typography variant="caption" sx={{ color: '#E8ECF4', fontWeight: 600 }}>LKR {value?.toLocaleString()}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ borderColor: 'rgba(0,198,179,0.15)', my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#E8ECF4' }}>Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#00C6B3' }}>LKR {total.toLocaleString()}</Typography>
                    </Box>
                    {inv.paidAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#8A94A6' }}>Paid ({methodLabel[inv.paymentMethod] || inv.paymentMethod || 'N/A'})</Typography>
                        <Typography variant="caption" sx={{ color: '#34D399', fontWeight: 700 }}>LKR {inv.paidAmount?.toLocaleString()}</Typography>
                      </Box>
                    )}
                  </Box>
                  {inv.notes && <Typography variant="caption" sx={{ color: '#8A94A6', display: 'block', mt: 1.5 }}>Note: {inv.notes}</Typography>}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default BillsInvoices;
