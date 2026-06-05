import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import store from './app/store';
import getTheme from './theme/theme';
import i18n from './i18n';
import 'react-toastify/dist/ReactToastify.css';

const ThemeApp = () => {
  const mode = useSelector((state) => state.theme.mode);
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nextProvider i18n={i18n}>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </I18nextProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeApp />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
