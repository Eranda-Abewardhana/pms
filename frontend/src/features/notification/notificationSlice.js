import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchMyNotifications = createAsyncThunk(
  'notification/fetchMyNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/notifications');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    markAllRead: (state) => { state.unreadCount = 0; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (s) => { s.loading = true; })
      .addCase(fetchMyNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.notifications = a.payload.notifications;
        s.unreadCount = a.payload.unreadCount;
      })
      .addCase(fetchMyNotifications.rejected, (s) => { s.loading = false; });
  },
});

export const { markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
