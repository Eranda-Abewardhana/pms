import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Grid, CircularProgress, Button,
  TextField, Chip, Paper, Stack,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import TodayIcon from '@mui/icons-material/Today';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTransactionAnalytics,
  fetchRevenueReport,
  fetchDailyIncomeReport,
} from '../../features/cashier/cashierSlice';
import axiosInstance from '../../api/axiosInstance';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const TEAL = '#00C6B3';
const BLUE = '#4B9EFF';
const AMBER = '#FF9F43';
const GREEN = '#34D399';
const PURPLE = '#A78BFA';
const PINK = '#F87171';

const METHOD_COLORS = { cash: GREEN, card: BLUE, bank_transfer: PURPLE, online: AMBER };
const PIE_COLORS = [TEAL, BLUE, AMBER, GREEN, PURPLE, PINK];

const fmt = (val) =>
  `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const SummaryCard = ({ label, value, icon: Icon, color }) => (
  <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: '16px' }}>
    <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      <Icon />
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography variant="h6" fontWeight={800}>{value}</Typography>
    </Box>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={700}>{label}</Typography>
      <Typography variant="body2" color={TEAL} fontWeight={700}>{fmt(payload[0]?.value)}</Typography>
    </Box>
  );
};

const FinancialReports = () => {
  const dispatch = useDispatch();
  const { analytics, revenueReport, dailyReport, reportsLoading } = useSelector((s) => s.cashier);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState('');

  const load = useCallback(() => {
    dispatch(fetchTransactionAnalytics({ startDate, endDate }));
    dispatch(fetchRevenueReport({ startDate, endDate }));
    dispatch(fetchDailyIncomeReport());
  }, [dispatch, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const ext = type === 'pdf' ? 'pdf' : 'xlsx';
      const contentType = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const res = await axiosInstance.get(`/reports/export/${type}`, {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: contentType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${startDate}-to-${endDate}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting('');
    }
  };

  const totalRevenue = (analytics?.byMethod || []).reduce((s, m) => s + m.total, 0);
  const totalTxns = (analytics?.byMethod || []).reduce((s, m) => s + m.count, 0);
  const avgDaily = revenueReport.length > 0 ? totalRevenue / revenueReport.length : 0;

  const methodPie = (analytics?.byMethod || []).map((m) => ({
    name: { cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer', online: 'Online' }[m._id] || m._id || 'Unknown',
    value: m.total,
    color: METHOD_COLORS[m._id] || TEAL,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px' }}>Financial Reports</Typography>
          <Typography variant="body1" color="text.secondary">Revenue analytics and daily income summaries</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} onClick={load} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none' }}>Refresh Data</Button>
      </Box>

      {/* Date Filter + Export */}
      <Card sx={{ p: 2, mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderRadius: '12px' }}>
        <AssessmentIcon sx={{ color: TEAL, ml: 1 }} />
        <Typography variant="body2" fontWeight={700}>Report Period:</Typography>
        <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }} size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }} size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button variant="contained" onClick={load} sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none', borderRadius: '8px' }}>Apply Filter</Button>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            startIcon={exporting === 'pdf' ? <CircularProgress size={14} /> : <PictureAsPdfIcon />}
            variant="outlined" size="small" disabled={!!exporting}
            onClick={() => handleExport('pdf')}
            sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
            Export PDF
          </Button>
          <Button
            startIcon={exporting === 'excel' ? <CircularProgress size={14} /> : <TableChartIcon />}
            variant="outlined" size="small" disabled={!!exporting}
            onClick={() => handleExport('excel')}
            sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#16A34A', color: '#16A34A', '&:hover': { bgcolor: '#F0FDF4' } }}>
            Export Excel
          </Button>
        </Box>
      </Card>

      {reportsLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box> : (
        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12} sm={6} md={3}><SummaryCard label="Total Revenue" value={fmt(totalRevenue)} icon={AccountBalanceWalletIcon} color={TEAL} /></Grid>
          <Grid item xs={12} sm={6} md={3}><SummaryCard label="Transactions" value={totalTxns} icon={ReceiptIcon} color={BLUE} /></Grid>
          <Grid item xs={12} sm={6} md={3}><SummaryCard label="Avg Daily Revenue" value={fmt(avgDaily)} icon={TrendingUpIcon} color={GREEN} /></Grid>
          <Grid item xs={12} sm={6} md={3}><SummaryCard label="Growth Trend" value="+12.5%" icon={AssessmentIcon} color={AMBER} /></Grid>

          {/* Today's Income */}
          <Grid item xs={12}>
            <Card sx={{ p: 3, borderRadius: '16px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <TodayIcon sx={{ color: TEAL }} />
                <Typography variant="h6" fontWeight={700}>Today's Income Breakdown</Typography>
                <Chip label="Real-time" size="small" sx={{ bgcolor: `${GREEN}15`, color: GREEN, fontWeight: 700 }} />
              </Box>
              <TableContainer component={Box}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Transactions</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyReport.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No transactions recorded yet today.</TableCell></TableRow>
                    ) : dailyReport.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{row._id}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: TEAL }}>{fmt(row.total)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ width: '100%', bgcolor: 'action.hover', height: 8, borderRadius: 4, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 4, bgcolor: METHOD_COLORS[row._id] || TEAL, width: `${(row.total / (dailyReport.reduce((a, b) => a + b.total, 0)) * 100).toFixed(0)}%` }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: '16px', minHeight: 400 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Revenue Trend</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueReport.map((r) => ({ date: r._id?.slice(5) || r.date?.slice(5), total: r.total }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total" stroke={TEAL} strokeWidth={3} dot={{ r: 4, fill: TEAL }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Payment Methods</Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methodPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {methodPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FinancialReports;
