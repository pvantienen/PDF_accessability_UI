// src/MainApp.js
import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import ElapsedTimer from './components/ElapsedTimer';
import theme from './theme';
import AccessibilityChecker from './components/AccessibilityChecker';
import FirstSignInDialog from './components/FirstSignInDialog';

import { Authority, CheckAndIncrementQuota } from './utilities/constants';
import CustomCredentialsProvider from './utilities/CustomCredentialsProvider';

function MainApp({ isLoggingOut, setIsLoggingOut }) {
  const auth = useAuth();
  const navigate = useNavigate();

  // AWS & file states
  const [awsCredentials, setAwsCredentials] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [updatedFileName, setUpdatedFileName] = useState('');
  const [uploadedAt, setUploadedAt] = useState(null);
  const [isFileReady, setIsFileReady] = useState(false);
 
  // Control whether AccessibilityReport is open
  const [reportOpen, setReportOpen] = useState(false);

  // Centralized Usage State
  const [usageCount, setUsageCount] = useState(0);
  const [maxFilesAllowed, setMaxFilesAllowed] = useState(3); // Default value
  const [maxPagesAllowed, setMaxPagesAllowed] = useState(10); // Default value
  const [maxSizeAllowedMB, setMaxSizeAllowedMB] = useState(25); // Default value
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState('');

  // Fetch credentials once user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      (async () => {
        try {
          const token = auth.user?.id_token;
          const domain = Authority;

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

  // Monitor authentication status within MainApp
  useEffect(() => {
    if (!auth.isAuthenticated && !isLoggingOut) {
      // If user is not authenticated, redirect to /home
      navigate('/home', { replace: true });
    }
  }, [auth.isAuthenticated, isLoggingOut, navigate]);

  // FUNCTION: Fetch current usage from the backend (mode="check")
  const refreshUsage = async () => {
    if (!auth.isAuthenticated) return; // not logged in yet
    setLoadingUsage(true);
    setUsageError('');

    const userSub = auth.user?.profile?.sub;
    if (!userSub) {
      setUsageError('User identifier not found.');
      setLoadingUsage(false);
      return;
    }

    try {
      const res = await fetch(CheckAndIncrementQuota, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.user?.id_token}`
        },
        body: JSON.stringify({ sub: userSub, mode: 'check' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setUsageError(errData.message || 'Error fetching usage');
        setLoadingUsage(false);
        return;
      }

      const data = await res.json();
      setUsageCount(data.currentUsage ?? 0);
      setMaxFilesAllowed(data.maxFilesAllowed ?? 3);
      setMaxPagesAllowed(data.maxPagesAllowed ?? 10);
      setMaxSizeAllowedMB(data.maxSizeAllowedMB ?? 25);

    } catch (err) {
      setUsageError(`Failed to fetch usage: ${err.message}`);
    } finally {
      setLoadingUsage(false);
    }
  };

  // FUNCTION: Initialize limits from ID token
  const initializeLimitsFromProfile = () => {
    if (auth.isAuthenticated && auth.user?.profile) {
      const profile = auth.user.profile;

      const customMaxFiles = profile['custom:max_files_allowed'];
      const customMaxPages = profile['custom:max_pages_allowed'];
      const customMaxSizeMB = profile['custom:max_size_allowed_MB'];
      // console.log('Custom limits:', customMaxFiles, customMaxPages, customMaxSizeMB);
      if (customMaxFiles) setMaxFilesAllowed(parseInt(customMaxFiles, 10));
      if (customMaxPages) setMaxPagesAllowed(parseInt(customMaxPages, 10));
      if (customMaxSizeMB) setMaxSizeAllowedMB(parseInt(customMaxSizeMB, 10));
    }
  };

  // Call refreshUsage whenever the user becomes authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      initializeLimitsFromProfile();
      refreshUsage();
    }
  }, [auth.isAuthenticated]);

  // Handle events from child components
  const handleUploadComplete = (updated_filename, original_fileName) => {
    console.log('Upload completed, new file name:', updated_filename);
    console.log('Original file name:', original_fileName);

    setUploadedFileName(original_fileName);
    setUpdatedFileName(updated_filename);

    setUploadedAt(Date.now());
    setIsFileReady(false);

    // After a successful upload (and increment usage),
    // refresh usage so the new count shows up
    refreshUsage();
  };

  const handleFileReady = () => {
    setIsFileReady(true);
  };

  const handleNewUpload = () => {
    setUploadedFileName('');
    setUpdatedFileName('');
    setUploadedAt(null);
    setIsFileReady(false);
  };

  // Handle authentication loading and errors
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    // Example: handle "No matching state found" error
    if (auth.error.message.includes('No matching state found')) {
      console.log('Detected invalid or mismatched OIDC state. Redirecting to login...');
      auth.removeUser().then(() => {
        auth.signinRedirect();
      });
      return null;
    }
    return <div>Encountered error: {auth.error.message}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNav />

        <Box sx={{ flexGrow: 1, padding: 3, backgroundColor: '#f4f6f8' }}>
          <Header
            handleSignOut={() => auth.removeUser()}
            usageCount={usageCount}
            refreshUsage={refreshUsage}
            usageError={usageError}
            loadingUsage={loadingUsage}
            maxFilesAllowed={maxFilesAllowed}
          />

          <FirstSignInDialog />

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
                Remediate a PDF document
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
              currentUsage={usageCount}
              maxFilesAllowed={maxFilesAllowed}
              maxPagesAllowed={maxPagesAllowed}
              maxSizeAllowedMB={maxSizeAllowedMB}
              onUsageRefresh={refreshUsage}
              setUsageCount={setUsageCount}
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
                  originalFileName={uploadedFileName}
                  updatedFilename={updatedFileName}
                  onFileReady={handleFileReady}
                  awsCredentials={awsCredentials}
                />
                <AccessibilityChecker
                  open={reportOpen}
                  onClose={() => setReportOpen(false)}
                  originalFileName={uploadedFileName}
                  updatedFilename={updatedFileName}
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
