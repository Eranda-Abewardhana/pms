import axios from 'axios';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Store injector — avoids circular dependency.
// store.js calls injectStore(store) after creating it.
let store;
export const injectStore = (_store) => {
  store = _store;
};

// Request Interceptor: attach JWT token from Redux state
axiosInstance.interceptors.request.use(
  (config) => {
    if (store) {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle 401 (auto-logout) and 500 (global error toast)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      
      if (status === 401) {
        // Prevent redirect loop if already on login page or if it's the login request itself
        const isLoginRequest = config.url.includes('/auth/login');
        const isLoginPage = window.location.pathname === '/login';

        if (!isLoginRequest && !isLoginPage) {
          if (store) {
            import('../features/auth/authSlice').then(({ logout }) => {
              store.dispatch(logout());
            });
          }
          window.location.href = '/login';
        }
      } else if (status === 500) {
        toast.error('A server error occurred. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.message);
      // This is common when the backend is down or CORS fails
      if (!window.navigator.onLine) {
        toast.error('No internet connection.');
      } else {
        toast.error('Cannot connect to the server. Please check if the backend is running.');
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
