import React, { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Box, Button, Typography, TextField } from '@mui/material';

function UploadSection({ onUploadComplete, awsCredentials }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file before uploading.');
      return;
    }
    if (!awsCredentials) {
      alert('AWS credentials not available yet. Please wait...');
      return;
    }
    try {
      const client = new S3Client({
        region: 'us-east-1',
        credentials: {
          accessKeyId: awsCredentials.accessKeyId,
          secretAccessKey: awsCredentials.secretAccessKey,
          sessionToken: awsCredentials.sessionToken,
        },
      });

      const params = {
        Bucket: 'pdfaccessibility-pdfaccessibilitybucket149b7021e-wurx8blwem2d',
        Key: `pdf/${selectedFile.name}`,
        Body: selectedFile,
      };

      const command = new PutObjectCommand(params);
      await client.send(command);

      onUploadComplete(selectedFile.name);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>
        Upload PDF
      </Typography>
      <TextField
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        inputProps={{ style: { display: 'block', marginBottom: '1rem' } }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile}
      >
        Upload to S3
      </Button>
    </Box>
  );
}

export default UploadSection;
