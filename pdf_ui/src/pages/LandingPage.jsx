import React from 'react';
import { useAuth } from 'react-oidc-context';

function LandingPage() {
  const auth = useAuth();

  const handleSignIn = () => {
    // This will redirect to the Cognito Hosted UI for login
    auth.signinRedirect();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Welcome to My PDF Accessibility App</h1>
      <p>Please sign in to continue.</p>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}

export default LandingPage;
