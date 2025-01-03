import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from 'react-oidc-context';

import theme from './theme';
import { UserPoolClientId, HostedUIUrl, Authority } from './utilities/constants';

import LandingPage from './pages/LandingPage';
import LogoutPage from './components/LogoutPage';
import MainApp from './MainApp';

const cognitoAuthConfig = {
  authority: `https://${Authority}`,       
  client_id: UserPoolClientId,            
  redirect_uri: `${HostedUIUrl}/app`,            
  post_logout_redirect_uri: `${HostedUIUrl}/home`, 
  response_type: 'code',
  scope: 'email openid phone profile',
};

function App() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <AuthProvider {...cognitoAuthConfig}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            {/* Landing / Public Routes */}
            <Route path="/home" element={<LandingPage />} />

            {/* Logout Route */}
            <Route
              path="/logout"
              element={<LogoutPage setIsLoggingOut={setIsLoggingOut} />}
            />

            {/* Protected App (all other routes go here) */}
            <Route
              path="/app/*"
              element={
                <MainApp
                  isLoggingOut={isLoggingOut}
                  setIsLoggingOut={setIsLoggingOut}
                />
              }
            />

            {/* Fallback: redirect unknown paths to /home */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
