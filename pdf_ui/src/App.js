// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, redirect } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider } from "react-oidc-context";
import MainApp from './MainApp';
import LogoutPage from './components/LogoutPage';
import {UserPoolClientId,HostedUIUrl,Authority} from './utilities/constants';

const cognitoAuthConfig = {
  // authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_3uP3RsAjc",
  // client_id: "2r4vl1l7nmkn0u7bmne4c3tve5",
  // redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  // post_logout_redirect_uri: "https://google.com",
  authority: `https://${Authority}`,
  client_id: UserPoolClientId,
  redirect_uri: HostedUIUrl,
  post_logout_redirect_uri: HostedUIUrl,
  response_type: "code",
  scope: "email openid phone profile",
};

function App() {
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Elevated state

  return (
    <AuthProvider {...cognitoAuthConfig}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            {/* Public Route for Logout */}
            <Route 
              path="/logout" 
              element={
                <LogoutPage setIsLoggingOut={setIsLoggingOut} />
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="*" 
              element={
                <MainApp 
                  isLoggingOut={isLoggingOut} 
                  setIsLoggingOut={setIsLoggingOut} 
                />
              } 
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
