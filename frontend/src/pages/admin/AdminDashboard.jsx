import React, { useLayoutEffect, useRef, useEffect } from 'react';
import {
  Typography, Grid, Card, Box, CircularProgress, Alert,
  Avatar, Button, LinearProgress, IconButton, Chip, Skeleton,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import AccessibleIcon from '@mui/icons-material/Accessible';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HotelIcon from '@mui/icons-material/Hotel';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ScienceIcon from '@mui/icons-material/Science';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  fetchAdminStats,
  fetchAdminDoctors,
  fetchActivityChart,
  fetchRecentAppointments,
} from '../../features/admin/adminSlice';
import gsap from 'gsap';

/* ── Static success stats (department-level, not yet a DB metric) ── */
const successStats = [
  { dept: 'Anesthetics',   value: 56 },
  { dept: 'Gynecology',    value: 98 },
  { dept: 'Neurology',     value: 100 },
  { dept: 'Oncology',      value: 86 },
  { dept: 'Orthopedics',   value: 97 },
  { dept: 'Physiotherapy', value: 100 },
];

/* ── Custom Recharts Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: '#1A2236',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      px: 2,
      py: 1.5,
    }}>
      <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 600, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Box key={p.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption" sx={{ color: '#E8ECF4', fontWeight: 600 }}>
            {p.name}: {p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon: Icon, iconBg, sub }) => (
  <Card
    className="stat-card"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 0,
      overflow: 'hidden',
      minHeight: 110,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      },
    }}
  >
    <Box sx={{ pl: 3 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#8A94A6', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4', mt: 0.5 }}>
        {value?.toLocaleString?.() ?? value}
      </Typography>
      {sub && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <TrendingUpIcon sx={{ fontSize: 13, color: '#34D399' }} />
          <Typography variant="caption" sx={{ color: '#34D399', fontSize: '0.65rem', fontWeight: 600 }}>
            {sub}
          </Typography>
        </Box>
      )}
    </Box>
    <Box
      sx={{
        width: 90,
        height: 90,
        borderRadius: '50% 0 0 50%',
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ml: 2,
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: 32, color: '#fff' }} />
    </Box>
  </Card>
);

/* ── Skeleton Card placeholder ── */
const SkeletonCard = () => (
  <Card sx={{ minHeight: 110, p: 2.5 }}>
    <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
    <Skeleton variant="text" width="35%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.08)', mt: 0.5 }} />
  </Card>
);

