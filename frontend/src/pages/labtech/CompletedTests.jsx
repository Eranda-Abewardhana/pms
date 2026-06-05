import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, TextField,
  InputAdornment, Tooltip, CircularProgress, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Grid, Avatar, Stack,
  LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLabRequests, fetchLabTestDetails, uploadLabReport } from '../../features/labtech/labtechSlice';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance';

const PRIMARY = '#00C6B3';
const SUCCESS = '#34D399';
const ERROR = '#F87171';

const handlePrint = (report) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Lab Report - ${report.testId}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: auto; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${PRIMARY}; padding-bottom: 20px; margin-bottom: 30px; }
      .logo { font-size: 28px; font-weight: bold; color: ${PRIMARY}; }
      .report-title { text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; font-size: 20px; color: #555; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
      .info-item { margin-bottom: 10px; }
      .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; display: block; }
      .value { font-size: 14px; font-weight: 600; }
      .results-section { border: 1px solid #eee; border-radius: 8px; padding: 25px; margin-bottom: 40px; min-height: 200px; white-space: pre-line; line-height: 1.6; }
      .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 50px; font-size: 12px; color: #999; display: flex; justify-content: space-between; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
      .critical { color: ${ERROR}; background: #fff5f5; border: 1px solid ${ERROR}; }
      .normal { color: ${SUCCESS}; background: #f0fff4; border: 1px solid ${SUCCESS}; }
    </style>
    </head><body>
    <div class="header">
      <div class="logo">MetroCare Laboratory</div>
      <div style="text-align: right">
        <div style="font-size: 12px; color: #666;">Report Date: ${new Date(report.completedAt).toLocaleDateString()}</div>
        <div style="font-size: 14px; font-weight: bold; color: ${PRIMARY};">${report.testId}</div>
      </div>
    </div>
    <div class="report-title">Laboratory Investigation Report</div>
    <div class="info-grid">
      <div>
        <div class="info-item"><span class="label">Patient Name</span><span class="value">${report.patient?.userId?.name}</span></div>
        <div class="info-item"><span class="label">Patient ID</span><span class="value">${report.patient?.patientId || 'N/A'}</span></div>
        <div class="info-item"><span class="label">Email</span><span class="value">${report.patient?.userId?.email || 'N/A'}</span></div>
      </div>
      <div>
        <div class="info-item"><span class="label">Investigation Type</span><span class="value">${report.testType === 'Other' ? report.customTestName : report.testType}</span></div>
        <div class="info-item"><span class="label">Requested By</span><span class="value">Dr. ${report.requestedBy?.name}</span></div>
        <div class="info-item"><span class="label">Assigned Technician</span><span class="value">${report.assignedTo?.name}</span></div>
      </div>
    </div>
    <div class="label" style="margin-bottom: 8px; margin-left: 5px;">Test Results & Observations</div>
    <div class="results-section">
      ${report.results}
      <div style="margin-top: 30px; border-top: 1px dashed #eee; padding-top: 15px;">
        <strong>Summary:</strong> ${report.resultSummary || 'No summary provided.'}
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 40px;">
      <div class="status-badge ${report.isAbnormal ? 'critical' : 'normal'}">
        ${report.isAbnormal ? '⚠ CRITICAL/ABNORMAL FINDINGS' : '✓ RESULTS WITHIN NORMAL LIMITS'}
      </div>
    </div>
    <div class="footer">
      <div>Computer generated report. Valid without physical signature.</div>
      <div>&copy; 2024 MetroCare Patient Management System</div>
    </div>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

const CompletedTests = () => {
  const dispatch = useDispatch();
  const { requests, selectedTest, detailsLoading, loading, uploadLoading } = useSelector((s) => s.labtech);
  const [search, setSearch] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchLabRequests({ status: 'completed' }));
  }, [dispatch]);

  const handleView = (id) => {
    dispatch(fetchLabTestDetails(id));
    setViewOpen(true);
  };

  const handleUploadClick = (testId) => {
    setUploadingId(testId);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingId) return;
    const formData = new FormData();
    formData.append('reportFile', file);
    formData.append('testId', String(uploadingId));
    try {
      await dispatch(uploadLabReport({ id: uploadingId, formData })).unwrap();
      toast.success('Report uploaded successfully!');
      dispatch(fetchLabRequests({ status: 'completed' }));
    } catch (err) {
      toast.error(err || 'Upload failed');
    }
    e.target.value = '';
    setUploadingId(null);
  };

  const handleDownload = async (testId, filename) => {
    try {
      const res = await axiosInstance.get(`/lab/${testId}/report-file`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'lab-report.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const tests = requests?.tests || [];
  const filtered = tests.filter(t =>
    t.testId.toLowerCase().includes(search.toLowerCase()) ||
    t.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Completed Investigations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View history and upload/access lab report files
          </Typography>
        </Box>
        <IconButton onClick={() => dispatch(fetchLabRequests({ status: 'completed' }))} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patient name, test ID, or investigation type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          }}
        />
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {['Test ID', 'Completion Date', 'Patient', 'Investigation', 'Result Status', 'Report File', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={32} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No completed tests found.</TableCell></TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>{row.testId}</TableCell>
                  <TableCell>{new Date(row.completedAt || row.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{row.patient?.name || row.patient?.user?.name || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.testType === 'Other' ? row.customTestName : row.testType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.isAbnormal ? 'Abnormal' : 'Normal'}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 700, fontSize: '0.7rem',
                        color: row.isAbnormal ? ERROR : SUCCESS,
                        borderColor: row.isAbnormal ? ERROR : SUCCESS,
                        bgcolor: row.isAbnormal ? `${ERROR}10` : `${SUCCESS}10`
                      }}
                      icon={row.isAbnormal ? <WarningIcon style={{ fontSize: 14 }} /> : <CheckCircleIcon style={{ fontSize: 14 }} />}
                    />
                  </TableCell>
                  <TableCell>
                    {row.reportFile ? (
                      <Tooltip title={row.reportFileName || row.reportFile}>
                        <Chip label="Report" icon={<InsertDriveFileIcon />} size="small"
                          sx={{ bgcolor: `${PRIMARY}12`, color: PRIMARY, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                          onClick={() => handleDownload(row.id, row.reportFileName)} />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">No file</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Report">
                        <IconButton size="small" onClick={() => handleView(row.id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Report">
                        <IconButton size="small" onClick={() => handlePrint(row)} sx={{ color: PRIMARY }}>
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={row.reportFile ? 'Replace Report PDF' : 'Upload Report PDF'}>
                        <IconButton size="small" onClick={() => handleUploadClick(row.id)}
                          sx={{ color: row.reportFile ? SUCCESS : '#FF9F43' }}>
                          <CloudUploadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Report Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Laboratory Investigation Report
          {selectedTest && (
            <Box>
              <Chip label={selectedTest.testId} size="small" sx={{ mr: 1, fontWeight: 700 }} />
              <IconButton onClick={() => handlePrint(selectedTest)} color="primary"><PrintIcon /></IconButton>
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
          ) : selectedTest && (
            <Box sx={{ p: 1 }}>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: PRIMARY }}><PersonIcon /></Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">PATIENT</Typography>
                      <Typography fontWeight={700}>{selectedTest.patient?.userId?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedTest.patient?.patientId}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: SECONDARY }}><ScienceIcon /></Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">INVESTIGATION</Typography>
                      <Typography fontWeight={700}>{selectedTest.testType === 'Other' ? selectedTest.customTestName : selectedTest.testType}</Typography>
                      <Typography variant="body2" color="text.secondary">Requested by Dr. {selectedTest.requestedBy?.name}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={700} color="text.secondary">RESULTS & FINDINGS</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover', minHeight: 150, whiteSpace: 'pre-line' }}>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{selectedTest.results}</Typography>
              </Paper>

              <Box sx={{ p: 2, borderLeft: '4px solid', borderColor: selectedTest.isAbnormal ? ERROR : SUCCESS, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>SUMMARY</Typography>
                <Typography variant="body2">{selectedTest.resultSummary || 'N/A'}</Typography>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                 <Chip 
                    label={selectedTest.isAbnormal ? 'CRITICAL FINDINGS' : 'NORMAL RANGE'} 
                    color={selectedTest.isAbnormal ? 'error' : 'success'}
                    sx={{ fontWeight: 800, px: 2 }}
                 />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setViewOpen(false)} color="inherit">Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => handlePrint(selectedTest)} sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: '#00A89A' } }}>
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompletedTests;
