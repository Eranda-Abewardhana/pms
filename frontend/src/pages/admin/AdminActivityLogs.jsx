import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Stack, Chip, CircularProgress, TextField,
  MenuItem, Button, Paper, Avatar, Tooltip, IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivityLogs } from '../../features/admin/adminSlice';
import { format } from 'date-fns';

const TEAL = '#00C6B3';

const ACTION_COLORS = {
  REGISTER_PATIENT: '#4B9EFF',
  UPDATE_PATIENT: '#A78BFA',
  LOGIN: '#34D399',
  LOGOUT: '#64748b',
  UPDATE_LAB_RESULT: '#FF9F43',
  CREATE_INVOICE: '#00C6B3',
  DEFAULT: '#8A94A6',
};

const ROLE_COLORS = {
  admin: '#7C3AED',
  doctor: '#0284C7',
  nurse: '#059669',
  receptionist: '#D97706',
  labtech: '#DB2777',
  cashier: '#DC2626',
  patient: '#64748B',
};

const AdminActivityLogs = () => {
  const dispatch = useDispatch();
  const { activityLogs = [], activityLogsTotal = 0, activityLogsLoading = false } = useSelector((s) => s.admin);

  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const limit = 25;

  const load = useCallback((p = page) => {
    const params = { page: p, limit };
    if (role) params.role = role;
    if (action) params.action = action;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    dispatch(fetchActivityLogs(params));
  }, [dispatch, page, role, action, startDate, endDate]);

  useEffect(() => { load(); }, []);

  const handleExportCSV = () => {
    const rows = activityLogs;
    if (!rows.length) return;
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Description', 'IP'];
    const csvRows = rows.map((r) => [
      r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      r.user?.name || 'System',
      r.userRole || '',
      r.action || '',
      r.module || '',
      (r.description || '').replace(/,/g, ';'),
      r.ipAddress || '',
    ]);
    const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(activityLogsTotal / limit);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Activity Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Audit trail — {activityLogsTotal} total events
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExportCSV}
            sx={{ borderColor: TEAL, color: TEAL, textTransform: 'none', fontWeight: 700 }}>
            Export CSV
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => load(1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: 2 }}>
        <FilterListIcon sx={{ color: TEAL }} />
        <TextField size="small" select label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 130 }}>
          <MenuItem value="">All Roles</MenuItem>
          {['admin','doctor','nurse','receptionist','labtech','cashier','patient'].map((r) => (
            <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="Action" value={action} onChange={(e) => setAction(e.target.value)}
          placeholder="e.g. LOGIN" sx={{ minWidth: 160 }} />
        <TextField size="small" type="date" label="From" value={startDate}
          onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" type="date" label="To" value={endDate}
          onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" size="small" onClick={() => { setPage(1); load(1); }}
          sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#00a896' }, textTransform: 'none', fontWeight: 700 }}>
          Apply Filter
        </Button>
      </Paper>

      {/* Table */}
      <Card sx={{ overflow: 'hidden' }}>
        {activityLogsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: TEAL }} /></Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 900 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activityLogs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <HistoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No activity logs found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (activityLogs || []).map((log) => {
                  const roleColor = ROLE_COLORS[log.userRole] || '#64748B';
                  const actionColor = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT;
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '—'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 26, height: 26, bgcolor: `${roleColor}22`, color: roleColor, fontSize: 11, fontWeight: 700 }}>
                            {(log.user?.name || 'S')[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{log.user?.name || 'System'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.userRole || '—'} size="small"
                          sx={{ bgcolor: `${roleColor}18`, color: roleColor, fontWeight: 700, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action || '—'} size="small"
                          sx={{ bgcolor: `${actionColor}18`, color: actionColor, fontWeight: 700, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>{log.module || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {log.description || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{log.ipAddress || '—'}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} mt={2}>
          <Button size="small" disabled={page <= 1} onClick={() => { setPage((p) => p - 1); load(page - 1); }}
            sx={{ textTransform: 'none' }}>← Prev</Button>
          <Typography variant="body2" color="text.secondary">Page {page} of {totalPages}</Typography>
          <Button size="small" disabled={page >= totalPages} onClick={() => { setPage((p) => p + 1); load(page + 1); }}
            sx={{ textTransform: 'none', color: TEAL }}>Next →</Button>
        </Stack>
      )}
    </Box>
  );
};

export default AdminActivityLogs;
