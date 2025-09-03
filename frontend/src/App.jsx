// App.jsx
import React, { useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from 'react-oidc-context';
import {isMaintenanceMode} from './utilities/constants.jsx';

import theme from './theme.jsx';
import { UserPoolClientId, HostedUIUrl, Authority, UserPoolId } from './utilities/constants.jsx';

import LandingPage from './pages/LandingPage.jsx';

import MainApp from './MainApp.jsx';
import CallbackPage from './pages/CallbackPage.jsx'; 
import MaintenancePage from './pages/MaintenancePage.jsx';

const cognitoAuthConfig = {
  authority: `https://${Authority}/${UserPoolId}`,
  client_id: UserPoolClientId,
  redirect_uri: `${HostedUIUrl}/callback`, // Amplify redirect_uri
  post_logout_redirect_uri: `${HostedUIUrl}/home`,
  // redirect_uri: 'http://localhost:3000/callback', // Local redirect_uri
  // post_logout_redirect_uri: 'http://localhost:3000/home',
  response_type: 'code',
  scope: 'email openid phone profile',
};

function AppRoutes() {
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (auth.isLoading) {
    return <div>Loading authentication status...</div>;
  }

  if (auth.error) {
    console.error('Authentication error:', auth.error);
    return <div>Authentication Error: {auth.error.message}</div>;
  }

  return (
    <Routes>
      {/* Landing / Public Routes */}
      <Route path="/home" element={<LandingPage />} />

      {/* Callback Route */}
      <Route path="/callback" element={<CallbackPage />} /> 

      {/* Protected App Routes */}
      <Route
        path="/app"
        element={
          auth.isAuthenticated ? (
            <MainApp
              isLoggingOut={isLoggingOut}
              setIsLoggingOut={setIsLoggingOut}
            />
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />

      {/* Fallback: redirect unknown paths to /home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      <ThemeProvider theme={theme}>
          {/* <AppRoutes /> */}
          {isMaintenanceMode ? <MaintenancePage /> : <AppRoutes />}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
