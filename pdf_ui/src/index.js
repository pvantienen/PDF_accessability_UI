// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from "react-oidc-context";


const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_3uP3RsAjc",
  client_id: "2r4vl1l7nmkn0u7bmne4c3tve5",
  redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  post_logout_redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  response_type: "code",
  scope: "email openid phone profile",
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);

reportWebVitals();
