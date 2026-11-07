import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', dark: '#1A1A1A', contrastText: '#FFFFFF' },
    secondary: { main: '#C8A2F3', contrastText: '#000000' },
    warning: { main: '#FFB86B', contrastText: '#000000' },
    error: { main: '#A92E63', contrastText: '#FFFFFF' },
    success: { main: '#4B704E', contrastText: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#1A1A1A' },
    background: { default: '#F7F1FF', paper: '#FFFFFF' },
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
        root: {
          borderRadius: 0,
          minHeight: 44,
          border: '3px solid #000000',
          boxShadow: '2px 2px 0 #000000',
          transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
        },
        contained: { backgroundColor: '#FFE15A', boxShadow: '4px 4px 0 #000000, 8px 8px 0 #C8A2F3' },
        outlined: { backgroundColor: '#FFFFFF', boxShadow: '2px 2px 0 #000000' },
        text: { borderColor: 'transparent', backgroundColor: 'transparent', boxShadow: 'none' },
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
