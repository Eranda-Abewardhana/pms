import React, { useEffect } from 'react';
import {
  Typography, Grid, Card, Box, Skeleton, Button, Chip, Divider,
  List, ListItem, ListItemText, ListItemIcon, Avatar,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ScienceIcon from '@mui/icons-material/Science';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BiotechIcon from '@mui/icons-material/Biotech';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HistoryIcon from '@mui/icons-material/History';
import { fetchLabStats, fetchLabRequests } from '../../features/labtech/labtechSlice';

const PRIMARY = '#00C6B3';
const SECONDARY = '#4B9EFF';
const WARNING = '#FF9F43';
const SUCCESS = '#34D399';

const StatCard = ({ label, value, icon: Icon, color, onClick }) => (
  <Card 
    onClick={onClick}
    sx={{
      p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: `0 12px 24px ${color}22` } : {},
    }}
  >
    <Box sx={{
      width: 54, height: 54, borderRadius: '14px', bgcolor: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
    }}>
      <Icon fontSize="large" />
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  </Card>
);

const LabTechDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, requests, loading } = useSelector((s) => s.labtech);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchLabStats());
    dispatch(fetchLabRequests({ limit: 5, status: 'pending,in-progress' }));
  }, [dispatch]);

  const quickActions = [
    { label: 'Pending Requests', icon: PendingActionsIcon, path: '/labtech/requests', color: WARNING },
    { label: 'Completed Tests', icon: HistoryIcon, path: '/labtech/completed', color: SUCCESS },
    { label: 'Lab Reports', icon: AssessmentIcon, path: '/labtech/requests', color: SECONDARY },
  ];

  const recentTests = requests?.tests || [];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Laboratory Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome back, <strong>{user?.name}</strong>. Manage lab requests and results efficiently.
          </Typography>
        </Box>
        <Chip 
          icon={<AutorenewIcon sx={{ fontSize: '16px !important' }} />} 
          label="Live Updates" 
          size="small" 
          variant="outlined" 
          sx={{ color: PRIMARY, borderColor: `${PRIMARY}44`, fontWeight: 600 }} 
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Pending" value={stats?.pending || 0} icon={PendingActionsIcon} color={WARNING} onClick={() => navigate('/labtech/requests')} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="In-Progress" value={stats?.inProgress || 0} icon={BiotechIcon} color={SECONDARY} onClick={() => navigate('/labtech/requests')} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Completed Today" value={stats?.completedToday || 0} icon={CheckCircleIcon} color={SUCCESS} onClick={() => navigate('/labtech/completed')} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading && !stats ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2 }} /> : (
            <StatCard label="Total Requests" value={stats?.totalToday || 0} icon={ScienceIcon} color={PRIMARY} />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Pending Requests */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Recent Pending Requests</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />} 
                onClick={() => navigate('/labtech/requests')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />)}
              </Box>
            ) : recentTests.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 4 }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No pending requests at the moment.</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {recentTests.map((test, index) => (
                  <React.Fragment key={test._id}>
                    <ListItem 
                      sx={{ 
                        px: 0, py: 1.5, 
                        '&:hover': { '& .MuiButton-root': { opacity: 1 } }
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${SECONDARY}15`, color: SECONDARY }}>
                          {test.patient?.userId?.name?.[0] || 'P'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography fontWeight={700}>{test.testType === 'Other' ? test.customTestName : test.testType}</Typography>}
                        secondary={`${test.patient?.userId?.name} • ${test.testId}`}
                      />
                      <Box sx={{ textAlign: 'right', mr: 2 }}>
                        <Chip 
                          label={test.priority} 
                          size="small" 
                          color={test.priority === 'urgent' ? 'error' : test.priority === 'stat' ? 'warning' : 'default'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }}
                        />
                      </Box>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate('/labtech/requests')}
                        sx={{ bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none' }}
                      >
                        Process
                      </Button>
                    </ListItem>
                    {index < recentTests.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        {/* Quick Actions & Tips */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2.5}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {quickActions.map(({ label, icon: Icon, path, color }) => (
                <Button 
                  key={label} 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<Icon sx={{ color }} />}
                  onClick={() => navigate(path)}
                  sx={{ 
                    justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: '12px', 
                    borderColor: `${color}44`, textTransform: 'none', fontWeight: 600, color: 'text.primary',
                    '&:hover': { borderColor: color, bgcolor: `${color}0A` } 
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Card>

          <Card sx={{ p: 3, bgcolor: `${PRIMARY}0D`, border: `1px dashed ${PRIMARY}66` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BiotechIcon sx={{ fontSize: 20, color: PRIMARY }} />
              <Typography variant="subtitle2" sx={{ color: PRIMARY, fontWeight: 700 }}>Laboratory Tip</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
              Always ensure the patient's ID on the sample container matches the digital request before processing. Maintain sterilization protocols at all times.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LabTechDashboard;
