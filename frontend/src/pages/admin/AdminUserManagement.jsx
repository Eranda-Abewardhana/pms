import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, TextField,
  InputAdornment, Tabs, Tab, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Switch, FormControlLabel,
  CircularProgress, Menu
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockResetIcon from '@mui/icons-material/LockReset';
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword
} from '../../features/admin/adminSlice';

const AdminUserManagement = () => {
  const dispatch = useDispatch();
  const { users, usersLoading, userActionLoading } = useSelector((state) => state.admin);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'doctor', phone: '',
    specialization: '', department: '', licenseNo: '', qualification: '',
    nic: '', gender: '', dateOfBirth: '', address: '', bloodGroup: ''
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(fetchAllUsers({ role: tab === 'all' ? undefined : tab, search }));
  }, [dispatch, tab, search]);

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', password: '', role: 'doctor', phone: '',
        specialization: '', department: '', licenseNo: '', qualification: '',
        nic: '', gender: '', dateOfBirth: '', address: '', bloodGroup: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      dispatch(updateUser({ id: editingUser.id, data: formData })).then(() => handleCloseDialog());
    } else {
      dispatch(createUser(formData)).then(() => handleCloseDialog());
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleStatusToggle = (user) => {
    dispatch(toggleUserStatus(user.id));
    handleMenuClose();
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      dispatch(deleteUser(user.id));
    }
    handleMenuClose();
  };

  const handleResetPassword = (user) => {
    const newPassword = prompt(`Enter new password for ${user.name}:`);
    if (newPassword) {
      dispatch(resetUserPassword({ id: user.id, password: newPassword }));
    }
    handleMenuClose();
  };

  const roles = ['all', 'admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'labtech', 'patient'];

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#E8ECF4' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#00C6B3',
            '&:hover': { bgcolor: '#00A89A' },
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Add New User
        </Button>
      </Box>

      <Card sx={{ mb: 3, bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{
            px: 2,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            '& .MuiTab-root': {
              color: '#8A94A6',
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
              '&.Mui-selected': { color: '#00C6B3' }
            },
            '& .MuiTabs-indicator': { bgcolor: '#00C6B3' }
          }}
        >
          {roles.map((r) => (
            <Tab key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} value={r} />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8A94A6' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                color: '#E8ECF4',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }
              }
            }}
          />
        </Box>
      </Card>

      <TableContainer component={Card} sx={{ bgcolor: '#1A2236', borderRadius: '16px' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { color: '#8A94A6', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CircularProgress sx={{ color: '#00C6B3' }} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#8A94A6' }}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id ?? user._id} sx={{ '& td': { color: '#E8ECF4', borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#00C6B3', fontWeight: 700 }}>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#8A94A6' }}>{user.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(75,158,255,0.1)',
                        color: '#4B9EFF',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.phone || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: user.isActive ? 'rgba(52,211,153,0.1)' : 'rgba(255,107,107,0.1)',
                        color: user.isActive ? '#34D399' : '#FF6B6B',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, user)} sx={{ color: '#8A94A6' }}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#1A2236',
            color: '#E8ECF4',
            border: '1px solid rgba(255,255,255,0.1)',
            '& .MuiMenuItem-root': { fontSize: '0.85rem' }
          }
        }}
      >
        <MenuItem onClick={() => { handleOpenDialog(selectedUser); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1, color: '#4B9EFF' }} /> Edit User
        </MenuItem>
        <MenuItem onClick={() => handleStatusToggle(selectedUser)}>
          <Switch size="small" checked={selectedUser?.isActive} sx={{ mr: 1 }} />
          {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={() => handleResetPassword(selectedUser)}>
          <LockResetIcon fontSize="small" sx={{ mr: 1, color: '#FF9F43' }} /> Reset Password
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedUser)} sx={{ color: '#FF6B6B' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete User
        </MenuItem>
      </Menu>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A2236', color: '#E8ECF4', borderRadius: '16px' } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Full Name" name="name"
                  value={formData.name} onChange={handleInputChange} required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Email" name="email" type="email"
                  value={formData.email} onChange={handleInputChange} required
                />
              </Grid>
              {!editingUser && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Password" name="password" type="password"
                    value={formData.password} onChange={handleInputChange} required
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth select label="Role" name="role"
                  value={formData.role} onChange={handleInputChange} required
                >
                  {roles.filter(r => r !== 'all').map(r => (
                    <MenuItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Phone" name="phone"
                  value={formData.phone} onChange={handleInputChange}
                />
              </Grid>

              {/* Conditional fields based on role */}
              {formData.role === 'doctor' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Specialization" name="specialization" value={formData.specialization} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Department" name="department" value={formData.department} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="License No" name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Qualification" name="qualification" value={formData.qualification} onChange={handleInputChange} />
                  </Grid>
                </>
              )}

              {formData.role === 'patient' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="NIC" name="nic" value={formData.nic} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date of Birth" name="dateOfBirth" type="date" InputLabelProps={{ shrink: true }} value={formData.dateOfBirth} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange}>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" name="address" multiline rows={2} value={formData.address} onChange={handleInputChange} />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#8A94A6' }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={userActionLoading}
              sx={{ bgcolor: '#00C6B3', '&:hover': { bgcolor: '#00A89A' } }}
            >
              {userActionLoading ? <CircularProgress size={24} /> : (editingUser ? 'Update User' : 'Create User')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;
