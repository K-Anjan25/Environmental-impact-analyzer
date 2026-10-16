import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#204654', dark: '#173440', contrastText: '#ffffff' },
    secondary: { main: '#5d7163' },
    warning: { main: '#8a5a00' },
    text: { primary: '#17231f', secondary: '#60716a' },
    background: { default: '#F7F9E1', paper: '#ffffff' },
    divider: '#e5e9e4',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 650, letterSpacing: '-0.045em' },
    h2: { fontWeight: 650, letterSpacing: '-0.035em' },
    h3: { fontWeight: 650, letterSpacing: '-0.025em' },
    button: { fontWeight: 650, textTransform: 'none' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 44, boxShadow: 'none' },
        contained: { '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#fff' },
      },
    },
  },
});

export default theme;
