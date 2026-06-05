import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import {
  Typography, Grid, Card, CardContent, Box, Stack, Button,
  Skeleton, Chip, Divider, useTheme, CircularProgress
} from '@mui/material';
import { useSelector } from 'react-redux';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getTodayAppointments, getTodayPatientStats } from '../../api/receptionistApi';
import { format } from 'date-fns';

gsap.registerPlugin(ScrollTrigger);

const StatCard = ({ label, value, icon, color, loading, trend }) => (
  <Card
    sx={{
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': { transform: 'translateY(-5px)', boxShadow: `0 12px 40px ${color}30` },
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        bgcolor: `${color}10`,
      }}
    />
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: `${color}15`, color }}>
          {icon}
        </Box>
        {trend && (
          <Chip
            icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
            label={trend}
            size="small"
            sx={{ bgcolor: '#10b98115', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={80} height={56} />
      ) : (
        <Typography variant="h3" sx={{ fontWeight: 800, color }}>
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const ReceptionistDashboard = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [stats, setStats] = useState({ todayCheckins: 0, newRegistrations: 0, totalAppointments: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsRes, patientStatsRes] = await Promise.allSettled([
        getTodayAppointments(),
        getTodayPatientStats(),
      ]);

      const appointments = appointmentsRes.status === 'fulfilled'
        ? appointmentsRes.value?.data?.appointments || []
        : [];

      const patientStats = patientStatsRes.status === 'fulfilled'
        ? patientStatsRes.value?.data || {}
        : {};

      setStats({
        todayCheckins: appointments.filter(a => a.status === 'completed' || a.status === 'in-progress').length,
        newRegistrations: patientStats.todayRegistrations || 0,
        totalAppointments: appointments.length,
      });

      // Build recent activity from actual appointments
      const recent = appointments.slice(0, 5).map((appt) => ({
        id: appt._id,
        text: `Appointment booked — ${appt.patientId?.name || 'Unknown Patient'}`,
        sub: `${appt.timeSlot} • Dr. ${appt.doctorId?.name || 'Unknown'} • ${appt.appointmentId}`,
        type: appt.status,
        time: format(new Date(appt.date), 'hh:mm a'),
      }));
      setRecentActivity(recent);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useLayoutEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from('.dashboard-header', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out' });
      gsap.from('.stat-card', { y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'back.out(1.7)', delay: 0.2 });
      gsap.from('.dashboard-section', {
        scrollTrigger: { trigger: '.dashboard-section', start: 'top 90%' },
        y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out'
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  const handleExportPDF = () => {
    setPdfLoading(true);
    // Give a moment for UI to update before print dialog
    setTimeout(() => {
      window.print();
      setPdfLoading(false);
    }, 300);
  };

  const statCards = [
    {
      label: "Today's Check-ins",
      value: stats.todayCheckins,
      icon: <PeopleIcon fontSize="small" />,
      color: '#2563eb',
      trend: 'Live',
    },
    {
      label: 'New Registrations Today',
      value: stats.newRegistrations,
      icon: <PersonAddIcon fontSize="small" />,
      color: '#10b981',
    },
    {
      label: 'Total Appointments Today',
      value: stats.totalAppointments,
      icon: <EventIcon fontSize="small" />,
      color: '#7c3aed',
    },
  ];

  const operationalTasks = [
    { label: 'Register New Patient', icon: <AddCircleOutlineIcon />, color: 'primary', path: '/receptionist/register-patient' },
    { label: 'Schedule Appointment', icon: <EventIcon />, color: 'secondary', path: '/receptionist/appointments' },
    { label: 'Search Patients', icon: <SearchIcon />, color: 'info', path: '/receptionist/patients' },
  ];

  const getStatusColor = (status) => {
    const map = { completed: '#10b981', 'in-progress': '#3b82f6', booked: '#f59e0b', cancelled: '#ef4444' };
    return map[status] || '#6b7280';
  };

  return (
    <>
      {/* ── Print Stylesheet injected via JSX style tag ── */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, .MuiAppBar-root, .MuiDrawer-root {
            display: none !important;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-section { break-inside: avoid; }
          @page { margin: 20mm; }
        }
      `}</style>

      <Box ref={containerRef}>
        {/* ── Header ─────────────────────────────────────── */}
        <Box
          className="dashboard-header"
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Reception Desk
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, <strong>{user?.name}</strong>. You have a busy day ahead!
            </Typography>
            {lastRefreshed && (
              <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                Last updated: {format(lastRefreshed, 'hh:mm:ss a')}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} className="no-print">
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
              onClick={fetchDashboardData}
              disabled={loading}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={pdfLoading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={pdfLoading}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' },
              }}
            >
              Export PDF
            </Button>
          </Stack>
        </Box>

        {/* ── Stats Cards ─────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={4} key={index} className="stat-card print-section">
              <StatCard {...stat} loading={loading} />
            </Grid>
          ))}
        </Grid>

        {/* ── Bottom Section ──────────────────────────────── */}
        <Grid container spacing={3}>
          {/* Operational Tasks */}
          <Grid item xs={12} md={8} className="dashboard-section print-section">
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                Operational Tasks
              </Typography>
              <Grid container spacing={2}>
                {operationalTasks.map((task, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color={task.color}
                      onClick={() => navigate(task.path)}
                      sx={{
                        flexDirection: 'column',
                        py: 3,
                        borderRadius: 3,
                        gap: 1.5,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2, transform: 'translateY(-2px)', transition: 'all 0.2s' },
                      }}
                    >
                      {task.icon}
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {task.label}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Quick Stats Bar */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }} color="text.secondary">
                TODAY'S QUICK OVERVIEW
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Booked', count: recentActivity.filter(a => a.type === 'booked').length, color: '#f59e0b' },
                  { label: 'In Progress', count: recentActivity.filter(a => a.type === 'in-progress').length, color: '#3b82f6' },
                  { label: 'Completed', count: recentActivity.filter(a => a.type === 'completed').length, color: '#10b981' },
                  { label: 'Cancelled', count: recentActivity.filter(a => a.type === 'cancelled').length, color: '#ef4444' },
                ].map((item) => (
                  <Grid item xs={6} sm={3} key={item.label}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${item.color}10`,
                        border: `1px solid ${item.color}20`,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, color: item.color }}>
                        {loading ? <Skeleton width={30} sx={{ mx: 'auto' }} /> : item.count}
                      </Typography>
                      <Typography variant="caption" sx={{ color: item.color, fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={4} className="dashboard-section print-section">
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Today's Appointments
                  </Typography>
                  <LocalHospitalIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Stack>
              </Box>
              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', maxHeight: 320 }}>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <Stack key={i} direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Skeleton variant="rectangular" width={4} height={50} sx={{ borderRadius: 1 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="80%" height={20} />
                        <Skeleton width="60%" height={16} />
                      </Box>
                    </Stack>
                  ))
                ) : recentActivity.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2" color="text.secondary">
                      No appointments today
                    </Typography>
                  </Box>
                ) : (
                  recentActivity.map((activity) => (
                    <Stack key={activity.id} direction="row" spacing={2} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 4,
                          minWidth: 4,
                          bgcolor: getStatusColor(activity.type),
                          borderRadius: 1,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {activity.text}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <AccessTimeIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {activity.sub}
                          </Typography>
                        </Stack>
                      </Box>
                      <Chip
                        label={activity.type}
                        size="small"
                        sx={{
                          bgcolor: `${getStatusColor(activity.type)}15`,
                          color: getStatusColor(activity.type),
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          height: 20,
                          flexShrink: 0,
                        }}
                      />
                    </Stack>
                  ))
                )}
              </Box>
              <Divider />
              <Button
                fullWidth
                onClick={() => navigate('/receptionist/appointments')}
                sx={{ py: 1.5, borderRadius: '0 0 16px 16px', fontWeight: 700, color: 'primary.main' }}
              >
                View All Appointments →
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ReceptionistDashboard;
