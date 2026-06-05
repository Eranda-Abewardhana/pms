import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Grid, Card, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Cell as ReCell
} from 'recharts';
import { fetchRevenueReport, fetchAppointmentReport, fetchLabReport } from '../../features/admin/adminSlice';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AdminReports = () => {
  const dispatch = useDispatch();
  const { revenueReport, appointmentReport, labReport, reportsLoading, error } = useSelector((state) => state.admin);
  const [tab, setTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    if (tab === 0) {
      dispatch(fetchRevenueReport());
    } else if (tab === 1) {
      dispatch(fetchAppointmentReport());
    } else if (tab === 2) {
      dispatch(fetchLabReport());
    }
  }, [dispatch, tab]);

  const handlePrint = () => {
    window.print();
  };

  const TAB_LABELS = ['Financial Summary', 'Appointment Stats', 'Lab Operations'];

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#111827',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2 - 20;  // reserve 20mm for header

      // Scale image to fit
      const ratio   = canvas.width / canvas.height;
      let imgW = usableW;
      let imgH = usableW / ratio;
      if (imgH > usableH) { imgH = usableH; imgW = usableH * ratio; }

      // Header
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.setTextColor(0, 198, 179);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MetroCare PMS — ' + TAB_LABELS[tab], margin, margin + 4);
      pdf.setTextColor(138, 148, 166);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated: ' + new Date().toLocaleString(), margin, margin + 9);

      // Chart image
      pdf.addImage(imgData, 'PNG', margin, margin + 14, imgW, imgH);

      // Footer
      pdf.setTextColor(138, 148, 166);
      pdf.setFontSize(7);
      pdf.text('Confidential — MetroCare Patient Management System', margin, pageH - 5);

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`MetroCare_Report_${TAB_LABELS[tab].replace(/ /g, '_')}_${date}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4' }}>
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ color: '#8A94A6', borderColor: 'rgba(255,255,255,0.1)', textTransform: 'none' }}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportPDF}
            disabled={exporting || reportsLoading}
            sx={{ bgcolor: '#00C6B3', '&:hover': { bgcolor: '#00A89A' }, textTransform: 'none' }}
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            '& .MuiTab-root': { color: '#8A94A6', textTransform: 'none', fontWeight: 600 }
          }}
        >
          <Tab label="Financial Summary" />
          <Tab label="Appointment Stats" />
          <Tab label="Lab Operations" />
        </Tabs>

        <Box sx={{ p: 3 }} ref={reportRef}>
          {reportsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: '#00C6B3' }} />
            </Box>
          ) : (
            <>
              {tab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 700 }}>
                      Monthly Revenue Trend
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueReport.revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" tick={{ fill: '#8A94A6' }} />
                          <YAxis tick={{ fill: '#8A94A6' }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1A2236', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#E8ECF4' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar dataKey="revenue" fill="#00C6B3" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="subtitle2" sx={{ color: '#8A94A6', mb: 1 }}>
                        Total Revenue (YTD)
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#E8ECF4', fontWeight: 800, mb: 2 }}>
                        LKR {revenueReport.totalYTD?.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#34D399' }}>
                        <TrendingUpIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Real-time data
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 700 }}>
                      Appointment Status Distribution
                    </Typography>
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={appointmentReport.appointmentData}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {appointmentReport.appointmentData.map((entry, index) => (
                              <ReCell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A2236', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#E8ECF4' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                     <TableContainer>
                       <Table>
                         <TableHead>
                           <TableRow sx={{ '& th': { color: '#8A94A6', borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
                             <TableCell>Status</TableCell>
                             <TableCell align="right">Count</TableCell>
                             <TableCell align="right">Percentage</TableCell>
                           </TableRow>
                         </TableHead>
                         <TableBody>
                           {appointmentReport.appointmentData.map((row) => (
                             <TableRow key={row.name} sx={{ '& td': { color: '#E8ECF4', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                               <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                 <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
                                 {row.name}
                               </TableCell>
                               <TableCell align="right">{row.value}</TableCell>
                               <TableCell align="right">
                                 {appointmentReport.total > 0 ? ((row.value / appointmentReport.total) * 100).toFixed(1) : 0}%
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </TableContainer>
                  </Grid>
                </Grid>
              )}

              {tab === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 700 }}>
                      Lab Test Status
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={labReport.statusData}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {labReport.statusData.map((entry, index) => (
                              <ReCell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A2236', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#E8ECF4' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#E8ECF4', mb: 2, fontWeight: 700 }}>
                      Most Requested Tests
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#8A94A6', borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
                            <TableCell>Test Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {labReport.testTypeData.map((row) => (
                            <TableRow key={row.name} sx={{ '& td': { color: '#E8ECF4', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell align="right">{row.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default AdminReports;
