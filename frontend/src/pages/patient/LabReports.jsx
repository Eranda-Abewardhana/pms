import React, { useEffect } from 'react';
import {
  Box, Typography, Card, Chip, CircularProgress, Alert, Grid,
  Accordion, AccordionSummary, AccordionDetails, Divider, Button, Tooltip,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DownloadIcon from '@mui/icons-material/Download';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyLabResults } from '../../features/patient/patientSlice';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';

const statusConfig = {
  completed:    { label: 'Completed',   color: '#34D399', bg: 'rgba(52,211,153,0.12)',  icon: CheckCircleOutlineIcon },
  pending:      { label: 'Pending',     color: '#FF9F43', bg: 'rgba(255,159,67,0.12)',  icon: HourglassEmptyIcon },
  'in-progress':{ label: 'In Progress', color: '#4B9EFF', bg: 'rgba(75,158,255,0.12)', icon: HourglassEmptyIcon },
  cancelled:    { label: 'Cancelled',   color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)',icon: CheckCircleOutlineIcon },
};

const priorityColor = { routine: '#8A94A6', urgent: '#FF9F43', stat: '#FF6B6B' };

const LabReports = () => {
  const dispatch = useDispatch();
  const { labResults, labLoading, labError } = useSelector((s) => s.patient);

  useEffect(() => { dispatch(fetchMyLabResults()); }, [dispatch]);

  const handleDownload = async (testId, filename) => {
    try {
      const res = await axiosInstance.get(`/lab/${testId}/report-file`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'lab-report.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Report file not available yet'); }
  };

  const completed = labResults.filter((t) => t.status === 'completed');
  const pending   = labResults.filter((t) => t.status !== 'completed');

  if (labLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: '#00C6B3' }} />
    </Box>
  );

  if (labError) return <Alert severity="error" sx={{ m: 2 }}>{labError}</Alert>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#E8ECF4' }}>My Lab Reports</Typography>
        <Typography variant="body2" sx={{ color: '#8A94A6', mt: 0.5 }}>View all your lab test requests and results</Typography>
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: `${labResults.length} Total`, color: '#8A94A6', bg: 'rgba(138,148,166,0.12)' },
          { label: `${completed.length} Completed`, color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
          { label: `${pending.length} Pending/Active`, color: '#FF9F43', bg: 'rgba(255,159,67,0.12)' },
        ].map(({ label, color, bg }) => (
          <Chip key={label} label={label} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${color}30` }} />
        ))}
      </Box>

      {labResults.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <ScienceIcon sx={{ fontSize: 56, color: '#4A5568', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#8A94A6', fontWeight: 600 }}>No Lab Tests Yet</Typography>
          <Typography variant="body2" sx={{ color: '#4A5568', mt: 1 }}>Your lab test results will appear here once requested by your doctor.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {labResults.map((test) => {
            const cfg = statusConfig[test.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Accordion
                key={test._id}
                sx={{
                  bgcolor: '#1A2236',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#8A94A6' }} />} sx={{ px: 3, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ScienceIcon sx={{ color: cfg.color, fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#E8ECF4' }}>
                        {test.testType === 'Other' ? test.customTestName : test.testType}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8A94A6' }}>
                        {test.testId} • Requested by {test.requestedBy?.name || 'Doctor'} • {new Date(test.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                      <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${cfg.color}40` }} />
                      <Chip label={test.priority?.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: priorityColor[test.priority] || '#8A94A6', fontWeight: 700, fontSize: '0.65rem' }} />
                      {test.isAbnormal && <Chip icon={<WarningAmberIcon sx={{ fontSize: '14px !important', color: '#FF6B6B !important' }} />} label="Abnormal" size="small" sx={{ bgcolor: 'rgba(255,107,107,0.12)', color: '#FF6B6B', fontWeight: 700, fontSize: '0.7rem' }} />}
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
                  <Grid container spacing={2}>
                    {test.clinicalNotes && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Doctor's Notes</Typography>
                        <Typography variant="body2" sx={{ color: '#E8ECF4', mt: 0.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {test.clinicalNotes}
                        </Typography>
                      </Grid>
                    )}
                    {test.status === 'completed' && test.results && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Test Results</Typography>
                        <Box sx={{ mt: 0.5, p: 2, bgcolor: test.isAbnormal ? 'rgba(255,107,107,0.06)' : 'rgba(52,211,153,0.06)', borderRadius: '8px', border: `1px solid ${test.isAbnormal ? 'rgba(255,107,107,0.2)' : 'rgba(52,211,153,0.2)'}` }}>
                          <Typography variant="body2" sx={{ color: '#E8ECF4', whiteSpace: 'pre-line', lineHeight: 1.8 }}>{test.results}</Typography>
                          {test.resultSummary && (
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <Typography variant="caption" sx={{ color: '#8A94A6', fontWeight: 700 }}>Summary: </Typography>
                              <Typography variant="caption" sx={{ color: '#E8ECF4' }}>{test.resultSummary}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}
                    {test.status !== 'completed' && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255,159,67,0.06)', borderRadius: '8px', border: '1px solid rgba(255,159,67,0.2)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <HourglassEmptyIcon sx={{ color: '#FF9F43', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: '#FF9F43', fontWeight: 600 }}>Results pending — the lab technician is processing your test.</Typography>
                        </Box>
                      </Grid>
                    )}
                    {test.completedAt && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#4A5568' }}>Completed: {new Date(test.completedAt).toLocaleString()}</Typography>
                      </Grid>
                    )}
                    {test.status === 'completed' && test.reportFile && (
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownload(test.id, test.reportFileName)}
                          sx={{ borderColor: '#00C6B3', color: '#00C6B3', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'rgba(0,198,179,0.08)' } }}>
                          Download Report PDF
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default LabReports;
