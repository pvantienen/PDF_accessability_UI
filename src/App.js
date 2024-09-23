import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import DownloadSection from './components/DownloadSection';
import LeftNav from './components/LeftNav';
import { withAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedAt, setUploadedAt] = useState(null); // Track when the file was uploaded
  const [isFileReady, setIsFileReady] = useState(false);

  // This function is called when the file upload is complete
  const handleUploadComplete = (fileName) => {
    console.log('Upload completed, file name:', fileName);  // Log the file name
    setUploadedFileName(fileName);  // Set the uploaded file name
    setUploadedAt(Date.now());  // Capture the time when the file was uploaded
    setIsFileReady(false);  // Reset the file ready state
  };

  // This function will be triggered when the download section finishes preparing the file
  const handleFileReady = () => {
    setIsFileReady(true);
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Left Navigation with timer */}
      <LeftNav uploadedAt={uploadedAt} isFileReady={isFileReady} />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
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
            {/* Pass the upload complete handler */}
            <UploadSection onUploadComplete={handleUploadComplete} />
          </Box>

          {/* Show Download Section once file is uploaded */}
          {uploadedFileName && (
            <Box sx={{ textAlign: 'center', marginTop: 4 }}>

              {/* Pass the uploaded file name and the callback to mark the file as ready */}
              <DownloadSection filename={uploadedFileName} onFileReady={handleFileReady} />
            </Box>
          )}
        </Container>
      </Box>
    </div>
  );
}

export default withAuthenticator(App);
