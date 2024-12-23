import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Amplify} from 'aws-amplify';
// import awsExports from './aws-exports';

// Amplify.configure(awsExports);
Amplify.configure({
  Storage: {
    AWSS3: {
      bucket: process.env.REACT_APP_BUCKET_NAME,
      region: process.env.REACT_APP_BUCKET_REGION,
    }
  }
  // using Cognito later, add Auth config here
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
