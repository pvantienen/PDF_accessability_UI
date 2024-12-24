import React, { useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import ElapsedTimer from './components/ElapsedTimer';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Custom MUI theme

function App() {
  const auth = useAuth();

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedAt, setUploadedAt] = useState(null);
  const [isFileReady, setIsFileReady] = useState(false);

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

  // Handle loading and errors
  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountered error: {auth.error.message}</div>;
  }

  // AUTOMATIC REDIRECT if NOT authenticated
  if (!auth.isAuthenticated) {
    // Trigger sign-in redirect
    auth.signinRedirect();
    // Return null or a placeholder while redirect occurs
    return null;
  }

  // If authenticated, show the main application
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

            {/* Example sign-out buttons */}
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
