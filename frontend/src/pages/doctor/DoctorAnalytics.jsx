import React, { useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Stack, Chip, CircularProgress, Paper,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDiseaseTrends, fetchDoctorStats } from '../../features/doctor/doctorSlice';
import { fetchAllAppointments } from '../../features/appointment/appointmentSlice';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScienceIcon from '@mui/icons-material/Science';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const TEAL = '#00C6B3';
const COLORS = ['#00C6B3','#4B9EFF','#FF9F43','#A78BFA','#F87171','#34D399','#FB923C','#818CF8','#F472B6','#4ADE80'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" fontWeight={700}>{label}</Typography>
      <Typography variant="body2" color={TEAL} fontWeight={700}>{payload[0]?.value} cases</Typography>
    </Box>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      <Icon />
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography variant="h6" fontWeight={800}>{value}</Typography>
    </Box>
  </Card>
);

const DoctorAnalytics = () => {
  const dispatch = useDispatch();
  const { diseaseTrends, trendsLoading, stats } = useSelector((s) => s.doctor);
  const { appointments } = useSelector((s) => s.appointment);

  useEffect(() => {
    dispatch(fetchDiseaseTrends());
    dispatch(fetchDoctorStats());
    dispatch(fetchAllAppointments({ page: 1, limit: 200 }));
  }, [dispatch]);

  // Compute appointment status distribution
  const statusCounts = (appointments || []).reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  const statusPie = Object.entries(statusCounts).map(([name, value], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
    value,
    color: COLORS[i % COLORS.length],
  }));

  const trends = diseaseTrends || [];
  const maxCount = trends.length > 0 ? Math.max(...trends.map((t) => t.count)) : 1;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Analytics</Typography>
        <Typography variant="body2" color="text.secondary">Disease trends and appointment insights from your patient data</Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard icon={CalendarMonthIcon} label="Today's Appointments" value={stats?.todayAppointments || 0} color={TEAL} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={ScienceIcon} label="Total Patients" value={stats?.totalPatients || 0} color="#4B9EFF" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={TrendingUpIcon} label="Unique Diagnoses" value={trends.length} color="#A78BFA" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Disease Trends Bar Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <ScienceIcon sx={{ color: TEAL }} />
              <Typography variant="h6" fontWeight={700}>Top Diagnoses</Typography>
              <Chip label="Last 6 months" size="small" sx={{ bgcolor: `${TEAL}12`, color: TEAL, fontWeight: 600 }} />
            </Stack>
            {trendsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: TEAL }} /></Box>
            ) : trends.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, opacity: 0.4 }}>
                <ScienceIcon sx={{ fontSize: 48 }} />
                <Typography color="text.secondary" mt={1}>No diagnosis data yet</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="diagnosis" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {trends.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Appointment Status Pie */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={3}>
              <CalendarMonthIcon sx={{ color: '#4B9EFF' }} />
              <Typography variant="h6" fontWeight={700}>Appointment Status</Typography>
            </Stack>
            {statusPie.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, opacity: 0.4 }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                      {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Diagnosis Chips — Word Cloud style */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>Diagnosis Frequency Map</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {trends.map((t, i) => {
                const size = 0.7 + (t.count / maxCount) * 0.8;
                return (
                  <Chip
                    key={i}
                    label={`${t.diagnosis} (${t.count})`}
                    sx={{
                      bgcolor: `${COLORS[i % COLORS.length]}18`,
                      color: COLORS[i % COLORS.length],
                      fontWeight: 700,
                      fontSize: `${Math.max(0.65, Math.min(size, 1.1))}rem`,
                      height: 'auto',
                      py: 0.5,
                    }}
                  />
                );
              })}
              {trends.length === 0 && <Typography color="text.secondary">No diagnoses recorded yet.</Typography>}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorAnalytics;
