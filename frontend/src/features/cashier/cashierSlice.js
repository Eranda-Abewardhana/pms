import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cashierApi from '../../api/cashierApi';

// ── Async Thunks ─────────────────────────────────────────────────

export const fetchCashierStats = createAsyncThunk('cashier/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getCashierStats();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch stats');
  }
});

export const fetchWeeklyIncome = createAsyncThunk('cashier/fetchWeeklyIncome', async (_, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getWeeklyIncome();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch weekly income');
  }
});

export const fetchPendingPayments = createAsyncThunk('cashier/fetchPendingPayments', async (params, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getPendingPayments(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch pending payments');
  }
});

export const fetchPaymentHistory = createAsyncThunk('cashier/fetchPaymentHistory', async (params, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getPaymentHistory(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch payment history');
  }
});

export const fetchInvoiceById = createAsyncThunk('cashier/fetchInvoiceById', async (id, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getInvoiceById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch invoice');
  }
});

export const createInvoiceAction = createAsyncThunk('cashier/createInvoice', async (data, { rejectWithValue }) => {
  try {
    const res = await cashierApi.createInvoice(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create invoice');
  }
});

export const processPaymentAction = createAsyncThunk('cashier/processPayment', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await cashierApi.processPayment(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to process payment');
  }
});

export const fetchDailyIncomeReport = createAsyncThunk('cashier/fetchDailyReport', async (params, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getDailyIncomeReport(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch daily report');
  }
});

export const fetchTransactionAnalytics = createAsyncThunk('cashier/fetchAnalytics', async (params, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getTransactionAnalytics(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch analytics');
  }
});

export const fetchRevenueReport = createAsyncThunk('cashier/fetchRevenueReport', async (params, { rejectWithValue }) => {
  try {
    const res = await cashierApi.getRevenueReport(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch revenue report');
  }
});

export const verifyPatientPayments = createAsyncThunk('cashier/verifyPatientPayments', async (patientId, { rejectWithValue }) => {
  try {
    const res = await cashierApi.verifyPatientPayments(patientId);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Failed to verify payments');
  }
});

// ── Slice ────────────────────────────────────────────────────────

const cashierSlice = createSlice({
  name: 'cashier',
  initialState: {
    stats: null,
    weeklyIncome: [],
    pendingPayments: { invoices: [], total: 0, page: 1, totalPages: 1 },
    paymentHistory: { invoices: [], total: 0, page: 1, totalPages: 1 },
    selectedInvoice: null,
    dailyReport: [],
    analytics: null,
    revenueReport: [],
    createdInvoice: null,
    verification: null,
    loading: false,
    paymentsLoading: false,
    reportsLoading: false,
    createLoading: false,
    verifyLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearCashierError: (state) => { state.error = null; },
    clearCashierSuccess: (state) => { state.success = null; },
    clearCreatedInvoice: (state) => { state.createdInvoice = null; },
    clearSelectedInvoice: (state) => { state.selectedInvoice = null; },
    clearVerification: (state) => { state.verification = null; },
  },
  extraReducers: (builder) => {
    // Stats
    builder
      .addCase(fetchCashierStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCashierStats.fulfilled, (state, { payload }) => { state.loading = false; state.stats = payload; })
      .addCase(fetchCashierStats.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Weekly Income
    builder
      .addCase(fetchWeeklyIncome.pending, (state) => { state.loading = true; })
      .addCase(fetchWeeklyIncome.fulfilled, (state, { payload }) => { state.loading = false; state.weeklyIncome = payload; })
      .addCase(fetchWeeklyIncome.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Pending Payments
    builder
      .addCase(fetchPendingPayments.pending, (state) => { state.paymentsLoading = true; })
      .addCase(fetchPendingPayments.fulfilled, (state, { payload }) => { state.paymentsLoading = false; state.pendingPayments = payload; })
      .addCase(fetchPendingPayments.rejected, (state, { payload }) => { state.paymentsLoading = false; state.error = payload; });

    // Payment History
    builder
      .addCase(fetchPaymentHistory.pending, (state) => { state.paymentsLoading = true; })
      .addCase(fetchPaymentHistory.fulfilled, (state, { payload }) => { state.paymentsLoading = false; state.paymentHistory = payload; })
      .addCase(fetchPaymentHistory.rejected, (state, { payload }) => { state.paymentsLoading = false; state.error = payload; });

    // Invoice by ID
    builder
      .addCase(fetchInvoiceById.pending, (state) => { state.loading = true; })
      .addCase(fetchInvoiceById.fulfilled, (state, { payload }) => { state.loading = false; state.selectedInvoice = payload; })
      .addCase(fetchInvoiceById.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Create Invoice
    builder
      .addCase(createInvoiceAction.pending, (state) => { state.createLoading = true; state.error = null; state.success = null; })
      .addCase(createInvoiceAction.fulfilled, (state, { payload }) => {
        state.createLoading = false;
        state.createdInvoice = payload.invoice || payload;
        state.success = 'Invoice created successfully!';
      })
      .addCase(createInvoiceAction.rejected, (state, { payload }) => { state.createLoading = false; state.error = payload; });

    // Process Payment
    builder
      .addCase(processPaymentAction.pending, (state) => { state.loading = true; state.error = null; state.success = null; })
      .addCase(processPaymentAction.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.success = 'Payment processed successfully!';
        if (state.pendingPayments.invoices) {
          state.pendingPayments.invoices = state.pendingPayments.invoices.filter(
            (inv) => inv._id !== (payload?.invoice?._id || payload?._id)
          );
        }
      })
      .addCase(processPaymentAction.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });

    // Daily Report
    builder
      .addCase(fetchDailyIncomeReport.pending, (state) => { state.reportsLoading = true; })
      .addCase(fetchDailyIncomeReport.fulfilled, (state, { payload }) => { state.reportsLoading = false; state.dailyReport = payload; })
      .addCase(fetchDailyIncomeReport.rejected, (state, { payload }) => { state.reportsLoading = false; state.error = payload; });

    // Analytics
    builder
      .addCase(fetchTransactionAnalytics.pending, (state) => { state.reportsLoading = true; })
      .addCase(fetchTransactionAnalytics.fulfilled, (state, { payload }) => { state.reportsLoading = false; state.analytics = payload; })
      .addCase(fetchTransactionAnalytics.rejected, (state, { payload }) => { state.reportsLoading = false; state.error = payload; });

    // Revenue Report
    builder
      .addCase(fetchRevenueReport.pending, (state) => { state.reportsLoading = true; })
      .addCase(fetchRevenueReport.fulfilled, (state, { payload }) => { state.reportsLoading = false; state.revenueReport = payload; })
      .addCase(fetchRevenueReport.rejected, (state, { payload }) => { state.reportsLoading = false; state.error = payload; });

    // Payment Verification
    builder
      .addCase(verifyPatientPayments.pending, (state) => { state.verifyLoading = true; state.error = null; })
      .addCase(verifyPatientPayments.fulfilled, (state, { payload }) => { state.verifyLoading = false; state.verification = payload; })
      .addCase(verifyPatientPayments.rejected, (state, { payload }) => { state.verifyLoading = false; state.error = payload; });
  },
});

export const {
  clearCashierError,
  clearCashierSuccess,
  clearCreatedInvoice,
  clearSelectedInvoice,
  clearVerification,
} = cashierSlice.actions;

export default cashierSlice.reducer;
