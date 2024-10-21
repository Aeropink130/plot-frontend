
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4e54c8',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8f94fb',
      contrastText: '#fff',
    },
    background: {
      default: 'linear-gradient(to bottom right, #4e54c8, #8f94fb)',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

export default theme;
