import React, { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Box, Typography, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab'; // Import LoadingButton for better progress display
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
function UploadSection({ onUploadComplete, awsCredentials }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

    setIsUploading(true);

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
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          textAlign: 'center',
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: '#333' }}>
          Upload Your PDF
        </Typography>
        <TextField
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          inputProps={{ style: { display: 'block', margin: '1rem auto' } }}
        />
        <LoadingButton
          variant="contained"
          color="primary"
          loading={isUploading}
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          sx={{
            marginTop: '1rem',
            backgroundColor: '#1976d2',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            transition: 'transform 0.3s',
            '&:hover': {
              backgroundColor: '#125b9d',
              transform: 'scale(1.05)',
            },
          }}
          loadingIndicator={
            <CircularProgress size={20} sx={{ color: 'white' }} />
          }
        >
          {isUploading ? 'Uploading...' : selectedFile ? `Upload ${selectedFile.name}` : 'Please Upload A PDF'}
        </LoadingButton>
      </Box>
    </motion.div>
  );
}

export default UploadSection;
