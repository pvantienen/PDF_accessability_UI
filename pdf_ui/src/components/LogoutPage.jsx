// src/components/LogoutPage.js
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { useAuth } from 'react-oidc-context';

function LogoutPage({ setIsLoggingOut }) {
  const auth = useAuth();
  const [countdown, setCountdown] = useState(5); // Initialize countdown to 5 seconds

  useEffect(() => {
    // If countdown reaches zero, perform logout
    if (countdown === 0) {
      const performLogout = async () => {
        try {
          // Initiate sign-out process with Cognito
          await auth.signoutRedirect();
          // After initiating logout, reset the logout state
          setIsLoggingOut(false);
        } catch (error) {
          console.error('Error during sign out:', error);
          setIsLoggingOut(false); // Reset even if there's an error
        }
      };
      performLogout();
      return; // Exit early to prevent setting up another interval
    }

    // Set up interval to decrement countdown every second
    const timerId = setInterval(() => {
      setCountdown((prevCount) => prevCount - 1);
    }, 1000);

    // Clean up the interval on component unmount or when countdown changes
    return () => clearInterval(timerId);
  }, [countdown, auth, setIsLoggingOut]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          textAlign: 'center',
          backgroundColor: '#f4f6f8',
          padding: 2,
        }}
      >
        {countdown > 0 ? (
          <>
            <Typography variant="h5" gutterBottom>
              You will be logged out in {countdown} {countdown === 1 ? 'second' : 'seconds'}...
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Please wait while we log you out. You might see a error after 
            </Typography>
          </>
        ) : (
          <Typography variant="h5" gutterBottom>
            Logging out...
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default LogoutPage;
