import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import patientReducer from '../features/patient/patientSlice';
import appointmentReducer from '../features/appointment/appointmentSlice';
import adminReducer from '../features/admin/adminSlice';
import doctorReducer from '../features/doctor/doctorSlice';
import nurseReducer from '../features/nurse/nurseSlice';
import cashierReducer from '../features/cashier/cashierSlice';
import labtechReducer from '../features/labtech/labtechSlice';
import themeReducer from '../features/theme/themeSlice';
import notificationReducer from '../features/notification/notificationSlice';
import { injectStore } from '../api/axiosInstance';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    appointment: appointmentReducer,
    admin: adminReducer,
    doctor: doctorReducer,
    nurse: nurseReducer,
    cashier: cashierReducer,
    labtech: labtechReducer,
    theme: themeReducer,
    notification: notificationReducer,
  },
});

injectStore(store);

export default store;

