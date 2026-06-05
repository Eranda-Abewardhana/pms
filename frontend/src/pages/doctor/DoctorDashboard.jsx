import React, { useEffect, useLayoutEffect, useRef } from 'react';
import {
  Typography, Grid, Card, CardContent, Box, Stack, Avatar,
  Button, IconButton, CircularProgress, Chip, Skeleton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchDoctorStats, fetchTodayAppointments, startSession } from '../../features/doctor/doctorSlice';

gsap.registerPlugin(ScrollTrigger);

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { stats, statsLoading, todayAppointments, todayLoading, sessionLoading } = useSelector(
    (state) => state.doctor
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchDoctorStats());
    dispatch(fetchTodayAppointments());
  }, [dispatch]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dashboard-header', {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
      gsap.from('.stat-card', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        delay: 0.2,
      });
      gsap.from('.dashboard-section', {
        scrollTrigger: {
          trigger: '.dashboard-section',
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power2.out',
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleStartSession = (appointmentId) => {
    dispatch(startSession(appointmentId));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      label: "Today's Appointments",
      value: statsLoading ? null : stats.todayAppointments,
      icon: <EventAvailableIcon />,
      color: '#2563eb',
    },
    {
      label: 'Total Patients',
      value: statsLoading ? null : stats.totalPatients,
      icon: <PeopleIcon />,
      color: '#7c3aed',
    },
    {
      label: 'Pending Reports',
      value: statsLoading ? null : stats.pendingReports,
      icon: <PendingActionsIcon />,
      color: '#f59e0b',
    },
  ];

  const getStatusColor = (status) => {
    const map = {
      booked: 'info',
      confirmed: 'primary',
      arrived: 'warning',
      'in-consultation': 'secondary',
      completed: 'success',
      cancelled: 'error',
    };
    return map[status] || 'default';
  };

  return (
    <Box ref={containerRef}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 4 }}
        className="dashboard-header"
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Dr. {user?.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {getGreeting()}! You have{' '}
            <strong>{statsLoading ? '...' : stats.todayAppointments}</strong> consultation
            {stats.todayAppointments !== 1 ? 's' : ''} scheduled for today.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<EventAvailableIcon />}
          onClick={() => navigate('/doctor/appointments')}
          sx={{ borderRadius: 2 }}
        >
          View Schedule
        </Button>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index} className="stat-card">
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
                {stat.value === null ? (
                  <Skeleton variant="text" width={80} height={60} />
                ) : (
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bottom Sections */}
      <Grid container spacing={3}>
        {/* Upcoming Consultations */}
        <Grid item xs={12} md={7} className="dashboard-section">
          <Card sx={{ height: '100%' }}>
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">Today's Consultations</Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/doctor/appointments')}
              >
                View All
              </Button>
            </Box>
            <Box sx={{ p: 0 }}>
              {todayLoading ? (
                <Box sx={{ p: 3 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={64} sx={{ mb: 1, borderRadius: 2 }} />
                  ))}
                </Box>
              ) : todayAppointments.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center', opacity: 0.5 }}>
                  <Typography color="text.secondary">No appointments scheduled for today.</Typography>
                </Box>
              ) : (
                todayAppointments.slice(0, 5).map((apt, i) => {
                  const patientName = apt.patientId?.name || 'Unknown Patient';
                  const initial = patientName.charAt(0).toUpperCase();
                  const isLast = i === Math.min(todayAppointments.length, 5) - 1;

                  return (
                    <Box
                      key={apt._id}
                      sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: !isLast ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.light', fontWeight: 700 }}>{initial}</Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {apt.reason || apt.type || 'Consultation'} • {apt.timeSlot}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={apt.status}
                          size="small"
                          color={getStatusColor(apt.status)}
                          sx={{ textTransform: 'capitalize', fontSize: '0.7rem', fontWeight: 700 }}
                        />
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              sessionLoading ? (
                                <CircularProgress size={12} color="inherit" />
                              ) : (
                                <PlayArrowIcon />
                              )
                            }
                            disabled={sessionLoading}
                            sx={{ boxShadow: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => handleStartSession(apt._id)}
                          >
                            Start Session
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Box>
          </Card>
        </Grid>

        {/* Research & Updates + Quick Links */}
        <Grid item xs={12} md={5} className="dashboard-section">
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Card
              sx={{
                p: 3,
                flex: 1,
                bgcolor: 'secondary.dark',
                color: 'white',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <MenuBookIcon />
                <Typography variant="h6">Research & Updates</Typography>
              </Stack>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.85, lineHeight: 1.8 }}>
                Stay updated with the latest medical advancements. New protocols for Hypertension
                management have been released for 2025.
              </Typography>
              <Button
                variant="contained"
                color="inherit"
                sx={{ color: 'secondary.dark', fontWeight: 700 }}
                onClick={() => navigate('/doctor/guidelines')}
              >
                Read Guidelines
              </Button>
            </Card>

            {/* Quick Stats Summary */}
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }} color="text.secondary">
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/doctor/patients')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  My Patients ({statsLoading ? '...' : stats.totalPatients})
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<PendingActionsIcon />}
                  onClick={() => navigate('/doctor/lab-requests')}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Pending Lab Reports ({statsLoading ? '...' : stats.pendingReports})
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DoctorDashboard;
