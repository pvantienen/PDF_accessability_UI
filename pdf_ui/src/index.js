import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Amplify} from 'aws-amplify';
// import awsExports from './aws-exports';

// Amplify.configure(awsExports);
Amplify.configure({
  Auth: {
    // The AWS region for your Cognito resources
    region: process.env.REACT_APP_AWS_REGION,

    // Your User Pool ID
    userPoolId: process.env.REACT_APP_USER_POOL_ID,

    // Your User Pool Client ID
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,

    // (Optional) Your Identity Pool ID if using Federated Identities for S3
    identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,

    // If you want to force users to sign in before accessing any AWS resources
    mandatorySignIn: true,

    // Configure Hosted UI
    oauth: {
      // For domain: if you used a "domain prefix" like 'pdf-ui-auth',
      // your Hosted UI would be 'pdf-ui-auth.auth.{region}.amazoncognito.com'.
      // If you store only the "pdf-ui-auth" in your env var, you need to build the full domain string:
      domain: process.env.REACT_APP_USER_POOL_DOMAIN,

      // Required scopes
      scope: ['openid', 'email', 'profile'],

      // Where Cognito should redirect after sign-in and sign-out
      // redirectSignIn: process.env.REACT_APP_AMPLIFY_APP_URL,
      // redirectSignOut: process.env.REACT_APP_AMPLIFY_APP_URL,

      // 'code' for Authorization code grant, 'token' for Implicit grant
      responseType: 'code',
    },
  },
  Storage: {
    AWSS3: {
      bucket: process.env.REACT_APP_BUCKET_NAME,
      region: process.env.REACT_APP_BUCKET_REGION,
    },
  },
});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
