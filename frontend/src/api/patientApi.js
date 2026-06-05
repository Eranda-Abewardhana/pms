import axiosInstance from './axiosInstance';

export const getPatientStats = async () => {
  const response = await axiosInstance.get('/patients/me/stats');
  return response.data;
};

export const getMedicalHistory = async () => {
  const response = await axiosInstance.get('/patients/me/history');
  return response.data;
};
