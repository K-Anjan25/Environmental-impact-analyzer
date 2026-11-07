import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1B4332', dark: '#143427', contrastText: '#FFFFFF' },
    secondary: { main: '#2D6A4F', contrastText: '#FFFFFF' },
    warning: { main: '#FFB703', contrastText: '#25332C' },
    error: { main: '#A63D40', contrastText: '#FFFFFF' },
    success: { main: '#2D6A4F', contrastText: '#FFFFFF' },
    text: { primary: '#24332B', secondary: '#58685E' },
    background: { default: '#FBFBF9', paper: '#FFFFFF' },
    divider: '#D8E4DB',
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontWeight: 750, letterSpacing: '-0.055em' },
    h2: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontWeight: 750, letterSpacing: '-0.045em' },
    h3: { fontWeight: 750, letterSpacing: '-0.025em' },
    button: { fontWeight: 800, textTransform: 'none' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
          border: '1px solid #B7CDBD',
          boxShadow: '0 4px 12px rgba(27, 67, 50, 0.08)',
          transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
        },
        contained: { backgroundColor: '#2D6A4F', color: '#FFFFFF', boxShadow: '0 6px 18px rgba(45, 106, 79, 0.18)' },
        outlined: { backgroundColor: '#FFFFFF', boxShadow: '0 3px 10px rgba(27, 67, 50, 0.06)' },
        text: { borderColor: 'transparent', backgroundColor: 'transparent', boxShadow: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: '#ffffff' },
        notchedOutline: { borderWidth: 1, borderColor: '#B7CDBD' },
      },
    },
  },
});

export default theme;
