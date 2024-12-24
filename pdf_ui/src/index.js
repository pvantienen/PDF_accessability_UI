// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Amplify } from 'aws-amplify';
import { AuthProvider } from "react-oidc-context";
import CustomCredentialsProvider from './utilities/CustomCredentialsProvider';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_3uP3RsAjc",
  client_id: "2r4vl1l7nmkn0u7bmne4c3tve5",
  redirect_uri: "https://main.d3tdsepn39r5l1.amplifyapp.com",
  response_type: "code",
  scope: "email openid phone profile",
};
const customCredentialsProvider = new CustomCredentialsProvider();
// Amplify.configure({
//   Auth: {
//     // Supply the custom credentials provider to Amplify
//     credentialsProvider: customCredentialsProvider
//   },
// });

Amplify.configure({
  // Auth: {
  //   credentialsProvider: customCredentialsProvider
  // },
  Storage: {
    AWSS3: {
      bucket: "pdfaccessibility-pdfaccessibilitybucket149b7021e-wurx8blwem2d",
      region: "us-east-1",
    },
  },
});

// Amplify.configure({
//   Auth: {
//     Cognito: {
//       userPoolId: "us-east-1_3uP3RsAjc",
//       userPoolClientId: "2r4vl1l7nmkn0u7bmne4c3tve5",
//       identityPoolId: "us-east-1:cd7c74c3-2277-4791-98b4-5cce14e03081",
//       loginWith: {
//         email: true,
//       },
//       signUpVerificationMethod: "code",
//       userAttributes: {
//         email: {
//           required: true,
//         },
//         name: {
//           required: true,}
//       },
//       allowGuestAccess: true,
//       passwordFormat: {
//         minLength: 8,
//         requireLowercase: true,
//         requireUppercase: true,
//         requireNumbers: true,
//         requireSpecialCharacters: true,
//       },
//     },
//   },
// })

// Amplify.configure({
//   Auth: {
//     region: process.env.REACT_APP_AWS_REGION,
//     userPoolId: process.env.REACT_APP_USER_POOL_ID,
//     userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
//     identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
//     mandatorySignIn: true,
//     oauth: {
//       // Just the domain, no /login or query strings
//       domain: process.env.REACT_APP_USER_POOL_DOMAIN,

//       // Scopes required
//       scope: ['openid', 'email', 'profile'],

//       // These must match your Cognito App Client "Callback URLs" and "Sign out URLs"
//       redirectSignIn: process.env.REACT_APP_AMPLIFY_APP_URL,
//       redirectSignOut: process.env.REACT_APP_AMPLIFY_APP_URL,

//       // 'code' for Authorization Code Grant
//       responseType: 'code',
//     },
//   },
//   Storage: {
//     AWSS3: {
//       bucket: process.env.REACT_APP_BUCKET_NAME,
//       region: process.env.REACT_APP_BUCKET_REGION,
//     },
//   },
// });


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider {...cognitoAuthConfig}>
    <App />
  </AuthProvider>
);

reportWebVitals();
