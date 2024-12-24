// src/components/LogoutPage.js
import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { useAuth } from 'react-oidc-context';

function LogoutPage({ setIsLoggingOut }) {
  const auth = useAuth();

  useEffect(() => {

    // const performLogout = async () => {
    //   try {
    //     // Use the signoutRedirect method provided by react-oidc-context
    //     await auth.signoutRedirect();
    //     // After logout, reset the isLoggingOut state
    //     setIsLoggingOut(false);
    //   } catch (error) {
    //     console.error('Error during sign out:', error);
    //     setIsLoggingOut(false); // Reset even if there's an error
    //   }
    // };
    const idToken = localStorage.getItem('id_token');

    if (idToken) {
      // Cognito domain
      const domain = 'https://pdf-ui-auth.auth.us-east-1.amazoncognito.com';
      // Your Cognito App Client ID
      const clientId = '2r4vl1l7nmkn0u7bmne4c3tve5';
      // Must be a URL allowed in your Cognito "Sign Out URL(s)" settings
      const logoutUri = 'https://main.d3tdsepn39r5l1.amplifyapp.com/logout';

      // Build the Cognito sign-out URL with the ID token hint
      const signoutUrl = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
        logoutUri
      )}&id_token_hint=${idToken}`

    fetch(signoutUrl, {
      method: 'GET',
      // If you want to handle or inspect the redirect response:
      // redirect: 'follow'
    })
      .then((response) => {
        // Depending on your Cognito config, you may or may not get an HTTP 200 here
        console.log('Logout fetch completed. Response:', response);
      })
      .catch((error) => {
        console.error('Logout fetch error:', error);
      });
  }

    // performLogout();
  }, [auth, setIsLoggingOut]);

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
          You will been successfully logged out. Please ignore the error
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default LogoutPage;
