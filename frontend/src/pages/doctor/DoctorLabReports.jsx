import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, Avatar, Chip, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorLabReports } from '../../features/doctor/doctorSlice';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { format } from 'date-fns';
import gsap from 'gsap';

const DoctorLabReports = () => {
  const dispatch = useDispatch();
  const { labReports, labReportsLoading, labReportsError, labReportsTotal } = useSelector(
    (state) => state.doctor
  );
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const containerRef = useRef(null);

  const loadReports = (status = statusFilter) => {
    dispatch(fetchDoctorLabReports(status ? { status } : {}));
  };

  useEffect(() => {
    loadReports();
  }, [dispatch]);

  useLayoutEffect(() => {
    if (!labReportsLoading && labReports.length > 0) {
      const ctx = gsap.context(() => {
        gsap.from('.report-row', {
          x: -20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power2.out',
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [labReportsLoading, labReports]);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    loadReports(e.target.value);
  };

  const getStatusConfig = (status) => {
    const map = {
      pending: { color: 'warning', icon: <PendingIcon fontSize="small" />, label: 'Pending' },
      'in-progress': { color: 'info', icon: <ScienceIcon fontSize="small" />, label: 'In Progress' },
      completed: { color: 'success', icon: <CheckCircleIcon fontSize="small" />, label: 'Completed' },
      cancelled: { color: 'error', icon: null, label: 'Cancelled' },
    };
    return map[status] || { color: 'default', icon: null, label: status };
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Box ref={containerRef}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Lab Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lab reports from your appointed patients ({labReportsTotal} total)
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={() => loadReports()}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select value={statusFilter} label="Filter by Status" onChange={handleFilterChange}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          Showing {labReports.length} of {labReportsTotal} reports
        </Typography>
      </Paper>

      {labReportsError && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fff1f2', border: '1px solid #fecaca', borderRadius: 2 }}>
          <Typography color="error.main" variant="body2" sx={{ fontWeight: 600 }}>
            {labReportsError}
          </Typography>
        </Paper>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        {labReportsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Completed Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ opacity: 0.5 }}>
                        <ScienceIcon sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No lab reports found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lab reports from your patients will appear here.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  labReports.map((report) => {
                    const statusConfig = getStatusConfig(report.status);
                    return (
                      <TableRow key={report._id} hover className="report-row">
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ScienceIcon fontSize="small" color="primary" />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {report.testType || report.customTestName || 'Unknown Test'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {report.patient ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'primary.light' }}>
                                {report.patient.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {report.patient.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {report.patient.patientId}
                                </Typography>
                              </Box>
                            </Stack>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {report.testCategory || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(report.requestedDate || report.createdAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatDate(report.completedDate)}</Typography>
                        </TableCell>
                        <TableCell>
                          {report.priority ? (
                            <Chip
                              label={report.priority}
                              size="small"
                              color={report.priority === 'urgent' ? 'error' : report.priority === 'high' ? 'warning' : 'default'}
                              sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }}
                            />
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusConfig.label}
                            icon={statusConfig.icon}
                            size="small"
                            color={statusConfig.color}
                            sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Report Details">
                            <IconButton size="small" color="primary" onClick={() => setSelectedReport(report)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Report Detail Dialog */}
      <Dialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedReport && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ScienceIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedReport.testType || selectedReport.customTestName || 'Lab Report'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedReport.testCategory}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Patient</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReport.patient?.name || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Patient ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReport.patient?.patientId || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getStatusConfig(selectedReport.status).label}
                      size="small"
                      color={getStatusConfig(selectedReport.status).color}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Priority</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedReport.priority || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Requested</Typography>
                  <Typography variant="body2">{formatDate(selectedReport.requestedDate || selectedReport.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Completed</Typography>
                  <Typography variant="body2">{formatDate(selectedReport.completedDate)}</Typography>
                </Grid>
                {selectedReport.clinicalNotes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Clinical Notes</Typography>
                    <Typography variant="body2">{selectedReport.clinicalNotes}</Typography>
                  </Grid>
                )}
                {selectedReport.results && selectedReport.results.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Results</Typography>
                    <Table size="small" sx={{ mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Parameter</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedReport.results.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.parameter}</TableCell>
                            <TableCell>{r.value} {r.unit}</TableCell>
                            <TableCell>{r.referenceRange || '—'}</TableCell>
                            <TableCell>
                              {r.status && (
                                <Chip label={r.status} size="small" color={r.status === 'normal' ? 'success' : 'warning'} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                )}
                {selectedReport.resultSummary && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Summary</Typography>
                    <Typography variant="body2">{selectedReport.resultSummary}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedReport(null)} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DoctorLabReports;
