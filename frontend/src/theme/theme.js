import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#00C6B3',       // Teal accent
      light: '#33D4C5',
      dark: '#00A89A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF9F43',       // Orange accent
      light: '#FFB366',
      dark: '#E8891F',
      contrastText: '#ffffff',
    },
    error: {
      main: '#FF6B6B',
    },
    warning: {
      main: '#FF9F43',
    },
    info: {
      main: '#4B9EFF',
    },
    success: {
      main: '#00C6B3',
    },
    background: {
      default: mode === 'dark' ? '#0D1117' : '#F4F7FE',
      paper: mode === 'dark' ? '#1A2236' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#E8ECF4' : '#1B2559',
      secondary: mode === 'dark' ? '#8A94A6' : '#A3AED0',
    },
    divider: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  },

  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'dark' ? '#0D1117' : '#F4F7FE',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
        '*': {
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: mode === 'dark' ? '0 4px 16px rgba(0, 198, 179, 0.3)' : '0 4px 12px rgba(0, 198, 179, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
          boxShadow: mode === 'dark' ? '0 4px 24px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#131929' : '#FFFFFF',
          color: mode === 'dark' ? '#E8ECF4' : '#1B2559',
          borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: mode === 'dark' ? 'none' : '0 1px 12px rgba(0,0,0,0.06)',
          transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#161D2F' : '#FFFFFF',
          borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: mode === 'dark' ? 'none' : '2px 0 20px rgba(0,0,0,0.06)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
  },
});

export default getTheme;
