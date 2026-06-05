import React from 'react';
import { Box, Typography, Grid, Card, Avatar, Chip, Divider } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GroupsIcon from '@mui/icons-material/Groups';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ScienceIcon from '@mui/icons-material/Science';
import VerifiedIcon from '@mui/icons-material/Verified';

const stats = [
  { value: '12,000+', label: 'Patients Served',     color: '#00C6B3' },
  { value: '150+',    label: 'Medical Specialists',  color: '#4B9EFF' },
  { value: '98%',     label: 'Patient Satisfaction', color: '#FF9F43' },
  { value: '24/7',    label: 'Emergency Support',    color: '#A78BFA' },
];

const values = [
  { icon: FavoriteIcon,  title: 'Patient-Centered Care',   color: '#FF6B6B', desc: 'Every decision is guided by what is best for our patients — treated with dignity, empathy, and respect.' },
  { icon: VerifiedIcon,  title: 'Clinical Excellence',     color: '#00C6B3', desc: 'We uphold the highest standards of medical practice, investing in training, technology, and evidence-based protocols.' },
  { icon: GroupsIcon,    title: 'Collaborative Spirit',    color: '#4B9EFF', desc: 'Our interdisciplinary teams — doctors, nurses, lab techs, administrators — work hand-in-hand for seamless care.' },
  { icon: ScienceIcon,   title: 'Innovation & Research',   color: '#A78BFA', desc: 'We embrace technology and data-driven approaches to advance diagnostics, treatments, and operational efficiency.' },
];

const team = [
  { name: 'Dr. Amara Silva',       role: 'Chief Medical Officer',  initials: 'AS', color: '#00C6B3' },
  { name: 'Dr. Ravi Perera',       role: 'Head of Surgery',        initials: 'RP', color: '#4B9EFF' },
  { name: 'Dr. Nisha Fernando',    role: 'Head of Gynecology',     initials: 'NF', color: '#A78BFA' },
  { name: 'Dr. Kasun Jayawardena', role: 'Head of Neurology',      initials: 'KJ', color: '#FF9F43' },
  { name: 'Ms. Dilki Bandara',     role: 'Chief Nursing Officer',  initials: 'DB', color: '#FF6B6B' },
  { name: 'Mr. Saman Gunawardena', role: 'Head of Administration', initials: 'SG', color: '#34D399' },
];

const milestones = [
  { year: '2010', event: 'MetroCare founded with a 50-bed capacity facility in Colombo.' },
  { year: '2013', event: 'Expanded to 200 beds; added dedicated ICU and neonatal units.' },
  { year: '2016', event: 'Achieved JCI (Joint Commission International) accreditation.' },
  { year: '2019', event: 'Launched MetroCare Digital Health initiative & patient portal.' },
  { year: '2022', event: 'Opened the Advanced Cancer Care & Research Centre.' },
  { year: '2024', event: 'Deployed AI-assisted diagnostics across all departments.' },
];

