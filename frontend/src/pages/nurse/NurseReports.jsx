import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Stack, CircularProgress, useTheme,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVitalsHistory, fetchDailyVitalsReport } from '../../features/nurse/nurseSlice';
import { format, subDays } from 'date-fns';

const StatBadge = ({ label, value, color, loading }) => {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{
      p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`,
      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
      textAlign: 'center',
    }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color, lineHeight: 1 }}>
        {loading ? <CircularProgress size={20} sx={{ color }} /> : value ?? '—'}
      </Typography>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}>{label}</Typography>
    </Paper>
  );
};

// Simple ASCII-style bar chart rendered as MUI components
const BarChart = ({ data, loading }) => {
  const theme = useTheme();
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: '#00C6B3' }} /></Box>;
  if (!data || data.length === 0) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <AssessmentIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.3 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No data for the selected period</Typography>
    </Box>
  );

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {data.map((d) => (
          <Box key={d.date ?? d._id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                {d.date ?? d._id}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#00C6B3' }}>
                {d.count} vitals
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 10, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
              <Box sx={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${(d.count / maxVal) * 100}%`,
                bgcolor: '#00C6B3',
                borderRadius: 1,
                transition: 'width 0.6s ease',
                background: 'linear-gradient(90deg, #00C6B3, #4B9EFF)',
              }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const NurseReports = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { vitalsHistory, dailyReport, reportLoading } = useSelector((s) => s.nurse);

  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const limit = 15;

  useEffect(() => {
    dispatch(fetchDailyVitalsReport({ days }));
  }, [dispatch, days]);

  useEffect(() => {
    dispatch(fetchVitalsHistory({ page, limit, startDate, endDate: endDate + 'T23:59:59' }));
  }, [dispatch, page]);

  const handleFilter = () => {
    setPage(1);
    dispatch(fetchVitalsHistory({ page: 1, limit, startDate, endDate: endDate + 'T23:59:59' }));
  };

  const handleExportCSV = () => {
    const rows = vitalsHistory.records || [];
    if (rows.length === 0) return;

    const headers = ['Date', 'Patient', 'BP', 'Temperature (°C)', 'Pulse (bpm)', 'SpO2 (%)', 'Weight (kg)', 'BMI', 'Notes'];
    const csvRows = rows.map((v) => [
      v.recordedAt ? format(new Date(v.recordedAt), 'yyyy-MM-dd HH:mm') : '',
      v.patient?.user?.name || v.patient?.name || '',
      v.bloodPressure?.systolic ? `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}` : '',
      v.temperature?.value ?? '',
      v.pulse ?? '',
      v.oxygenSaturation ?? '',
      v.weight?.value ?? '',
      v.bmi ?? '',
      (v.notes || '').replace(/,/g, ';'),
    ]);

    const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nurse_vitals_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalVitals = vitalsHistory.total || 0;
  const todayCount = dailyReport?.find?.((d) => d.date === format(new Date(), 'yyyy-MM-dd'))?.count || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
            Nursing Reports
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Track your nursing activity and patient vitals over time
          </Typography>
        </Box>
        <Button
          variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}
          sx={{
            textTransform: 'none', fontWeight: 700, borderColor: '#00C6B3', color: '#00C6B3',
            '&:hover': { borderColor: '#00C6B3', bgcolor: 'rgba(0,198,179,0.08)' },
          }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatBadge label="Vitals Today" value={todayCount} color="#00C6B3" loading={reportLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBadge label={`Vitals (Last ${days} Days)`} value={dailyReport?.reduce?.((a, b) => a + b.count, 0)} color="#4B9EFF" loading={reportLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBadge label="Records in Filter" value={totalVitals} color="#A78BFA" loading={false} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatBadge label="Current Page" value={`${page} / ${vitalsHistory.totalPages || 1}`} color="#FF9F43" loading={false} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Daily Chart */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Daily Activity</Typography>
                <Typography variant="caption" color="text.secondary">Vitals recorded per day</Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select size="small" value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  sx={{ minWidth: 110 }}
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={14}>Last 14 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                </TextField>
                <Button size="small" variant="outlined" onClick={() => dispatch(fetchDailyVitalsReport({ days }))}
                  sx={{ minWidth: 0, px: 1, borderColor: theme.palette.divider, color: 'text.secondary', '&:hover': { borderColor: '#00C6B3', color: '#00C6B3' } }}>
                  <RefreshIcon fontSize="small" />
                </Button>
              </Stack>
            </Box>
            {reportLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
            <BarChart data={dailyReport} loading={false} />
          </Paper>
        </Grid>

        {/* Vitals Table */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Activity Log</Typography>
              <Typography variant="caption" color="text.secondary">All vitals recorded by you</Typography>
            </Box>

            {/* Filters */}
            <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField size="small" type="date" label="From" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="date" label="To" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <Button variant="contained" size="small" onClick={handleFilter}
                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#00C6B3', '&:hover': { bgcolor: '#00a896' } }}>
                Apply Filter
              </Button>
            </Box>

            {reportLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Date/Time', 'Patient', 'BP', 'Temp', 'Pulse', 'SpO2', 'BMI'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(vitalsHistory.records || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                        <MonitorHeartIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1, display: 'block', mx: 'auto' }} />
                        No records in the selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    (vitalsHistory.records || []).map((v) => {
                      const patientName = v.patient?.user?.name || v.patient?.name || 'Unknown';
                      return (
                        <TableRow key={v.id ?? v._id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {v.recordedAt ? format(new Date(v.recordedAt), 'MMM d HH:mm') : '—'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{patientName}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#FF6B6B', fontSize: '0.8rem' }}>
                            {v.bloodPressure?.systolic ? `${v.bloodPressure.systolic}/${v.bloodPressure.diastolic}` : '—'}
                          </TableCell>
                          <TableCell sx={{ color: '#FF9F43', fontWeight: 600, fontSize: '0.8rem' }}>{v.temperature?.value ?? '—'}</TableCell>
                          <TableCell sx={{ color: '#00C6B3', fontWeight: 600, fontSize: '0.8rem' }}>{v.pulse ?? '—'}</TableCell>
                          <TableCell sx={{ color: '#4B9EFF', fontWeight: 600, fontSize: '0.8rem' }}>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '—'}</TableCell>
                          <TableCell>
                            {v.bmi
                              ? <Chip label={v.bmi} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: v.bmi < 25 ? 'rgba(52,211,153,0.12)' : 'rgba(255,159,67,0.12)', color: v.bmi < 25 ? '#34D399' : '#FF9F43' }} />
                              : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {vitalsHistory.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 2, py: 1.5, gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                  ← Prev
                </Button>
                <Typography variant="caption" color="text.secondary">Page {page} of {vitalsHistory.totalPages}</Typography>
                <Button size="small" disabled={page >= vitalsHistory.totalPages} onClick={() => setPage((p) => p + 1)}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#00C6B3' }}>
                  Next →
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NurseReports;
