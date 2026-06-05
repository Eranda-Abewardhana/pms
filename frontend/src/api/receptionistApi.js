import axiosInstance from './axiosInstance';

// ─── Dashboard Stats ──────────────────────────────────────────────
export const getTodayAppointments = () =>
  axiosInstance.get('/appointments/today').then((r) => r.data);

export const getTodayPatientStats = () =>
  axiosInstance.get('/patients/stats/today').then((r) => r.data);

// ─── Patient Registration ─────────────────────────────────────────
export const registerPatient = (data) =>
  axiosInstance.post('/patients', data).then((r) => r.data);

// ─── Search / Browse Patients ─────────────────────────────────────
export const searchPatients = (params) =>
  axiosInstance.get('/patients', { params }).then((r) => r.data);

export const getPatientById = (id) =>
  axiosInstance.get(`/patients/${id}`).then((r) => r.data);

// ─── Doctors & Availability ───────────────────────────────────────
export const getDoctors = () =>
  axiosInstance.get('/users/doctors').then((r) => r.data);

export const getDoctorAvailability = (doctorId, date) =>
  axiosInstance
    .get('/appointments/availability', { params: { doctorId, date } })
    .then((r) => r.data);

// ─── Book Appointment ─────────────────────────────────────────────
export const createAppointment = (data) =>
  axiosInstance.post('/appointments', data).then((r) => r.data);
