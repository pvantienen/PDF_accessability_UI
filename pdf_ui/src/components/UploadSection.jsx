import React, { useState, useRef } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Box, Typography, TextField, Tooltip, IconButton, Snackbar, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { PDFDocument } from 'pdf-lib'; // Import from pdf-lib

function UploadSection({ onUploadComplete, awsCredentials }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset any existing error messages
    setErrorMessage('');

    if (file.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are allowed.');
      setOpenSnackbar(true);
      resetFileInput();
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25 MB limit.');
      setOpenSnackbar(true);
      resetFileInput();
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();

      if (numPages > 10) {
        setErrorMessage('PDF file cannot exceed 10 pages.');
        setOpenSnackbar(true);
        resetFileInput();
        return;
      }

      setSelectedFile(file);
    } catch (error) {
      console.error('Error reading PDF file:', error);
      setErrorMessage('Unable to read the PDF file.');
      setOpenSnackbar(true);
      resetFileInput();
    }
  };

  const resetFileInput = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file before uploading.');
      setOpenSnackbar(true);
      return;
    }
    if (!awsCredentials) {
      setErrorMessage('AWS credentials not available yet. Please wait...');
      setOpenSnackbar(true);
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
      resetFileInput();
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Error uploading file. Please try again.');
      setOpenSnackbar(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ color: '#333' }}>
            Upload Your PDF
          </Typography>
          <Tooltip title="Only PDF files allowed. Max size: 25 MB. Max pages: 10.">
            <IconButton>
              <InfoOutlined />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          inputRef={fileInputRef}
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

      {/* Snackbar for error messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

export default UploadSection;
