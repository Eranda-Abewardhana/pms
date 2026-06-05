import React, { useEffect } from 'react';
import {
  Box, Grid, Typography, Paper, Avatar, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, LinearProgress,
} from '@mui/material';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PeopleIcon from '@mui/icons-material/People';
import ScienceIcon from '@mui/icons-material/Science';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNurseStats, fetchPatientQueue } from '../../features/nurse/nurseSlice';
import { format } from 'date-fns';

const statusColor = {
  scheduled: { color: '#4B9EFF', bg: 'rgba(75,158,255,0.12)' },
  waiting: { color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
  'in-consultation': { color: '#00C6B3', bg: 'rgba(0,198,179,0.12)' },
  completed: { color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  cancelled: { color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
};

const StatCard = ({ icon, label, value, color, sub, loading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 28px ${color}22` },
      }}
    >
      <Box sx={{
        width: 56, height: 56, borderRadius: '16px',
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}44`,
      }}>
        {React.cloneElement(icon, { sx: { fontSize: 28, color } })}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>
          {loading ? <CircularProgress size={22} sx={{ color }} /> : value ?? '—'}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, fontWeight: 500 }}>
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{sub}</Typography>
        )}
      </Box>
    </Paper>
  );
};

const NurseDashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { stats, queue, loading, queueLoading } = useSelector((s) => s.nurse);

  useEffect(() => {
    dispatch(fetchNurseStats());
    dispatch(fetchPatientQueue());
  }, [dispatch]);

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
          Nurse Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
          {todayStr} · Welcome back, Nurse 👋
        </Typography>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <MonitorHeartIcon />, label: "Vitals Recorded Today", value: stats?.vitalsToday, color: '#00C6B3' },
          { icon: <PeopleIcon />, label: "Total Patients Seen", value: stats?.totalPatients, color: '#4B9EFF' },
          { icon: <EventNoteIcon />, label: "Patients in Queue", value: stats?.queueCount, color: '#FF9F43' },
          { icon: <ScienceIcon />, label: "Lab Requests Today", value: stats?.labRequests, color: '#A78BFA' },
        ].map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <StatCard {...card} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* ── Main Content ── */}
      <Grid container spacing={3}>
        {/* Today's Queue */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
              overflow: 'hidden',
            }}
          >
            <Box sx={{
              px: 3, py: 2.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  Today's Appointment Queue
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {queue.length} appointments scheduled
                </Typography>
              </Box>
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  bgcolor: 'rgba(0,198,179,0.12)', color: '#00C6B3',
                  fontWeight: 700, fontSize: '0.65rem',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                  },
                }}
              />
            </Box>
            {queueLoading && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: '#00C6B3' } }} />}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['#', 'Patient', 'Doctor', 'Time', 'Status'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.75rem', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queue.length === 0 && !queueLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: theme.palette.text.secondary }}>
                        No appointments scheduled for today
                      </TableCell>
                    </TableRow>
                  ) : (
                    queue.slice(0, 8).map((appt, i) => {
                      const sc = statusColor[appt.status] || statusColor.scheduled;
                      const patientName = appt.patientId?.name || appt.patientId?.user?.name || 'Unknown';
                      const doctorName = appt.doctorId?.name || 'Unknown';
                      return (
                        <TableRow key={appt._id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                          <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>{appt.queueNumber || i + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#4B9EFF22', color: '#4B9EFF', fontSize: '0.7rem', fontWeight: 700 }}>
                                {patientName[0]?.toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.82rem' }}>
                                {patientName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem' }}>Dr. {doctorName}</TableCell>
                          <TableCell sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem' }}>{appt.timeSlot || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={appt.status}
                              size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.65rem', textTransform: 'capitalize' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Vitals */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Recent Vitals Recorded
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Last 5 records by you
              </Typography>
            </Box>
            <Box sx={{ p: 1 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#00C6B3' }} />
                </Box>
              ) : (stats?.recentVitals || []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <MonitorHeartIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, opacity: 0.4 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                    No vitals recorded yet today
                  </Typography>
                </Box>
              ) : (
                (stats?.recentVitals || []).map((v) => {
                  const name = v.patient?.user?.name || v.patient?.name || 'Patient';
                  return (
                    <Box
                      key={v._id}
                      sx={{
                        p: 2, mx: 1, my: 0.5, borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                        '&:hover': { bgcolor: isDark ? 'rgba(0,198,179,0.05)' : 'rgba(0,198,179,0.03)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(0,198,179,0.15)', color: '#00C6B3', fontSize: '0.75rem' }}>
                            {name[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.82rem' }}>
                            {name}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.68rem' }}>
                          {v.recordedAt ? format(new Date(v.recordedAt), 'hh:mm a') : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {v.bloodPressure?.systolic && (
                          <Chip icon={<FavoriteIcon sx={{ fontSize: '12px !important' }} />} label={`${v.bloodPressure.systolic}/${v.bloodPressure.diastolic} mmHg`} size="small"
                            sx={{ bgcolor: 'rgba(255,107,107,0.12)', color: '#FF6B6B', fontWeight: 600, fontSize: '0.68rem' }} />
                        )}
                        {v.pulse && (
                          <Chip icon={<MonitorHeartIcon sx={{ fontSize: '12px !important' }} />} label={`${v.pulse} bpm`} size="small"
                            sx={{ bgcolor: 'rgba(0,198,179,0.12)', color: '#00C6B3', fontWeight: 600, fontSize: '0.68rem' }} />
                        )}
                        {v.temperature?.value && (
                          <Chip icon={<ThermostatIcon sx={{ fontSize: '12px !important' }} />} label={`${v.temperature.value}°C`} size="small"
                            sx={{ bgcolor: 'rgba(255,159,67,0.12)', color: '#FF9F43', fontWeight: 600, fontSize: '0.68rem' }} />
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NurseDashboard;
