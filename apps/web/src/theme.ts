import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', dark: '#1A1A1A', contrastText: '#FFFFFF' },
    secondary: { main: '#FF8FC7', contrastText: '#000000' },
    warning: { main: '#FF9F47', contrastText: '#000000' },
    error: { main: '#B00020' },
    success: { main: '#5BE0A0', contrastText: '#000000' },
    text: { primary: '#000000', secondary: '#1A1A1A' },
    background: { default: '#FFF6E0', paper: '#FFFFFF' },
    divider: '#000000',
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.045em' },
    h2: { fontWeight: 900, letterSpacing: '-0.035em' },
    h3: { fontWeight: 900, letterSpacing: '-0.025em' },
    button: { fontWeight: 800, textTransform: 'none' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 0, minHeight: 44, border: '3px solid #000000', boxShadow: '4px 4px 0 #000000' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 0, backgroundColor: '#ffffff' },
        notchedOutline: { borderWidth: 2, borderColor: '#000000' },
      },
    },
  },
});

export default theme;
