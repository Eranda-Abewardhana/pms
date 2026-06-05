import React, { useEffect } from 'react';
import { Typography, Grid, Card, Box, Skeleton, Button, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PaymentsIcon from '@mui/icons-material/Payments';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { fetchCashierStats, fetchWeeklyIncome } from '../../features/cashier/cashierSlice';
import { useNavigate } from 'react-router-dom';

const TEAL = '#00C6B3';
const BLUE = '#4B9EFF';
const AMBER = '#FF9F43';
const GREEN = '#34D399';

const fmt = (val) =>
  val === undefined || val === null
    ? '—'
    : `Rs. ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const StatCard = ({ label, value, icon: Icon, color, sub, onClick }) => (
  <Card onClick={onClick} sx={{
    p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}22` } : {},
  }}>
    <Box sx={{
      width: 54, height: 54, borderRadius: '14px', bgcolor: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
    }}>
      <Icon fontSize="large" />
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: GREEN, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <TrendingUpIcon sx={{ fontSize: 14 }} /> {sub}
        </Typography>
      )}
    </Box>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={700}>{label}</Typography>
      <Typography variant="body2" color={TEAL} fontWeight={700}>
        Rs. {(payload[0].value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  );
};

const CashierDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, weeklyIncome, loading } = useSelector((s) => s.cashier);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    const loadData = () => {
      dispatch(fetchCashierStats());
      dispatch(fetchWeeklyIncome());
    };
    
    loadData();
    
    // Auto-refresh every 60 seconds
    const timer = setInterval(loadData, 60000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const chartData = weeklyIncome.length > 0
    ? weeklyIncome
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((name) => ({ name, amount: 0 }));

  const maxIdx = chartData.reduce((mi, r, i, a) => (r.amount > a[mi].amount ? i : mi), 0);

  const quickActions = [
    { label: 'Create New Invoice', icon: AddBoxIcon, path: '/cashier/create-invoice', color: TEAL },
    { label: 'Process Pending Payments', icon: PendingActionsIcon, path: '/cashier/pending-payments', color: AMBER },
    { label: 'Invoice History', icon: ReceiptIcon, path: '/cashier/invoices', color: BLUE },
    { label: 'Financial Reports', icon: AssessmentIcon, path: '/cashier/reports', color: GREEN },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Cashier Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome back, <strong>{user?.name}</strong>. Manage payments and financial records efficiently.
          </Typography>
        </Box>
        <Chip 
          icon={<AutorenewIcon sx={{ fontSize: '16px !important' }} />} 
          label="Auto-refreshing" 
          size="small" 
          variant="outlined" 
          sx={{ color: TEAL, borderColor: `${TEAL}44`, fontWeight: 600 }} 
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Today's Income" value={fmt(stats?.todayIncome)} icon={AccountBalanceWalletIcon}
              color={TEAL} sub={`${stats?.todayCount || 0} transactions`} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Pending Payments" value={stats?.pendingCount || '0'} icon={PendingActionsIcon}
              color={AMBER} onClick={() => navigate('/cashier/pending-payments')} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Total Invoices" value={stats?.totalInvoices || '0'} icon={ReceiptIcon}
              color={BLUE} onClick={() => navigate('/cashier/invoices')} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <Card sx={{
              p: 3, height: '100%',
              background: `linear-gradient(135deg, ${TEAL} 0%, ${BLUE} 100%)`,
              color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weekly Total
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{fmt(stats?.weeklyIncome)}</Typography>
              <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />}
                sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: '8px', alignSelf: 'flex-start' }}
                onClick={() => navigate('/cashier/reports')}>
                View Reports
              </Button>
            </Card>
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Weekly Income Trend</Typography>
                <Typography variant="caption" color="text.secondary">Last 7 days revenue</Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/cashier/reports')} sx={{ textTransform: 'none' }}>
                Full Report
              </Button>
            </Box>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i === maxIdx ? BLUE : TEAL} opacity={i === maxIdx ? 1 : 0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              {quickActions.map(({ label, icon: Icon, path, color }) => (
                <Button key={label} fullWidth variant="outlined" startIcon={<Icon sx={{ color }} />}
                  onClick={() => navigate(path)}
                  sx={{ justifyContent: 'flex-start', py: 1.4, borderRadius: '10px', borderColor: `${color}44`, textTransform: 'none', fontWeight: 600, color: 'text.primary', '&:hover': { borderColor: color, bgcolor: `${color}0A` } }}>
                  {label}
                </Button>
              ))}
            </Box>
            <Box sx={{ mt: 3, p: 2, bgcolor: `${AMBER}0D`, borderRadius: '10px', border: `1px dashed ${AMBER}66` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PaymentsIcon sx={{ fontSize: 16, color: AMBER }} />
                <Typography variant="subtitle2" sx={{ color: AMBER, fontWeight: 700 }}>Security Reminder</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Always verify the patient's ID before processing card or bank transfers. Keep your session secure.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CashierDashboard;
