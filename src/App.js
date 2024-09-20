import React, { useState } from 'react';
import { Container } from '@mui/material';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import {withAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleUploadComplete = (fileName) => {
    setUploadedFileName(fileName);
  };

  return (
      <div>
      <Header />
      <Container maxWidth="md" sx={{ marginTop: 4 }}>
          <UploadSection onUploadComplete={handleUploadComplete} />
      </Container>
      </div>
  );
}

export default withAuthenticator(App);
