import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, Box, Button, Stack, Skeleton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPatientStats } from '../../api/patientApi';

gsap.registerPlugin(ScrollTrigger);

const PatientDashboard = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const [stats, setStats] = useState([
    { label: 'Upcoming Appointments', value: '-', icon: <EventIcon />, color: '#2563eb' },
    { label: 'Medical Records', value: '-', icon: <HistoryIcon />, color: '#7c3aed' },
    { label: 'Prescriptions', value: '-', icon: <LocalHospitalIcon />, color: '#10b981' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getPatientStats();
        if (response.success) {
          setStats([
            { label: 'Upcoming Appointments', value: response.data.upcomingAppointments, icon: <EventIcon />, color: '#2563eb' },
            { label: 'Medical Records', value: response.data.medicalRecords, icon: <HistoryIcon />, color: '#7c3aed' },
            { label: 'Prescriptions', value: response.data.prescriptions, icon: <LocalHospitalIcon />, color: '#10b981' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching patient stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useLayoutEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        // Header Animation
        gsap.from('.dashboard-header', {
          y: -20,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out'
        });

        // Stats Cards Animation
        gsap.from('.stat-card', {
          scale: 0.9,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'back.out(1.7)',
          delay: 0.2
        });

        // Sections Animation
        gsap.from('.dashboard-section', {
          scrollTrigger: {
            trigger: '.dashboard-section',
            start: 'top 85%',
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power2.out'
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, [loading]);

  return (
    <Box ref={containerRef}>
      <Box sx={{ mb: 4 }} className="dashboard-header">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t('welcome')}, {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is a summary of your health activities and upcoming schedules.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index} className="stat-card">
            <Card sx={{ 
              height: '100%', 
              position: 'relative', 
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': { transform: 'translateY(-8px)' }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {loading ? <Skeleton width="40%" /> : stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {stat.label}
                </Typography>
              </CardContent>
              <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05, fontSize: 100 }}>
                {stat.icon}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8} className="dashboard-section">
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Quick Actions</Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="large" 
                  startIcon={<EventIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/patient/appointments')}
                  sx={{ justifyContent: 'space-between', py: 2, borderRadius: 3 }}
                >
                  Book New Appointment
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="large" 
                  color="secondary"
                  startIcon={<HistoryIcon />}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/patient/medical-history')}
                  sx={{ justifyContent: 'space-between', py: 2, borderRadius: 3 }}
                >
                  View Medical History
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4} className="dashboard-section">
          <Card sx={{ p: 3, height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Health Tip of the Day</Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Drinking enough water throughout the day is vital for maintaining energy levels and supporting your body's natural functions.
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/about')}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              Learn More
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDashboard;
