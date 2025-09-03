import { createTheme } from '@mui/material/styles';
import {
  PRIMARY_MAIN,
  SECONDARY_MAIN,
  CHAT_LEFT_PANEL_BACKGROUND,
  HEADER_BACKGROUND,
  primary_50
} from './utilities/constants.jsx';  // Import constants

const theme = createTheme({
  typography: {
    fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  palette: {
    primary: {
      main: PRIMARY_MAIN,
      50: primary_50,
    },
    secondary: {
      main: SECONDARY_MAIN,
    },
    background: {
      chatLeftPanel: CHAT_LEFT_PANEL_BACKGROUND,
      header: HEADER_BACKGROUND,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,  // Rounded corners for buttons
          textTransform: 'none',  // Disable text transform on buttons
        },
      },
    },
  },
});

export default theme;
