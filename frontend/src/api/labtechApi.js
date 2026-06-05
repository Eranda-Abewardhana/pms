import axiosInstance from './axiosInstance';

// ── Dashboard Stats ──────────────────────────────────────────────
export const getLabStats = () =>
  axiosInstance.get('/lab/stats').then((r) => r.data);

// ── Lab Requests ─────────────────────────────────────────────────
export const getLabTests = (params = {}) =>
  axiosInstance.get('/lab', { params }).then((r) => r.data);

export const getLabTestById = (id) =>
  axiosInstance.get(`/lab/${id}`).then((r) => r.data);

export const updateLabTest = (id, data) =>
  axiosInstance.put(`/lab/${id}`, data).then((r) => r.data);

// ── File Upload ──────────────────────────────────────────────────
export const uploadLabReportFile = (formData) =>
  axiosInstance.post('/lab/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

// ── Download Report (returns blob) ───────────────────────────────
export const downloadLabReportFile = (id) =>
  axiosInstance.get(`/lab/${id}/report-file`, { responseType: 'blob' }).then((r) => r.data);