const SectionHeader = ({ label, title, sub }) => (
  <Box sx={{ textAlign: 'center', mb: 4 }}>
    <Chip label={label} size="small" sx={{ bgcolor: 'rgba(0,198,179,0.1)', color: '#00C6B3', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', border: '1px solid rgba(0,198,179,0.25)', mb: 1.5 }} />
    <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4', mb: 1 }}>{title}</Typography>
    {sub && <Typography variant="body1" sx={{ color: '#8A94A6', maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>{sub}</Typography>}
  </Box>
);

const AboutPage = () => (
  <Box sx={{ pb: 4 }}>

    {/* Hero */}
    <Box sx={{ position: 'relative', borderRadius: '20px', background: 'linear-gradient(135deg,#0E2A30 0%,#0A1628 50%,#131929 100%)', border: '1px solid rgba(0,198,179,0.12)', p: { xs: 4, md: 6 }, mb: 4, overflow: 'hidden', textAlign: 'center' }}>
      <Box sx={{ position: 'absolute', top: -60, left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,198,179,0.1) 0%,transparent 70%)', filter: 'blur(40px)' }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: 72, height: 72, borderRadius: '18px', background: 'linear-gradient(135deg,#00C6B3,#4B9EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: '0 8px 32px rgba(0,198,179,0.4)' }}>
          <HealthAndSafetyIcon sx={{ fontSize: 38, color: '#fff' }} />
        </Box>
        <Chip label="ABOUT METROCARE" size="small" sx={{ bgcolor: 'rgba(0,198,179,0.1)', color: '#00C6B3', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', border: '1px solid rgba(0,198,179,0.25)', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, background: 'linear-gradient(135deg,#E8ECF4 30%,#00C6B3 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
          Healthcare Reimagined for<br />a Better Tomorrow
        </Typography>
        <Typography variant="body1" sx={{ color: '#8A94A6', maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
          MetroCare powers Metro MediCare Hospital — a leading multi-specialty healthcare institution
          committed to delivering compassionate, technology-driven care to every patient.
        </Typography>
      </Box>
    </Box>

    {/* Stats */}
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {stats.map(({ value, label, color }) => (
        <Grid item xs={6} md={3} key={label}>
          <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color, lineHeight: 1, mb: 0.5 }}>{value}</Typography>
            <Typography variant="body2" sx={{ color: '#8A94A6', fontWeight: 500 }}>{label}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Mission & Vision */}
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {[
        { icon: FavoriteIcon, color: '#00C6B3', borderColor: 'rgba(0,198,179,0.15)', bg: 'rgba(0,198,179,0.05)', title: 'Our Mission', text: 'To streamline patient care and improve health outcomes through an integrated, user-friendly system that empowers both patients and healthcare providers. We believe every individual deserves timely, transparent, and high-quality medical care.' },
        { icon: VisibilityIcon, color: '#4B9EFF', borderColor: 'rgba(75,158,255,0.15)', bg: 'rgba(75,158,255,0.05)', title: 'Our Vision', text: 'To be the most trusted healthcare management platform in South Asia, recognized for excellence in patient engagement, operational efficiency, and clinical outcomes. We aim to set a new standard for what digital healthcare can achieve.' },
      ].map(({ icon: Icon, color, borderColor, bg, title, text }) => (
        <Grid item xs={12} md={6} key={title}>
          <Card sx={{ p: 4, height: '100%', border: `1px solid ${borderColor}`, background: `linear-gradient(135deg,${bg} 0%,#1A2236 100%)` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon sx={{ color, fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>{title}</Typography>
            </Box>
            <Typography variant="body1" sx={{ color: '#8A94A6', lineHeight: 1.8 }}>{text}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Core Values */}
    <Box sx={{ mb: 4 }}>
      <SectionHeader label="WHAT WE STAND FOR" title="Our Core Values" sub="These principles define how we work, treat our patients, and grow as an organization." />
      <Grid container spacing={2.5}>
        {values.map(({ icon: Icon, title, desc, color }) => (
          <Grid item xs={12} sm={6} key={title}>
            <Card sx={{ p: 3, height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ color, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#E8ECF4', mb: 0.75 }}>{title}</Typography>
                  <Typography variant="body2" sx={{ color: '#8A94A6', lineHeight: 1.7 }}>{desc}</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* Leadership Team */}
    <Box sx={{ mb: 4 }}>
      <SectionHeader label="LEADERSHIP" title="Meet Our Team" sub="Our leadership brings decades of medical and administrative expertise to every aspect of patient care." />
      <Grid container spacing={2.5}>
        {team.map(({ name, role, initials, color }) => (
          <Grid item xs={12} sm={6} md={4} key={name}>
            <Card sx={{ p: 3, textAlign: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: `${color}25`, border: `2px solid ${color}60`, color, fontSize: '1.25rem', fontWeight: 800, mx: 'auto', mb: 1.5 }}>{initials}</Avatar>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#E8ECF4' }}>{name}</Typography>
              <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{role}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* Timeline */}
    <Box>
      <SectionHeader label="OUR JOURNEY" title="Key Milestones" sub="From a modest clinic to a multi-specialty hospital — defined by growth and dedication." />
      <Card sx={{ p: { xs: 3, md: 4 } }}>
        {milestones.map(({ year, event }, i) => (
          <Box key={year}>
            <Box sx={{ display: 'flex', gap: 2.5, py: 2, alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 60, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg,#00C6B3,#4B9EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>{year}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00C6B3' }} />
                {i < milestones.length - 1 && <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: 'rgba(0,198,179,0.15)', mt: 0.5 }} />}
              </Box>
              <Typography variant="body2" sx={{ color: '#8A94A6', lineHeight: 1.7, pt: 0.25 }}>{event}</Typography>
            </Box>
            {i < milestones.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
          </Box>
        ))}
      </Card>
    </Box>

  </Box>
);

export default AboutPage;
