import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import ElapsedTimer from './components/ElapsedTimer';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

// 1) Import the CustomCredentialsProvider
import CustomCredentialsProvider from './utilities/CustomCredentialsProvider';

function App() {
  const auth = useAuth();

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedAt, setUploadedAt] = useState(null);
  const [isFileReady, setIsFileReady] = useState(false);
  
  // 2) Unconditional useEffect
  useEffect(() => {
    // We only want to fetch credentials if the user is authenticated
    if (auth.isAuthenticated) {
      (async () => {
        try {
          // For OIDC, 'auth.user' typically has id_token, access_token, etc.
          const token = auth.user?.id_token; 
          // Construct the domain for your Cognito user pool 
          const domain = 'cognito-idp.us-east-1.amazonaws.com/us-east-1_3uP3RsAjc';
          
          const customCredentialsProvider = new CustomCredentialsProvider();
          customCredentialsProvider.loadFederatedLogin({ domain, token });

          const credentials = await customCredentialsProvider.getCredentialsAndIdentityId();
          console.log('[DEBUG] Cognito credentials:', credentials);
          Amplify.configure({
            Auth: {
              credentialsProvider: customCredentialsProvider
            },
            Storage: {
              AWSS3: {
                bucket: "pdfaccessibility-pdfaccessibilitybucket149b7021e-wurx8blwem2d",
                region: "us-east-1",
              },
            },
          });
        } catch (error) {
          console.error('Error fetching Cognito credentials:', error);
        }
      })();
    }
  }, [auth.isAuthenticated, auth.user]);

  // 3) Now do your gating/conditional returns AFTER the effect is declared
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountered error: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    auth.signinRedirect();
    return null;
  }

  const handleUploadComplete = (fileName) => {
    console.log('Upload completed, file name:', fileName);
    setUploadedFileName(fileName);
    setUploadedAt(Date.now());
    setIsFileReady(false);
  };

  const handleFileReady = () => {
    setIsFileReady(true);
  };

  const signOutRedirect = () => {
    const clientId = '2r4vl1l7nmkn0u7bmne4c3tve5'; 
    const logoutUri = 'https://main.d3tdsepn39r5l1.amplifyapp.com';
    const cognitoDomain = 'https://pdf-ui-auth.auth.us-east-1.amazoncognito.com';

    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNav />

        <Box sx={{ flexGrow: 1, padding: 3, backgroundColor: '#f4f6f8' }}>
          <Header />

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
              <Typography variant="body1" color="textSecondary" sx={{ marginBottom: 2 }}>
                Drag & drop your PDF file below, or click to select it.
              </Typography>

              <UploadSection onUploadComplete={handleUploadComplete} />
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
                <DownloadSection filename={uploadedFileName} onFileReady={handleFileReady} />
              </Box>
            )}

            <Box sx={{ marginTop: 4, textAlign: 'center' }}>
              <button onClick={() => auth.removeUser()}>Sign Out (Local)</button>
              &nbsp;&nbsp;
              <button onClick={signOutRedirect}>Sign Out (Redirect)</button>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
