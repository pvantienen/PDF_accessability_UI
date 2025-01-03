import React from 'react';
import { useAuth } from 'react-oidc-context';

function LandingPage() {
  const auth = useAuth();
  

  const signOutRedirect = () => {
    const clientId = "1k5187g7kmc08ahoms38pr4rm1";
    const logoutUri = "https://main.d25gib1ddei1ii.amplifyapp.com/home";
    const cognitoDomain = "https://pdf-ui-auth.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleSignIn = () => {
    // This will redirect to the Cognito Hosted UI for login
    auth.signinRedirect();
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Welcome to My PDF Accessibility App</h1>
      <p>Please sign in to continue.</p>
      <button onClick={handleSignIn}>Sign In</button>
      <button onClick={() => signOutRedirect()}>Sign out 2</button>
    </div>
  );
}

export default LandingPage;
