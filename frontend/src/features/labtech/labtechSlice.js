import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as labtechApi from '../../api/labtechApi';

// ── Async Thunks ─────────────────────────────────────────────────

export const fetchLabStats = createAsyncThunk('labtech/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await labtechApi.getLabStats();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch lab stats');
  }
});

export const fetchLabRequests = createAsyncThunk('labtech/fetchRequests', async (params, { rejectWithValue }) => {
  try {
    const res = await labtechApi.getLabTests(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch lab requests');
  }
});

export const fetchLabTestDetails = createAsyncThunk('labtech/fetchDetails', async (id, { rejectWithValue }) => {
  try {
    const res = await labtechApi.getLabTestById(id);
    return res.data.test;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch test details');
  }
});

export const updateLabTestStatus = createAsyncThunk('labtech/updateStatus', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await labtechApi.updateLabTest(id, data);
    return res.data.test;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update lab test');
  }
});

export const uploadLabReport = createAsyncThunk('labtech/uploadReport', async ({ id, formData }, { rejectWithValue }) => {
  try {
    const res = await labtechApi.uploadLabReportFile(formData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Upload failed');
  }
});

// ── Slice ────────────────────────────────────────────────────────

const labtechSlice = createSlice({
  name: 'labtech',
  initialState: {
    stats: null,
    requests: { tests: [], total: 0, page: 1, totalPages: 1 },
    selectedTest: null,
    loading: false,
    detailsLoading: false,
    updateLoading: false,
    uploadLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearLabtechError: (state) => { state.error = null; },
    clearLabtechSuccess: (state) => { state.success = null; },
    clearSelectedTest: (state) => { state.selectedTest = null; },
  },
  extraReducers: (builder) => {
    // Stats
    builder
      .addCase(fetchLabStats.pending, (state) => { state.loading = true; })
      .addCase(fetchLabStats.fulfilled, (state, { payload }) => { state.loading = false; state.stats = payload; })
      .addCase(fetchLabStats.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Requests
    builder
      .addCase(fetchLabRequests.pending, (state) => { state.loading = true; })
      .addCase(fetchLabRequests.fulfilled, (state, { payload }) => { state.loading = false; state.requests = payload; })
      .addCase(fetchLabRequests.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Details
    builder
      .addCase(fetchLabTestDetails.pending, (state) => { state.detailsLoading = true; })
      .addCase(fetchLabTestDetails.fulfilled, (state, { payload }) => { state.detailsLoading = false; state.selectedTest = payload; })
      .addCase(fetchLabTestDetails.rejected, (state, { payload }) => { state.detailsLoading = false; state.error = payload; });

    // Update
    builder
      .addCase(updateLabTestStatus.pending, (state) => { state.updateLoading = true; })
      .addCase(updateLabTestStatus.fulfilled, (state, { payload }) => {
        state.updateLoading = false;
        state.success = 'Lab test updated successfully!';
        state.selectedTest = payload;
        // Update item in requests list
        const idx = state.requests.tests.findIndex(t => t._id === payload._id);
        if (idx !== -1) state.requests.tests[idx] = payload;
      })
    // Upload
    builder
      .addCase(uploadLabReport.pending, (state) => { state.uploadLoading = true; })
      .addCase(uploadLabReport.fulfilled, (state) => { state.uploadLoading = false; })
      .addCase(uploadLabReport.rejected, (state, { payload }) => { state.uploadLoading = false; state.error = payload; });
  },
});

export const { clearLabtechError, clearLabtechSuccess, clearSelectedTest } = labtechSlice.actions;
export default labtechSlice.reducer;
