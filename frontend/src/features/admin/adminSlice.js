import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ── Dashboard ──────────────────────────────────────────────────────
export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/stats');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchAdminDoctors = createAsyncThunk('admin/fetchDoctors', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/doctors');
    return res.data.data.doctors;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchActivityChart = createAsyncThunk('admin/fetchActivityChart', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/activity-chart');
    return res.data.data.chartData;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const fetchRecentAppointments = createAsyncThunk('admin/fetchRecentAppointments', async (limit = 5, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/admin/recent-appointments?limit=${limit}`);
    return res.data.data.appointments;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

// ── User Management ────────────────────────────────────────────────
export const fetchAllUsers = createAsyncThunk('admin/fetchAllUsers', async (params, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/users', { params });
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch users'); }
});

export const createUser = createAsyncThunk('admin/createUser', async (userData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/admin/users', userData);
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to create user'); }
});

export const updateUser = createAsyncThunk('admin/updateUser', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/admin/users/${id}`, data);
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update user'); }
});

export const deleteUser = createAsyncThunk('admin/deleteUser', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/admin/users/${id}`);
    return id;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to delete user'); }
});

export const toggleUserStatus = createAsyncThunk('admin/toggleUserStatus', async (id, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.patch(`/admin/users/${id}/status`);
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to toggle status'); }
});

export const resetUserPassword = createAsyncThunk('admin/resetUserPassword', async ({ id, password }, { rejectWithValue }) => {
  try {
    await axiosInstance.patch(`/admin/users/${id}/reset-password`, { password });
    return id;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to reset password'); }
});

// ── Patients ───────────────────────────────────────────────────────
export const fetchAllPatients = createAsyncThunk('admin/fetchAllPatients', async (params, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/patients', { params });
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch patients'); }
});

// ── Feedback ───────────────────────────────────────────────────────
export const fetchAllFeedback = createAsyncThunk('admin/fetchAllFeedback', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/feedback');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch feedback'); }
});

// ── System Config ──────────────────────────────────────────────────
export const fetchSystemConfig = createAsyncThunk('admin/fetchSystemConfig', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/config');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch config'); }
});

export const updateSystemConfig = createAsyncThunk('admin/updateSystemConfig', async (data, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put('/admin/config', data);
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to update config'); }
});

// ── Reports ────────────────────────────────────────────────────────
export const fetchRevenueReport = createAsyncThunk('admin/fetchRevenueReport', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/reports/revenue');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch revenue report'); }
});

export const fetchAppointmentReport = createAsyncThunk('admin/fetchAppointmentReport', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/reports/appointments');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch appointment report'); }
});

export const fetchLabReport = createAsyncThunk('admin/fetchLabReport', async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/reports/lab');
    return res.data.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch lab report'); }
});

// ── Activity Logs ──────────────────────────────────────────────────
export const fetchActivityLogs = createAsyncThunk('admin/fetchActivityLogs', async (params, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get('/admin/activity-logs', { params });
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed to fetch activity logs'); }
});

// ── Slice ──────────────────────────────────────────────────────────
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    // Dashboard
    stats: { totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalStaff: 0, todayAppointments: 0, pendingLabTests: 0, revenue: 0 },
    doctors: [],
    chartData: [],
    recentAppointments: [],
    recentActivity: [],
    systemStatus: { serverLoad: 0, storageUsage: 0 },
    loading: false,
    doctorsLoading: false,
    chartLoading: false,
    appointmentsLoading: false,

    // Users
    users: [],
    usersTotal: 0,
    usersLoading: false,
    usersError: null,
    userActionLoading: false,
    userActionError: null,

    // Patients
    patients: [],
    patientsTotal: 0,
    patientsLoading: false,

    // Feedback
    feedback: [],
    feedbackLoading: false,

    // Config
    config: null,
    configLoading: false,

    // Reports
    revenueReport: { revenueData: [], totalYTD: 0 },
    appointmentReport: { appointmentData: [], total: 0 },
    labReport: { statusData: [], testTypeData: [], total: 0 },
    reportsLoading: false,

    // Activity Logs
    activityLogs: [],
    activityLogsTotal: 0,
    activityLogsLoading: false,

    error: null,
  },
  reducers: {
    clearAdminError: (s) => { s.error = null; },
    clearUserActionError: (s) => { s.userActionError = null; },
  },
  extraReducers: (builder) => {
    // Dashboard stats
    builder
      .addCase(fetchAdminStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAdminStats.fulfilled, (s, a) => {
        s.loading = false;
        s.stats = a.payload.stats;
        s.recentActivity = a.payload.recentActivity || [];
        s.systemStatus = a.payload.systemStatus || s.systemStatus;
      })
      .addCase(fetchAdminStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    builder
      .addCase(fetchAdminDoctors.pending, (s) => { s.doctorsLoading = true; })
      .addCase(fetchAdminDoctors.fulfilled, (s, a) => { s.doctorsLoading = false; s.doctors = a.payload; })
      .addCase(fetchAdminDoctors.rejected, (s) => { s.doctorsLoading = false; });

    builder
      .addCase(fetchActivityChart.pending, (s) => { s.chartLoading = true; })
      .addCase(fetchActivityChart.fulfilled, (s, a) => { s.chartLoading = false; s.chartData = a.payload; })
      .addCase(fetchActivityChart.rejected, (s) => { s.chartLoading = false; });

    builder
      .addCase(fetchRecentAppointments.pending, (s) => { s.appointmentsLoading = true; })
      .addCase(fetchRecentAppointments.fulfilled, (s, a) => { s.appointmentsLoading = false; s.recentAppointments = a.payload; })
      .addCase(fetchRecentAppointments.rejected, (s) => { s.appointmentsLoading = false; });

    // Users
    builder
      .addCase(fetchAllUsers.pending, (s) => { s.usersLoading = true; s.usersError = null; })
      .addCase(fetchAllUsers.fulfilled, (s, a) => { s.usersLoading = false; s.users = a.payload.data; s.usersTotal = a.payload.total; })
      .addCase(fetchAllUsers.rejected, (s, a) => { s.usersLoading = false; s.usersError = a.payload; });

    builder
      .addCase(createUser.pending, (s) => { s.userActionLoading = true; s.userActionError = null; })
      .addCase(createUser.fulfilled, (s, a) => { s.userActionLoading = false; s.users = [a.payload, ...s.users]; s.usersTotal += 1; })
      .addCase(createUser.rejected, (s, a) => { s.userActionLoading = false; s.userActionError = a.payload; });

    builder
      .addCase(updateUser.pending, (s) => { s.userActionLoading = true; s.userActionError = null; })
      .addCase(updateUser.fulfilled, (s, a) => {
        s.userActionLoading = false;
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx] = a.payload;
      })
      .addCase(updateUser.rejected, (s, a) => { s.userActionLoading = false; s.userActionError = a.payload; });

    builder
      .addCase(deleteUser.pending, (s) => { s.userActionLoading = true; s.userActionError = null; })
      .addCase(deleteUser.fulfilled, (s, a) => { s.userActionLoading = false; s.users = s.users.filter((u) => u._id !== a.payload); s.usersTotal -= 1; })
      .addCase(deleteUser.rejected, (s, a) => { s.userActionLoading = false; s.userActionError = a.payload; });

    builder
      .addCase(toggleUserStatus.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u._id === a.payload._id);
        if (idx !== -1) s.users[idx] = a.payload;
      });

    builder
      .addCase(resetUserPassword.pending, (s) => { s.userActionLoading = true; s.userActionError = null; })
      .addCase(resetUserPassword.fulfilled, (s) => { s.userActionLoading = false; })
      .addCase(resetUserPassword.rejected, (s, a) => { s.userActionLoading = false; s.userActionError = a.payload; });

    // Patients
    builder
      .addCase(fetchAllPatients.pending, (s) => { s.patientsLoading = true; })
      .addCase(fetchAllPatients.fulfilled, (s, a) => { s.patientsLoading = false; s.patients = a.payload.data; s.patientsTotal = a.payload.total; })
      .addCase(fetchAllPatients.rejected, (s) => { s.patientsLoading = false; });

    // Feedback
    builder
      .addCase(fetchAllFeedback.pending, (s) => { s.feedbackLoading = true; })
      .addCase(fetchAllFeedback.fulfilled, (s, a) => { s.feedbackLoading = false; s.feedback = a.payload; })
      .addCase(fetchAllFeedback.rejected, (s) => { s.feedbackLoading = false; });

    // Config
    builder
      .addCase(fetchSystemConfig.pending, (s) => { s.configLoading = true; })
      .addCase(fetchSystemConfig.fulfilled, (s, a) => { s.configLoading = false; s.config = a.payload; })
      .addCase(fetchSystemConfig.rejected, (s) => { s.configLoading = false; });

    builder
      .addCase(updateSystemConfig.fulfilled, (s, a) => { s.config = a.payload; });

    // Reports
    builder
      .addCase(fetchRevenueReport.pending, (s) => { s.reportsLoading = true; })
      .addCase(fetchRevenueReport.fulfilled, (s, a) => { s.reportsLoading = false; s.revenueReport = a.payload; })
      .addCase(fetchRevenueReport.rejected, (s) => { s.reportsLoading = false; });

    builder
      .addCase(fetchAppointmentReport.pending, (s) => { s.reportsLoading = true; })
      .addCase(fetchAppointmentReport.fulfilled, (s, a) => { s.reportsLoading = false; s.appointmentReport = a.payload; })
      .addCase(fetchAppointmentReport.rejected, (s) => { s.reportsLoading = false; });

    builder
      .addCase(fetchLabReport.pending, (s) => { s.reportsLoading = true; })
      .addCase(fetchLabReport.fulfilled, (s, a) => { s.reportsLoading = false; s.labReport = a.payload; })
      .addCase(fetchLabReport.rejected, (s) => { s.reportsLoading = false; });

    // Activity Logs
    builder
      .addCase(fetchActivityLogs.pending, (s) => { s.activityLogsLoading = true; })
      .addCase(fetchActivityLogs.fulfilled, (s, a) => {
        s.activityLogsLoading = false;
        s.activityLogs = a.payload.data || [];
        s.activityLogsTotal = a.payload.total || 0;
      })
      .addCase(fetchActivityLogs.rejected, (s) => { s.activityLogsLoading = false; });
  },
});

export const { clearAdminError, clearUserActionError } = adminSlice.actions;
export default adminSlice.reducer;

