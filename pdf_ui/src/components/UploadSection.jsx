import React, { useState, useRef } from 'react';
import { useAuth } from 'react-oidc-context'; // to get user sub if needed
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Box, Typography, TextField, Tooltip, IconButton, Snackbar, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { PDFDocument } from 'pdf-lib';

import { region, Bucket, CheckAndIncrementQuota, isDemoMode } from '../utilities/constants';

function sanitizeFilename(filename) {
  // Normalize the filename to decompose accented characters
  const normalized = filename.normalize('NFD');
  // Remove combining diacritical marks
  const withoutDiacritics = normalized.replace(/[\u0300-\u036f]/g, '');
  // Remove any characters outside of the ISO-8859-1 range.
  // eslint-disable-next-line
  const sanitized = withoutDiacritics.replace(/[^\u0000-\u00FF]/g, '');
  // If the sanitized filename is empty, return a default value.
  return sanitized.trim() ? sanitized : 'default.pdf';
}


function UploadSection({ onUploadComplete, awsCredentials, currentUsage, maxFilesAllowed, maxPagesAllowed, maxSizeAllowedMB, onUsageRefresh, setUsageCount, isFileUploaded}) {
  const auth = useAuth();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset any existing error messages
    setErrorMessage('');

    // **1. Basic PDF Checks**
    if (file.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are allowed.');
      setOpenSnackbar(true);
      resetFileInput();
      return;
    }

    if (file.size > maxSizeAllowedMB * 1024 * 1024) {
      setErrorMessage(`File size exceeds the ${maxSizeAllowedMB} MB limit.`);
      setOpenSnackbar(true);
      resetFileInput();
      return;
    }

    // **2. Page Count Check with pdf-lib**
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();

      if (numPages > maxPagesAllowed) {
        setErrorMessage(`PDF file cannot exceed ${maxPagesAllowed} pages.`);
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
    // **1. Check if user has reached the upload limit**
    if (!isDemoMode && currentUsage >= maxFilesAllowed) {
      setErrorMessage('You have reached your upload limit. Please contact support for further assistance.');
      setOpenSnackbar(true);
      return;
    }

    // **2. Basic Guards**
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file before uploading.');
      setOpenSnackbar(true);
      return;
    }
    if (!isDemoMode && !awsCredentials) {
      setErrorMessage('AWS credentials not available yet. Please wait...');
      setOpenSnackbar(true);
      return;
    }

    // **3. Attempt to Increment Usage First**
    const userSub = auth.user?.profile?.sub;
    if (!isDemoMode && !userSub) {
      setErrorMessage('User identifier not found. Are you logged in?');
      setOpenSnackbar(true);
      return;
    }
    const idToken = auth.user?.id_token;
    setIsUploading(true);

    try {
      // **4. Call the Usage API to Increment**
      const usageRes = isDemoMode ? { ok: true, json: async () => ({ newCount: currentUsage + 1 }) } : await fetch(CheckAndIncrementQuota, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ sub: userSub, mode: 'increment' }),
      });

      if (!usageRes.ok) {
        // e.g., 403 if user at limit, or other error
        const errData = await usageRes.json();

        // **Dynamic Error Message Based on Status Code**
        const quotaExceeded = usageRes.status === 403; // Assuming 403 indicates quota limit
        const message = quotaExceeded
          ? 'You have reached the upload limit. Please contact support for further assistance.'
          : errData.message || 'An error occurred while checking your upload quota. Please try again later.';

        setErrorMessage(message);
        setOpenSnackbar(true);
        setIsUploading(false);
        return;
      }
      
      const usageData = await usageRes.json();
      const updatedUsage = usageData.newCount; // Updated usage count from the backend
      setUsageCount(updatedUsage);
      
      // **5. Proceed with S3 Upload**
      let client;
      if (!isDemoMode) {
        client = new S3Client({
          region,
          credentials: {
            accessKeyId: awsCredentials.accessKeyId,
            secretAccessKey: awsCredentials.secretAccessKey,
            sessionToken: awsCredentials.sessionToken,
          },
        });
      }

      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, ''); // YYYYMMDDTHHMMSS format
      const userEmail = auth.user?.profile?.email || 'user'; // Use email for unique filename, fallback to 'user'
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_'); // Replace non-alphanumerics with underscores
      const sanitizedFileName = sanitizeFilename(selectedFile.name) || 'default.pdf'; // Fallback to 'default.pdf' if sanitization fails 
      const uniqueFilename = `${sanitizedEmail}_${timestamp}_${sanitizedFileName}`; // Combined unique filename
      // const uniqueFilename = `${sanitizedEmail}_${timestamp}_${selectedFile.name}`; // Sanitized and unique filename

      const params = {
        Bucket,
        Key: `pdf/${uniqueFilename}`,
        Body: selectedFile,
      };

      if (!isDemoMode) {
        const command = new PutObjectCommand(params);
        await client.send(command);
      } else {
        await new Promise(r => setTimeout(r, 800));
      }

      // **6. Notify Parent of Completion**
      onUploadComplete(uniqueFilename,sanitizedFileName);

      // **7. Refresh Usage**
      if (onUsageRefresh) {
        onUsageRefresh();
      }

      // **8. Reset File Input**
      resetFileInput();
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Error uploading file. Please try again.');
      setOpenSnackbar(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };
  const FILENAME_THRESHOLD = 40; // Set the filename character limit

  // Function to truncate the filename if it exceeds the threshold
  const truncateFilename = (filename) => {
    if (filename.length > FILENAME_THRESHOLD) {
      const extensionIndex = filename.lastIndexOf('.');
      const extension = filename.substring(extensionIndex);
      const truncatedName = filename.substring(0, FILENAME_THRESHOLD - extension.length) + '...';
      return truncatedName + extension;
    }
    return filename;
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
          <Tooltip title="See Document Requirements in left navigation" placement="right">
            <IconButton aria-label="Document Requirements Info">
              <InfoOutlined />
            </IconButton>
          </Tooltip>
        </Box>
  
        <TextField
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          inputRef={fileInputRef}
          disabled={isFileUploaded}
          inputProps={{ style: { display: 'block', margin: '1rem auto' }, 'aria-label': 'PDF File Upload Input' }}
          sx={{ marginTop: '1rem' }}
        />
  
        <LoadingButton
          variant="contained"
          color="primary"
          loading={isUploading}
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
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
          loadingIndicator={<CircularProgress size={20} sx={{ color: 'white' }} />}
          aria-label="Upload PDF Button"
        >
          {isUploading
            ? 'Uploading...'
            : selectedFile
            ? `Upload ${truncateFilename(selectedFile.name)}`
            : 'Please Upload A PDF'}
        </LoadingButton>
      </Box>
  
      {/* Snackbar for error messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }} elevation={6} variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}

export default UploadSection;
