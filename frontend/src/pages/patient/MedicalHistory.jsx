import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  CircularProgress,
  Alert
} from '@mui/material';
import { getMedicalHistory } from '../../api/patientApi';
import { format } from 'date-fns';

const MedicalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getMedicalHistory();
        if (response.success) {
          setHistory(response.data);
        } else {
          setError('Failed to fetch medical history');
        }
      } catch (err) {
        console.error('Error fetching medical history:', err);
        setError('An error occurred while fetching your medical history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Medical History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your past medical records and diagnoses.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {history.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No medical records found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Diagnosis</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Prescriptions</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Visit Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record._id} hover>
                  <TableCell>
                    {record.visitDate ? format(new Date(record.visitDate), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {record.doctorId?.name || 'Unknown Doctor'}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {record.doctorId?.specialization}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.diagnosis || 'No diagnosis recorded'}</TableCell>
                  <TableCell>
                    {record.prescriptions && record.prescriptions.length > 0 ? (
                      record.prescriptions.map((p, idx) => (
                        <Chip 
                          key={idx} 
                          label={p.medicine} 
                          size="small" 
                          sx={{ m: 0.5 }} 
                          variant="outlined"
                        />
                      ))
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={record.visitType || 'General'} 
                      color="primary" 
                      size="small" 
                      variant="soft"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MedicalHistory;
