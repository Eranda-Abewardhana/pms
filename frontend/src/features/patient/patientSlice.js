import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

// ── Lab Results ──────────────────────────────────────────────────
export const fetchMyLabResults = createAsyncThunk(
  'patient/fetchMyLabResults',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/lab/my-results');
      return res.data.data.tests;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch lab results');
    }
  }
);

// ── Invoices ─────────────────────────────────────────────────────
export const fetchMyInvoices = createAsyncThunk(
  'patient/fetchMyInvoices',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/billing/my');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch invoices');
    }
  }
);

// ── Feedbacks ─────────────────────────────────────────────────────
export const fetchMyFeedbacks = createAsyncThunk(
  'patient/fetchMyFeedbacks',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/feedback/my');
      return res.data.data.feedbacks;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch feedbacks');
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'patient/submitFeedback',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/feedback', payload);
      return res.data.data.feedback;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit feedback');
    }
  }
);

// ── Doctors for booking ──────────────────────────────────────────
export const fetchDoctors = createAsyncThunk(
  'patient/fetchDoctors',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/users/doctors');
      return res.data.data.doctors;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch doctors');
    }
  }
);

// ── Own Patient Profile ─────────────────────────────────────────
export const fetchMyProfile = createAsyncThunk(
  'patient/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/patients/me');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Patient profile not found');
    }
  }
);

// ── Book Appointment ─────────────────────────────────────────────
export const bookAppointment = createAsyncThunk(
  'patient/bookAppointment',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/appointments', payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to book appointment');
    }
  }
);

// ── Doctor Availability ─────────────────────────────────────────
export const fetchAvailability = createAsyncThunk(
  'patient/fetchAvailability',
  async ({ doctorId, date }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/appointments/availability?doctorId=${doctorId}&date=${date}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch availability');
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────
const patientSlice = createSlice({
  name: 'patient',
  initialState: {
    myProfile: null,
    profileLoading: false,

    labResults: [],
    labLoading: false,
    labError: null,

    invoices: [],
    invoicesLoading: false,
    invoicesError: null,

    feedbacks: [],
    feedbackLoading: false,
    feedbackSubmitting: false,
    feedbackError: null,

    doctors: [],
    doctorsLoading: false,

    availability: { availableSlots: [], bookedSlots: [] },
    availabilityLoading: false,

    bookingLoading: false,
    bookingSuccess: false,
    bookingError: null,
  },
  reducers: {
    clearBookingState: (state) => {
      state.bookingSuccess = false;
      state.bookingError = null;
    },
    clearFeedbackError: (state) => {
      state.feedbackError = null;
    },
  },
  extraReducers: (builder) => {
    // My profile
    builder
      .addCase(fetchMyProfile.pending,   (s) => { s.profileLoading = true; })
      .addCase(fetchMyProfile.fulfilled, (s, a) => { s.profileLoading = false; s.myProfile = a.payload; })
      .addCase(fetchMyProfile.rejected,  (s) => { s.profileLoading = false; });

    // Lab results
    builder
      .addCase(fetchMyLabResults.pending,   (s) => { s.labLoading = true;  s.labError = null; })
      .addCase(fetchMyLabResults.fulfilled, (s, a) => { s.labLoading = false; s.labResults = a.payload; })
      .addCase(fetchMyLabResults.rejected,  (s, a) => { s.labLoading = false; s.labError = a.payload; });

    // Invoices
    builder
      .addCase(fetchMyInvoices.pending,   (s) => { s.invoicesLoading = true;  s.invoicesError = null; })
      .addCase(fetchMyInvoices.fulfilled, (s, a) => { s.invoicesLoading = false; s.invoices = a.payload; })
      .addCase(fetchMyInvoices.rejected,  (s, a) => { s.invoicesLoading = false; s.invoicesError = a.payload; });

    // Feedbacks
    builder
      .addCase(fetchMyFeedbacks.pending,   (s) => { s.feedbackLoading = true; })
      .addCase(fetchMyFeedbacks.fulfilled, (s, a) => { s.feedbackLoading = false; s.feedbacks = a.payload; })
      .addCase(fetchMyFeedbacks.rejected,  (s) => { s.feedbackLoading = false; });

    builder
      .addCase(submitFeedback.pending,   (s) => { s.feedbackSubmitting = true; s.feedbackError = null; })
      .addCase(submitFeedback.fulfilled, (s, a) => { s.feedbackSubmitting = false; s.feedbacks.unshift(a.payload); })
      .addCase(submitFeedback.rejected,  (s, a) => { s.feedbackSubmitting = false; s.feedbackError = a.payload; });

    // Doctors
    builder
      .addCase(fetchDoctors.pending,   (s) => { s.doctorsLoading = true; })
      .addCase(fetchDoctors.fulfilled, (s, a) => { s.doctorsLoading = false; s.doctors = a.payload; })
      .addCase(fetchDoctors.rejected,  (s) => { s.doctorsLoading = false; });

    // Availability
    builder
      .addCase(fetchAvailability.pending,   (s) => { s.availabilityLoading = true; })
      .addCase(fetchAvailability.fulfilled, (s, a) => { s.availabilityLoading = false; s.availability = a.payload; })
      .addCase(fetchAvailability.rejected,  (s) => { s.availabilityLoading = false; });

    // Book appointment
    builder
      .addCase(bookAppointment.pending,   (s) => { s.bookingLoading = true; s.bookingSuccess = false; s.bookingError = null; })
      .addCase(bookAppointment.fulfilled, (s) => { s.bookingLoading = false; s.bookingSuccess = true; })
      .addCase(bookAppointment.rejected,  (s, a) => { s.bookingLoading = false; s.bookingError = a.payload; });
  },
});

export const { clearBookingState, clearFeedbackError } = patientSlice.actions;
export default patientSlice.reducer;
