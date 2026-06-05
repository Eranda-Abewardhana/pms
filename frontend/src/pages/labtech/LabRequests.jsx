import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Button, IconButton, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Divider, Grid, Tab, Tabs, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BiotechIcon from '@mui/icons-material/Biotech';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLabRequests,
  updateLabTestStatus,
  fetchLabTestDetails,
  clearSelectedTest,
  clearLabtechSuccess,
  clearLabtechError
} from '../../features/labtech/labtechSlice';
import { toast } from 'react-toastify';

const PRIMARY = '#00C6B3';
const SECONDARY = '#4B9EFF';
const WARNING = '#FF9F43';

const LabRequests = () => {
  const dispatch = useDispatch();
  const { requests, selectedTest, detailsLoading, updateLoading, loading, success, error } = useSelector((s) => s.labtech);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0); // 0: Pending, 1: In-Progress
  const [openDetails, setOpenDetails] = useState(false);
  const [openResultForm, setOpenOpenResultForm] = useState(false);
  
  // Form state for results
  const [results, setResults] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);

  useEffect(() => {
    load();
  }, [dispatch, tab]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearLabtechSuccess());
      load();
      setOpenOpenResultForm(false);
    }
    if (error) {
      toast.error(error);
      dispatch(clearLabtechError());
    }
  }, [success, error, dispatch]);

  const load = () => {
    const status = tab === 0 ? 'pending' : 'in-progress';
    dispatch(fetchLabRequests({ status }));
  };

  const handleOpenDetails = (id) => {
    dispatch(fetchLabTestDetails(id));
    setOpenDetails(true);
  };

  const handleAccept = (id) => {
    dispatch(updateLabTestStatus({ id, data: { status: 'in-progress' } }));
  };

  const handleOpenResultForm = (test) => {
    dispatch(fetchLabTestDetails(test._id));
    setResults(test.results || '');
    setResultSummary(test.resultSummary || '');
    setIsAbnormal(test.isAbnormal || false);
    setOpenOpenResultForm(true);
  };

  const handleSubmitResult = () => {
    if (!results) return toast.error('Please enter test results');
    dispatch(updateLabTestStatus({
      id: selectedTest._id,
      data: {
        results,
        resultSummary,
        isAbnormal,
        status: 'completed'
      }
    }));
  };

  const tests = requests?.tests || [];
  const filtered = tests.filter(t => 
    t.testId.toLowerCase().includes(search.toLowerCase()) ||
    t.patient?.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Lab Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and process pending laboratory tests
          </Typography>
        </Box>
        <IconButton onClick={load} color="primary"><RefreshIcon /></IconButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)}
          sx={{ 
            px: 2, borderBottom: 1, borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' }
          }}
        >
          <Tab label={`Pending (${tab === 0 ? filtered.length : '—'})`} />
          <Tab label={`In-Progress (${tab === 1 ? filtered.length : '—'})`} />
        </Tabs>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by Test ID, Patient Name or Test Type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
        </Box>
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {['Test ID', 'Date', 'Patient', 'Test Type', 'Priority', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={32} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No requests found.</TableCell></TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell sx={{ fontWeight: 700, color: PRIMARY }}>{row.testId}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{row.patient?.userId?.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {row.testType === 'Other' ? row.customTestName : row.testType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.priority} 
                      size="small" 
                      color={row.priority === 'urgent' ? 'error' : row.priority === 'stat' ? 'warning' : 'default'}
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenDetails(row._id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {tab === 0 ? (
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<ScienceIcon />}
                          onClick={() => handleAccept(row._id)}
                          sx={{ bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none' }}
                        >
                          Accept
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<BiotechIcon />}
                          onClick={() => handleOpenResultForm(row)}
                          sx={{ bgcolor: SECONDARY, borderRadius: '8px', textTransform: 'none' }}
                        >
                          Enter Results
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Test Details</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : selectedTest && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">TEST ID</Typography>
                <Typography fontWeight={700}>{selectedTest.testId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">STATUS</Typography>
                <Box><Chip label={selectedTest.status} size="small" color="info" sx={{ fontWeight: 700 }} /></Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">PATIENT</Typography>
                <Typography fontWeight={700}>{selectedTest.patient?.userId?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedTest.patient?.userId?.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">REQUESTED BY</Typography>
                <Typography fontWeight={600}>{selectedTest.requestedBy?.name}</Typography>
              </Grid>
              {selectedTest.clinicalNotes && (
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">DOCTOR'S CLINICAL NOTES</Typography>
                    <Typography variant="body2">{selectedTest.clinicalNotes}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Result Entry Form */}
      <Dialog open={openResultForm} onClose={() => setOpenOpenResultForm(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700 }}>Enter Test Results - {selectedTest?.testId}</DialogTitle>
        <DialogContent dividers>
          {detailsLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : selectedTest && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" icon={<ScienceIcon />}>
                  Patient: <strong>{selectedTest.patient?.userId?.name}</strong> | Test: <strong>{selectedTest.testType === 'Other' ? selectedTest.customTestName : selectedTest.testType}</strong>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Detailed Lab Results"
                  placeholder="Enter numerical values, findings, and observations..."
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Result Summary / Conclusion"
                  placeholder="Brief summary (e.g. Within normal limits)"
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Classification</InputLabel>
                  <Select
                    value={isAbnormal}
                    label="Classification"
                    onChange={(e) => setIsAbnormal(e.target.value)}
                  >
                    <MenuItem value={false}>Normal Findings</MenuItem>
                    <MenuItem value={true}>Abnormal / Critical Findings</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenOpenResultForm(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmitResult} 
            variant="contained" 
            disabled={updateLoading}
            startIcon={<CheckCircleIcon />}
            sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: '#00A89A' } }}
          >
            {updateLoading ? 'Saving...' : 'Submit & Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabRequests;
