// src/pages/CallbackPage.jsx
import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      // After successful authentication, navigate to /app/dashboard or any default route
      navigate('/app/dashboard', { replace: true });
    } else if (!auth.isLoading && !auth.isAuthenticated) {
      // If authentication failed, navigate to /home
      navigate('/home', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  return <div>Processing authentication...</div>;
}

export default CallbackPage;
