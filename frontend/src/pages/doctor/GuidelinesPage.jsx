import React, { useLayoutEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip,
  Divider, Grid, Button, Avatar, Paper,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

const guidelines = [
  {
    id: 1,
    title: 'Hypertension Management Protocol 2025',
    category: 'Cardiology',
    updated: 'January 2025',
    icon: <MonitorHeartIcon />,
    color: '#2563eb',
    tag: 'New Protocol',
    tagColor: 'primary',
    summary:
      'Updated guidelines for the diagnosis and treatment of arterial hypertension. New thresholds for Stage 1 and Stage 2 classification, with revised first-line therapy recommendations including ACE inhibitors, ARBs, and calcium channel blockers.',
    keyPoints: [
      'Blood pressure target: <130/80 mmHg for most adults',
      'RAAS blockade preferred for diabetic patients',
      'Lifestyle modification remains cornerstone of treatment',
      'Ambulatory blood pressure monitoring recommended for diagnosis',
    ],
    source: 'World Hypertension League & ESC 2025',
  },
  {
    id: 2,
    title: 'Diabetes Type 2 — Glycemic Control Update',
    category: 'Endocrinology',
    updated: 'March 2025',
    icon: <FavoriteIcon />,
    color: '#7c3aed',
    tag: 'Updated',
    tagColor: 'secondary',
    summary:
      'Revised targets for HbA1c and individualized glycemic control strategies. SGLT2 inhibitors and GLP-1 receptor agonists now listed as preferred agents for patients with cardiovascular or renal disease.',
    keyPoints: [
      'HbA1c target: <7% for most non-pregnant adults',
      'SGLT2 inhibitors recommended with established CV disease',
      'GLP-1 agonists preferred when weight loss is a priority',
      'Annual screening for microvascular complications',
    ],
    source: 'American Diabetes Association Standards of Care 2025',
  },
  {
    id: 3,
    title: 'Antimicrobial Stewardship — Updated Prescribing Guidelines',
    category: 'Infectious Disease',
    updated: 'February 2025',
    icon: <MedicationIcon />,
    color: '#059669',
    tag: 'Critical',
    tagColor: 'success',
    summary:
      'New antimicrobial stewardship protocols to combat rising antibiotic resistance. Updated empiric therapy recommendations for common infections with emphasis on culture-guided treatment.',
    keyPoints: [
      'Narrow-spectrum agents preferred wherever possible',
      'Duration of therapy reduced for uncomplicated infections',
      'Mandatory culture before initiating broad-spectrum coverage',
      'De-escalation required within 48–72 hours of culture results',
    ],
    source: 'WHO Global AMR Action Plan & IDSA 2025',
  },
  {
    id: 4,
    title: 'Cancer Screening Recommendations 2025',
    category: 'Oncology',
    updated: 'April 2025',
    icon: <ScienceIcon />,
    color: '#dc2626',
    tag: 'Revised',
    tagColor: 'error',
    summary:
      'Updated population-based screening recommendations for colorectal, breast, cervical, and lung cancer. New age thresholds and screening interval adjustments based on 2024 meta-analyses.',
    keyPoints: [
      'Colorectal cancer screening starts at age 45 (down from 50)',
      'Breast cancer mammography: annual from age 40',
      'Cervical cancer: co-testing every 5 years from age 25',
      'Lung cancer LDCT: ages 50–80 with ≥20 pack-year history',
    ],
    source: 'US Preventive Services Task Force (USPSTF) 2025',
  },
  {
    id: 5,
    title: 'Sepsis Management Bundle — Updated SSCG 2025',
    category: 'Critical Care',
    updated: 'May 2025',
    icon: <LocalHospitalIcon />,
    color: '#f59e0b',
    tag: 'High Priority',
    tagColor: 'warning',
    summary:
      'Updated Surviving Sepsis Campaign guidelines with revised 1-hour and 3-hour bundles. Early goal-directed therapy has been refined based on PROCESS, ARISE, and ProMISe trials.',
    keyPoints: [
      'Blood cultures before antibiotics (do not delay >45 min)',
      'IV antibiotics within 1 hour of sepsis recognition',
      '30 mL/kg crystalloid for hypotension or lactate ≥4 mmol/L',
      'Vasopressors if MAP remains <65 mmHg after resuscitation',
    ],
    source: 'Society of Critical Care Medicine — SSCG 2025',
  },
];

const GuidelinesPage = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.guideline-header', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from('.guideline-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'back.out(1.4)',
        delay: 0.2,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <Box ref={containerRef}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }} className="guideline-header">
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <MenuBookIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Clinical Guidelines
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Latest medical protocols and evidence-based guidelines — Updated 2025
          </Typography>
        </Box>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate('/doctor')}
          sx={{ borderRadius: 2 }}
        >
          Back to Dashboard
        </Button>
      </Stack>

      {/* Alert Banner */}
      <Paper
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #2563eb15, #7c3aed15)',
          border: '1px solid',
          borderColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <LocalHospitalIcon color="primary" />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            5 guidelines updated in 2025
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review the latest protocols to ensure compliance with current evidence-based practice standards.
          </Typography>
        </Box>
      </Paper>

      {/* Guidelines Grid */}
      <Grid container spacing={3}>
        {guidelines.map((g) => (
          <Grid item xs={12} key={g.id} className="guideline-card">
            <Card sx={{ transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 } }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm="auto">
                    <Avatar sx={{ bgcolor: `${g.color}15`, color: g.color, width: 56, height: 56 }}>
                      {g.icon}
                    </Avatar>
                  </Grid>
                  <Grid item xs={12} sm>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {g.title}
                      </Typography>
                      <Chip label={g.tag} size="small" color={g.tagColor} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                      <Chip label={g.category} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        Updated: {g.updated}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                      {g.summary}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }} color="text.secondary">
                      KEY POINTS
                    </Typography>
                    <Stack spacing={0.5}>
                      {g.keyPoints.map((point, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: g.color,
                              mt: 0.8,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {point}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Source: {g.source}
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Full Guideline
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GuidelinesPage;
