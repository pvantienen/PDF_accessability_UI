import React from 'react';
import { AppBar, Toolbar, Typography,Button } from '@mui/material';
import { useAuth } from 'react-oidc-context';

function Header() {
  const auth = useAuth();

  const handleSignOut = async () => {
    try {
      // Remove user from local session
      await auth.removeUser();

      // Option 1: Immediately redirect to your login page
      // If your app automatically intercepts unauthenticated
      // users and calls auth.signinRedirect(), this might be enough:
      auth.signinRedirect();

      // Option 2: If you want to sign out from Cognito fully, do:
      // const clientId = '2r4vl1l7nmkn0u7bmne4c3tve5';
      // const logoutUri = 'https://main.d3tdsepn39r5l1.amplifyapp.com'; // or your login page
      // const cognitoDomain = 'https://pdf-ui-auth.auth.us-east-1.amazoncognito.com';
      // window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;

    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };
  return (
  <AppBar position="static" color="default" role="banner" aria-label="Application Header">
    <Toolbar>
      <Typography variant="h6" component="h1" tabIndex="0">
        PDF Accessibility
      </Typography>
      <Button color="inherit" onClick={handleSignOut}>
          Sign Out
      </Button>
    </Toolbar>
  </AppBar>
);
}

export default Header;
