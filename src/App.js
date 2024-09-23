import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';  // Import the theme
import { withAuthenticator } from '@aws-amplify/ui-react';  // AWS Amplify Authenticator

function App() {
  const [uploadedFileName, setUploadedFileName] = useState('');  // Track uploaded file name
  const [uploadedAt, setUploadedAt] = useState(null);  // Track when the file was uploaded
  const [isFileReady, setIsFileReady] = useState(false);  // Track if the file is ready for download

  // Function to handle when file upload is completed
  const handleUploadComplete = (fileName) => {
    console.log('Upload completed, file name:', fileName);  // Log the file name
    setUploadedFileName(fileName);  // Set uploaded file name in state
    setUploadedAt(Date.now());  // Record the time of the upload
    setIsFileReady(false);  // Reset file ready state
  };

  // Function to handle when file is ready for download
  const handleFileReady = () => {
    setIsFileReady(true);  // Set file ready state to true
  };

  return (
    <ThemeProvider theme={theme}>  {/* Wrap app in ThemeProvider to apply the theme */}
      <Box sx={{ display: 'flex', height: '100vh' }}>  {/* Main layout with flexbox */}
        {/* Left Navigation with timer */}
        <LeftNav uploadedAt={uploadedAt} isFileReady={isFileReady} />

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {/* App Header */}
          <Header />
          
          <Container maxWidth="md" sx={{ marginTop: 4 }}>
            {/* Upload Section */}
            <Box 
              sx={{ 
                textAlign: 'center', 
                padding: 4, 
                border: '1px dashed gray', 
                borderRadius: '8px', 
                marginBottom: 4, 
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="h5" gutterBottom>
                Upload Your PDF
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ marginBottom: 2 }}>
                Drag & drop your PDF file below, or click to select it.
              </Typography>

              {/* Pass the upload complete handler to UploadSection */}
              <UploadSection onUploadComplete={handleUploadComplete} />
            </Box>

            {/* Display Download Section when file is uploaded */}
            {uploadedFileName && (
              <Box sx={{ textAlign: 'center', marginTop: 4 }}>
                {/* Show download options when file is ready */}
                <DownloadSection filename={uploadedFileName} onFileReady={handleFileReady} />
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default withAuthenticator(App);  // Wrap the app with AWS Amplify Authenticator
