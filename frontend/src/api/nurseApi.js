import axiosInstance from './axiosInstance';

// ── Dashboard Stats ──────────────────────────────────────────────
export const getNurseStats = () =>
  axiosInstance.get('/vitals/nurse/stats');

// ── Appointment Queue ────────────────────────────────────────────
export const getPatientQueue = (params = {}) =>
  axiosInstance.get('/appointments/today', { params });

export const updateAppointmentStatus = (id, status) =>
  axiosInstance.patch(`/appointments/${id}/status`, { status });

// ── Patients ─────────────────────────────────────────────────────
export const searchPatients = (params = {}) =>
  axiosInstance.get('/patients', { params });

export const getPatientById = (id) =>
  axiosInstance.get(`/patients/${id}`);

// ── Vitals ───────────────────────────────────────────────────────
export const recordVitals = (data) =>
  axiosInstance.post('/vitals', data);

export const getVitalsByPatient = (patientId) =>
  axiosInstance.get(`/vitals/patient/${patientId}`);

export const getVitalsByAppointment = (appointmentId) =>
  axiosInstance.get(`/vitals/appointment/${appointmentId}`);

export const getVitalsHistory = (params = {}) =>
  axiosInstance.get('/vitals/history', { params });

// ── EMR / Nursing Notes ──────────────────────────────────────────
export const getEMRByPatient = (patientId) =>
  axiosInstance.get(`/emr/patient/${patientId}`);

export const getEMRByAppointment = (appointmentId) =>
  axiosInstance.get(`/emr/appointment/${appointmentId}`);

// ── Lab Coordination ─────────────────────────────────────────────
export const createLabRequest = (data) =>
  axiosInstance.post('/lab', data);

export const getLabTests = (params = {}) =>
  axiosInstance.get('/lab', { params });

// ── Reports ──────────────────────────────────────────────────────
export const getDailyVitalsReport = (params = {}) =>
  axiosInstance.get('/vitals/report/daily', { params });
