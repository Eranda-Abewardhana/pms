import axiosInstance from './axiosInstance';

// ── Dashboard Stats ──────────────────────────────────────────────
export const getCashierStats = () =>
  axiosInstance.get('/billing/stats').then(r => r.data);

export const getWeeklyIncome = () =>
  axiosInstance.get('/billing/weekly').then(r => r.data);

// ── Invoices / Pending Payments ──────────────────────────────────
export const getPendingPayments = (params = {}) =>
  axiosInstance.get('/billing', { params: { status: 'unpaid,partial,draft', ...params } }).then(r => r.data);

export const getPaymentHistory = (params = {}) =>
  axiosInstance.get('/billing', { params: { status: 'paid', ...params } }).then(r => r.data);

export const getInvoiceById = (id) =>
  axiosInstance.get(`/billing/${id}`).then(r => r.data);

export const createInvoice = (data) =>
  axiosInstance.post('/billing', data).then(r => r.data);

export const updateInvoice = (id, data) =>
  axiosInstance.put(`/billing/${id}`, data).then(r => r.data);

// ── Payment Processing ───────────────────────────────────────────
export const processPayment = (id, data) =>
  axiosInstance.post(`/billing/${id}/pay`, data).then(r => r.data);

// ── Reports ─────────────────────────────────────────────────────
export const getDailyIncomeReport = (params = {}) =>
  axiosInstance.get('/billing/daily-summary', { params }).then(r => r.data);

export const getTransactionAnalytics = (params = {}) =>
  axiosInstance.get('/billing/analytics', { params }).then(r => r.data);

export const getRevenueReport = (params = {}) =>
  axiosInstance.get('/reports/revenue', { params }).then(r => r.data);

// ── Payment Verification ─────────────────────────────────────────
export const verifyPatientPayments = (patientId) =>
  axiosInstance.get(`/billing/verify/${patientId}`).then(r => r.data);
