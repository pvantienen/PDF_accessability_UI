import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav'; // Keep LeftNav
import ElapsedTimer from './components/ElapsedTimer'; // Import the ElapsedTimer component
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Import the theme
import { withAuthenticator } from '@aws-amplify/ui-react'; // AWS Amplify Authenticator
// import QueryCloudwatch from './components/QueryCloudwatch';

function App() {
  const [uploadedFileName, setUploadedFileName] = useState(''); // Track uploaded file name
  const [uploadedAt, setUploadedAt] = useState(null); // Track when the file was uploaded
  const [isFileReady, setIsFileReady] = useState(false); // Track if the file is ready for download

  // Function to handle when file upload is completed
  const handleUploadComplete = (fileName) => {
    console.log('Upload completed, file name:', fileName); // Log the file name
    setUploadedFileName(fileName); // Set uploaded file name in state
    setUploadedAt(Date.now()); // Record the time of the upload
    setIsFileReady(false); // Reset file ready state
  };

  // Function to handle when file is ready for download
  const handleFileReady = () => {
    setIsFileReady(true); // Set file ready state to true
  };

  return (
    <ThemeProvider theme={theme}> {/* Wrap app in ThemeProvider to apply the theme */}
      <Box sx={{ display: 'flex', minHeight: '100vh' }}> {/* Main layout with flexbox */}
        {/* Left Navigation */}
        <LeftNav />

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, padding: 3, backgroundColor: '#f4f6f8' }}> {/* Background and padding for better spacing */}
          {/* App Header */}
          <Header />

          <Container maxWidth="lg" sx={{ marginTop: 4 }}> {/* Adjust the maxWidth for wider layout */}
            {/* Upload Section */}
            <Box
              sx={{
                textAlign: 'center',
                padding: 4,
                border: '1px dashed gray',
                borderRadius: '12px',
                marginBottom: 4,
                backgroundColor: '#fff',
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', // Subtle shadow for better separation
              }}
            >
              <Typography variant="h5" gutterBottom>
                Upload PDF
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ marginBottom: 2 }}>
                Drag & drop your PDF file below, or click to select it.
              </Typography>

              {/* Pass the upload complete handler to UploadSection */}
              <UploadSection onUploadComplete={handleUploadComplete} />
            </Box>

            {/* Timer Section */}
            <Box
              sx={{
                textAlign: 'center',
                padding: 4,
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', // Subtle shadow
                marginBottom: 4,
              }}
            >
              <ElapsedTimer uploadedAt={uploadedAt} isFileReady={isFileReady} />
            </Box>
            {/* Display Download Section when file is uploaded */}
            {uploadedFileName && (
              <Box
                sx={{
                  textAlign: 'center',
                  padding: 4,
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', // Subtle shadow
                  marginTop: 4,
                }}
              >
                {/* <QueryCloudwatch /> */}
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
// export default withAuthenticator(App);
export default App; // Wrap the app with AWS Amplify Authenticator
