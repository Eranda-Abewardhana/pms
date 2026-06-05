import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as nurseApi from '../../api/nurseApi';

// ── Async Thunks ─────────────────────────────────────────────────

export const fetchNurseStats = createAsyncThunk('nurse/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await nurseApi.getNurseStats();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch stats');
  }
});

export const fetchPatientQueue = createAsyncThunk('nurse/fetchQueue', async (params, { rejectWithValue }) => {
  try {
    const res = await nurseApi.getPatientQueue(params);
    return res.data.data?.appointments || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch queue');
  }
});

export const callPatient = createAsyncThunk('nurse/callPatient', async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await nurseApi.updateAppointmentStatus(id, status);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update status');
  }
});

export const fetchPatients = createAsyncThunk('nurse/fetchPatients', async (params, { rejectWithValue }) => {
  try {
    const res = await nurseApi.searchPatients(params);
    return res.data.data?.patients || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch patients');
  }
});

export const submitVitals = createAsyncThunk('nurse/submitVitals', async (data, { rejectWithValue }) => {
  try {
    const res = await nurseApi.recordVitals(data);
    return res.data.data?.vitals;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to record vitals');
  }
});

export const fetchVitalsByPatient = createAsyncThunk('nurse/fetchVitalsByPatient', async (patientId, { rejectWithValue }) => {
  try {
    const res = await nurseApi.getVitalsByPatient(patientId);
    return res.data.data?.records || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch vitals');
  }
});

export const fetchVitalsHistory = createAsyncThunk('nurse/fetchVitalsHistory', async (params, { rejectWithValue }) => {
  try {
    const res = await nurseApi.getVitalsHistory(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch vitals history');
  }
});

export const submitLabRequest = createAsyncThunk('nurse/submitLabRequest', async (data, { rejectWithValue }) => {
  try {
    const res = await nurseApi.createLabRequest(data);
    return res.data.data?.test;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create lab request');
  }
});

export const fetchDailyVitalsReport = createAsyncThunk('nurse/fetchDailyReport', async (params, { rejectWithValue }) => {
  try {
    const res = await nurseApi.getDailyVitalsReport(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch report');
  }
});

// ── Slice ────────────────────────────────────────────────────────

const nurseSlice = createSlice({
  name: 'nurse',
  initialState: {
    stats: null,
    queue: [],
    patients: [],
    patientVitals: [],
    vitalsHistory: { records: [], total: 0, page: 1, totalPages: 1 },
    dailyReport: [],
    loading: false,
    queueLoading: false,
    patientsLoading: false,
    vitalsLoading: false,
    reportLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearNurseError: (state) => { state.error = null; },
    clearNurseSuccess: (state) => { state.success = null; },
    updateQueueItem: (state, action) => {
      const idx = state.queue.findIndex((a) => a._id === action.payload._id);
      if (idx !== -1) state.queue[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Stats
    builder
      .addCase(fetchNurseStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNurseStats.fulfilled, (state, { payload }) => { state.loading = false; state.stats = payload; })
      .addCase(fetchNurseStats.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Queue
    builder
      .addCase(fetchPatientQueue.pending, (state) => { state.queueLoading = true; })
      .addCase(fetchPatientQueue.fulfilled, (state, { payload }) => { state.queueLoading = false; state.queue = payload; })
      .addCase(fetchPatientQueue.rejected, (state, { payload }) => { state.queueLoading = false; state.error = payload; });

    // Call patient
    builder
      .addCase(callPatient.fulfilled, (state, { payload }) => {
        const idx = state.queue.findIndex((a) => a._id === payload._id);
        if (idx !== -1) state.queue[idx] = payload;
      });

    // Patients
    builder
      .addCase(fetchPatients.pending, (state) => { state.patientsLoading = true; })
      .addCase(fetchPatients.fulfilled, (state, { payload }) => { state.patientsLoading = false; state.patients = payload; })
      .addCase(fetchPatients.rejected, (state, { payload }) => { state.patientsLoading = false; state.error = payload; });

    // Vitals
    builder
      .addCase(submitVitals.pending, (state) => { state.vitalsLoading = true; state.error = null; state.success = null; })
      .addCase(submitVitals.fulfilled, (state) => { state.vitalsLoading = false; state.success = 'Vitals recorded successfully!'; })
      .addCase(submitVitals.rejected, (state, { payload }) => { state.vitalsLoading = false; state.error = payload; });

    builder
      .addCase(fetchVitalsByPatient.pending, (state) => { state.vitalsLoading = true; })
      .addCase(fetchVitalsByPatient.fulfilled, (state, { payload }) => { state.vitalsLoading = false; state.patientVitals = payload; })
      .addCase(fetchVitalsByPatient.rejected, (state, { payload }) => { state.vitalsLoading = false; state.error = payload; });

    builder
      .addCase(fetchVitalsHistory.pending, (state) => { state.reportLoading = true; })
      .addCase(fetchVitalsHistory.fulfilled, (state, { payload }) => { state.reportLoading = false; state.vitalsHistory = payload; })
      .addCase(fetchVitalsHistory.rejected, (state, { payload }) => { state.reportLoading = false; state.error = payload; });

    // Lab
    builder
      .addCase(submitLabRequest.fulfilled, (state) => { state.success = 'Lab request created successfully!'; })
      .addCase(submitLabRequest.rejected, (state, { payload }) => { state.error = payload; });

    // Report
    builder
      .addCase(fetchDailyVitalsReport.pending, (state) => { state.reportLoading = true; })
      .addCase(fetchDailyVitalsReport.fulfilled, (state, { payload }) => { state.reportLoading = false; state.dailyReport = payload; })
      .addCase(fetchDailyVitalsReport.rejected, (state, { payload }) => { state.reportLoading = false; state.error = payload; });
  },
});

export const { clearNurseError, clearNurseSuccess, updateQueueItem } = nurseSlice.actions;
export default nurseSlice.reducer;
