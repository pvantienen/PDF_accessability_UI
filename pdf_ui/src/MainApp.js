// src/MainApp.js
import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import ElapsedTimer from './components/ElapsedTimer';
import theme from './theme';
import { Button } from '@mui/material';
// Import the CustomCredentialsProvider
import CustomCredentialsProvider from './utilities/CustomCredentialsProvider';

function MainApp({ isLoggingOut, setIsLoggingOut }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Store AWS credentials & upload states
  const [awsCredentials, setAwsCredentials] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedAt, setUploadedAt] = useState(null);
  const [isFileReady, setIsFileReady] = useState(false);

  // Fetch credentials once user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      (async () => {
        try {
          const token = auth.user?.id_token;
          const domain = 'cognito-idp.us-east-1.amazonaws.com/us-east-1_3uP3RsAjc';

          const customCredentialsProvider = new CustomCredentialsProvider();
          customCredentialsProvider.loadFederatedLogin({ domain, token });

          const { credentials: c, identityId } =
            await customCredentialsProvider.getCredentialsAndIdentityId();

          setAwsCredentials({
            accessKeyId: c.accessKeyId,
            secretAccessKey: c.secretAccessKey,
            sessionToken: c.sessionToken,
          });
        } catch (error) {
          console.error('Error fetching Cognito credentials:', error);
        }
      })();
    }
  }, [auth.isAuthenticated, auth.user]);

  // Handle events from child components
  const handleUploadComplete = (fileName) => {
    console.log('Upload completed, file name:', fileName);
    setUploadedFileName(fileName);
    setUploadedAt(Date.now());
    setIsFileReady(false);
  };

  const handleFileReady = () => {
    // When the DownloadSection confirms file is ready
    setIsFileReady(true);
  };

  const handleNewUpload = () => {
    // Reset all states to restart the process
    setUploadedFileName('');
    setUploadedAt(null);
    setIsFileReady(false);
  };

  const handleSignOut = async () => {
    try {
      // First remove the local user
      await auth.removeUser();

      setIsLoggingOut(true); // Update logout state
      navigate('/logout');    // Navigate to logout page
      // The actual signoutRedirect is handled in LogoutPage
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsLoggingOut(false); // Reset logout state in case of error
    }
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    if (auth.error.message.includes('No matching state found')) {
      console.log('Detected invalid or mismatched OIDC state. Redirecting to login...');
      auth.removeUser().then(() => {
        auth.signinRedirect(); // Force re-auth
      });
      return null;
    }
    return <div>Encountered error: {auth.error.message}</div>;
  }

  if (
    !auth.isAuthenticated &&
    location.pathname !== '/logout' &&
    !location.pathname.includes('logout') &&
    !isLoggingOut
  ) {
    auth.signinRedirect();
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNav />

        <Box sx={{ flexGrow: 1, padding: 3, backgroundColor: '#f4f6f8' }}>
          <Header handleSignOut={handleSignOut} />

          <Container maxWidth="lg" sx={{ marginTop: 4 }}>
            <Box
              sx={{
                textAlign: 'center',
                padding: 4,
                border: '1px dashed gray',
                borderRadius: '12px',
                marginBottom: 4,
                backgroundColor: '#fff',
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" gutterBottom>
                Upload PDF
              </Typography>
              <Typography
                variant="body1"
                color="textSecondary"
                sx={{ marginBottom: 2 }}
              >
                Drag & drop your PDF file below, or click to select it.
              </Typography>

              <UploadSection
                onUploadComplete={handleUploadComplete}
                awsCredentials={awsCredentials}
              />
              {uploadedFileName && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleNewUpload}
                  sx={{ marginTop: 2 }}
                >
                  Upload a New PDF
                </Button>
              )}
            </Box>

            <Box
              sx={{
                textAlign: 'center',
                padding: 4,
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                marginBottom: 4,
              }}
            >
              <ElapsedTimer uploadedAt={uploadedAt} isFileReady={isFileReady} />
            </Box>

            {uploadedFileName && (
              <Box
                sx={{
                  textAlign: 'center',
                  padding: 4,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
                  marginTop: 4,
                }}
              >
                <DownloadSection
                  filename={uploadedFileName}
                  onFileReady={handleFileReady}
                  awsCredentials={awsCredentials}
                />
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default MainApp;