/* ── Main Component ── */
const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    stats,
    doctors,
    chartData,
    recentAppointments,
    loading,
    doctorsLoading,
    chartLoading,
    appointmentsLoading,
    error,
  } = useSelector((state) => state.admin);

  const containerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminDoctors());
    dispatch(fetchActivityChart());
    dispatch(fetchRecentAppointments(5));
  }, [dispatch]);

  useLayoutEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        gsap.from('.stat-card', {
          y: 24,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading]);

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  const statCards = [
    {
      label: 'TOTAL PATIENTS',
      value: stats?.totalPatients ?? '—',
      icon: AccessibleIcon,
      iconBg: 'linear-gradient(135deg,#00C6B3,#00A89A)',
      sub: 'Active records',
    },
    {
      label: 'TOTAL STAFF',
      value: stats?.totalStaff ?? '—',
      icon: MedicalServicesIcon,
      iconBg: 'linear-gradient(135deg,#FF9F43,#E8891F)',
      sub: 'Nurses, reception & more',
    },
    {
      label: "TODAY'S APPOINTMENTS",
      value: stats?.todayAppointments ?? '—',
      icon: EventNoteIcon,
      iconBg: 'linear-gradient(135deg,#4B9EFF,#2176D2)',
      sub: 'Scheduled today',
    },
    {
      label: 'TOTAL DOCTORS',
      value: stats?.totalDoctors ?? '—',
      icon: LocalHospitalIcon,
      iconBg: 'linear-gradient(135deg,#A78BFA,#7C3AED)',
      sub: 'Active physicians',
    },
    {
      label: 'PENDING LAB TESTS',
      value: stats?.pendingLabTests ?? '—',
      icon: ScienceIcon,
      iconBg: 'linear-gradient(135deg,#FF6B6B,#CC4444)',
      sub: 'Awaiting results',
    },
    {
      label: 'TOTAL ROOMS',
      value: '—',
      icon: HotelIcon,
      iconBg: 'linear-gradient(135deg,#34D399,#059669)',
      sub: 'Capacity overview',
    },
  ];

  return (
    <Box ref={containerRef} sx={{ pb: 2 }}>

      {/* ── Welcome Banner ── */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #00C6B3 0%, #0891B2 50%, #1E40AF 100%)',
          p: 3,
          mb: 3,
          overflow: 'hidden',
          minHeight: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ position: 'absolute', top: -30, right: 200, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
        <Box sx={{ position: 'absolute', bottom: -20, right: 160, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 0.5 }}>
            Hello, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 360, lineHeight: 1.6 }}>
            Here are your important tasks, updates and alerts.
            You can set your in-app preferences here.
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, mr: 2 }}>
          {[
            { label: 'New Tasks',     value: stats?.todayAppointments ?? '—', color: '#fff' },
            { label: 'New Patients',  value: stats?.totalPatients ?? '—',     color: '#FF9F43' },
            { label: 'Pending Labs',  value: stats?.pendingLabTests ?? '—',   color: '#FF6B6B' },
          ].map(({ label, value, color }) => (
            <Box key={label} sx={{ textAlign: 'center' }}>
              {loading ? (
                <Skeleton variant="text" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 'auto' }} />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 900, color, lineHeight: 1 }}>
                  {value}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((stat, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.label}>
            {loading ? <SkeletonCard /> : <StatCard {...stat} />}
          </Grid>
        ))}
      </Grid>

      {/* ── Activity Chart + Success Stats ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* Activity Chart */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                Activity
              </Typography>
              <Chip
                label="Last 7 Months"
                size="small"
                sx={{
                  bgcolor: 'rgba(0,198,179,0.1)',
                  color: '#00C6B3',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: '1px solid rgba(0,198,179,0.2)',
                }}
              />
            </Box>

            {chartLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                <CircularProgress sx={{ color: '#00C6B3' }} size={36} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={chartData.length > 0 ? chartData : [{ month: '—', consultations: 0, patients: 0 }]}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00C6B3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C6B3" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4B9EFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4B9EFF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#8A94A6', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8A94A6', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px' }}
                    formatter={(v) => (
                      <span style={{ color: '#8A94A6', fontSize: '0.78rem', fontWeight: 600 }}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </span>
                    )}
                  />
                  <Area type="monotone" dataKey="consultations" stroke="#00C6B3" strokeWidth={2.5}
                    fill="url(#gradTeal)" dot={false}
                    activeDot={{ r: 5, fill: '#00C6B3', stroke: '#1A2236', strokeWidth: 2 }}
                  />
                  <Area type="monotone" dataKey="patients" stroke="#4B9EFF" strokeWidth={2.5}
                    fill="url(#gradBlue)" dot={false}
                    activeDot={{ r: 5, fill: '#4B9EFF', stroke: '#1A2236', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Success Stats (department-level — static for now) */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                Success Stats
              </Typography>
              <Chip
                label={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                size="small"
                sx={{ bgcolor: '#FF9F43', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {successStats.map(({ dept, value }) => (
                <Box key={dept}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                    <Typography variant="body2" sx={{ color: '#E8ECF4', fontWeight: 500, fontSize: '0.82rem' }}>
                      {dept}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#00C6B3', fontWeight: 700 }}>
                      {value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      '& .MuiLinearProgress-bar': {
                        background: value > 90
                          ? 'linear-gradient(90deg, #00C6B3, #4B9EFF)'
                          : 'linear-gradient(90deg, #00C6B3, #00A89A)',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Doctor List + Online Appointments ── */}
      <Grid container spacing={2.5}>

        {/* Doctor List — live from DB */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                Doctor List
              </Typography>
              <IconButton
                size="small"
                sx={{
                  bgcolor: 'rgba(0,198,179,0.1)',
                  color: '#00C6B3',
                  '&:hover': { bgcolor: 'rgba(0,198,179,0.2)' },
                  borderRadius: '8px',
                }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Box>

            {doctorsLoading ? (
              [1, 2, 3, 4].map((k) => (
                <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={38} height={38} sx={{ bgcolor: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={14} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    <Skeleton variant="text" width="45%" height={12} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
                  </Box>
                </Box>
              ))
            ) : doctors.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#8A94A6', textAlign: 'center', py: 4 }}>
                No doctors found
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {doctors.slice(0, 5).map((doc, i) => (
                  <Box
                    key={doc._id || i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.2,
                      borderRadius: '10px',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: ['#00C6B3','#4B9EFF','#FF9F43','#A78BFA','#FF6B6B'][i % 5],
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {doc.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#00C6B3', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8A94A6', fontSize: '0.72rem' }}>
                        {doc.specialization || doc.department || 'General'}
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: '#4A5568', '&:hover': { color: '#8A94A6' } }}>
                      <MoreHorizIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>

        {/* Recent Appointments — live from DB */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                Online Appointments
              </Typography>
              <Button
                size="small"
                sx={{
                  color: '#00C6B3',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(0,198,179,0.08)' },
                }}
              >
                View All
              </Button>
            </Box>

            {appointmentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#00C6B3' }} size={32} />
              </Box>
            ) : recentAppointments.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#8A94A6', textAlign: 'center', py: 4 }}>
                No appointments found
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr">
                      {['No.', 'Name', 'Date & Time', 'Age', 'Gender', 'Doctor', 'Status', 'Action'].map((h) => (
                        <Box
                          key={h}
                          component="th"
                          sx={{
                            py: 1.2,
                            px: 1.5,
                            textAlign: 'left',
                            color: '#8A94A6',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {recentAppointments.map((row, i) => (
                      <Box
                        component="tr"
                        key={row.appointmentId || i}
                        sx={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        {[
                          <Typography variant="body2" sx={{ color: '#8A94A6', fontWeight: 600, fontSize: '0.8rem' }}>{row.no}</Typography>,
                          <Typography variant="body2" sx={{ color: '#E8ECF4', fontWeight: 600, fontSize: '0.82rem' }}>{row.name}</Typography>,
                          <Typography variant="body2" sx={{ color: '#8A94A6', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{row.date}</Typography>,
                          <Typography variant="body2" sx={{ color: '#E8ECF4', fontSize: '0.8rem' }}>{row.age}</Typography>,
                          <Chip
                            label={row.gender}
                            size="small"
                            sx={{
                              bgcolor: row.gender === 'Female' ? 'rgba(167,139,250,0.15)' : 'rgba(75,158,255,0.15)',
                              color: row.gender === 'Female' ? '#A78BFA' : '#4B9EFF',
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              height: 20,
                              border: `1px solid ${row.gender === 'Female' ? 'rgba(167,139,250,0.3)' : 'rgba(75,158,255,0.3)'}`,
                            }}
                          />,
                          <Typography variant="body2" sx={{ color: '#E8ECF4', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{row.doctor}</Typography>,
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              bgcolor:
                                row.status === 'completed' ? 'rgba(52,211,153,0.15)'
                                : row.status === 'cancelled' ? 'rgba(255,107,107,0.15)'
                                : 'rgba(255,159,67,0.15)',
                              color:
                                row.status === 'completed' ? '#34D399'
                                : row.status === 'cancelled' ? '#FF6B6B'
                                : '#FF9F43',
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              height: 20,
                              textTransform: 'capitalize',
                            }}
                          />,
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" sx={{ color: '#4B9EFF', '&:hover': { bgcolor: 'rgba(75,158,255,0.1)' }, borderRadius: '6px', p: 0.5 }}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#FF6B6B', '&:hover': { bgcolor: 'rgba(255,107,107,0.1)' }, borderRadius: '6px', p: 0.5 }}>
                              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>,
                        ].map((cell, ci) => (
                          <Box key={ci} component="td" sx={{ py: 1.4, px: 1.5, verticalAlign: 'middle' }}>
                            {cell}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
