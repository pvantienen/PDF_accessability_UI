// App.jsx
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from 'react-oidc-context';

import theme from './theme';
import { UserPoolClientId, HostedUIUrl, Authority } from './utilities/constants';

import LandingPage from './pages/LandingPage';
import LogoutPage from './components/LogoutPage';
import MainApp from './MainApp';
import CallbackPage from './pages/CallbackPage'; // New Callback Component

const cognitoAuthConfig = {
  authority: `https://${Authority}`,
  client_id: UserPoolClientId,
  redirect_uri: `${HostedUIUrl}/app/callback`, // Updated redirect_uri
  post_logout_redirect_uri: `${HostedUIUrl}/home`,
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
      <Route path="/app/callback" element={<CallbackPage />} />

      {/* Logout Route */}
      <Route
        path="/logout"
        element={<LogoutPage setIsLoggingOut={setIsLoggingOut} />}
      />

      {/* Protected App Routes */}
      <Route
        path="/app/*"
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
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
