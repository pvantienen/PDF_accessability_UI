import React from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

function LogoutPage() {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h5">
          You have been successfully logged out.
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default LogoutPage;
