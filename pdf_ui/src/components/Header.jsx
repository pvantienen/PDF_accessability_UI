import React from 'react';
import { AppBar, Toolbar, Typography,Button } from '@mui/material';
import { useAuth } from 'react-oidc-context';

function Header() {
  const auth = useAuth();

  const handleSignOut = async () => {
    try {
      // 1) Remove local user session
      await auth.removeUser();

      // 2) Build Cognito logout URL
      // Make sure this logoutUri is registered in Cognito App Client -> Sign out URLs
      const clientId = '2r4vl1l7nmkn0u7bmne4c3tve5';
      const cognitoDomain = 'https://pdf-ui-auth.auth.us-east-1.amazoncognito.com';
      const logoutUri = 'https://main.d3tdsepn39r5l1.amplifyapp.com/logout'; 
        // or some custom route in your app

      // 3) Redirect to Cognito's logout page to kill the IdP session
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
      await auth.removeUser();
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
