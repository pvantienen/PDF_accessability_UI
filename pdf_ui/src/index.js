// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "react-oidc-context";


const cognitoAuthConfig = {
  authority: "https://pdf-ui-auth.auth.us-east-1.amazoncognito.com",
  client_id: "2r4vl1l7nmkn0u7bmne4c3tve5",
  redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  post_logout_redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  response_type: "code",
  scope: "email openid phone profile",
  metadata: {
    end_session_endpoint: "https://pdf-ui-auth.auth.us-east-1.amazoncognito.com/oauth2/logout",
  },
};


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);

reportWebVitals();
