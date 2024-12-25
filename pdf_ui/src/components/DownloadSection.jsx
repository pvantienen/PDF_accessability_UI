import React, { useEffect, useState } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { motion } from 'framer-motion';
import { LoadingButton } from '@mui/lab'; // Importing LoadingButton from MUI Lab

const bucketName = process.env.REACT_APP_BUCKET_NAME;
const region = process.env.REACT_APP_BUCKET_REGION;

export default function DownloadSection({ filename, onFileReady, awsCredentials }) {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isFileReady, setIsFileReady] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkFileAvailability = async () => {
      try {
        const s3 = new S3Client({
          region,
          credentials: {
            accessKeyId: awsCredentials?.accessKeyId,
            secretAccessKey: awsCredentials?.secretAccessKey,
            sessionToken: awsCredentials?.sessionToken,
          },
        });

        await s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: `result/COMPLIANT_${filename}`,
          })
        );

        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: `result/COMPLIANT_${filename}`,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 300 });

        setDownloadUrl(url);
        setIsFileReady(true);
        onFileReady();
        clearInterval(intervalId);
      } catch (error) {
        console.log('File not ready. Retrying...', error);
      }
    };

    if (filename && !isFileReady) {
      intervalId = setInterval(checkFileAvailability, 15000);
    }

    return () => clearInterval(intervalId);
  }, [filename, isFileReady, onFileReady, awsCredentials]);

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
          margin: '2rem auto',
        }}
      >
        <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
          {isFileReady ? `File Ready: ${filename}` : `Processing File: ${filename}`}
        </Typography>
        {!isFileReady ? (
          <Alert severity="info" sx={{ marginBottom: '1rem' }}>
            Processing your file. This may take a few minutes. Please be patient.
          </Alert>
        ) : (
          <Alert severity="success" sx={{ marginBottom: '1rem' }}>
            Remediation complete! Your file is ready.
          </Alert>
        )}
        <LoadingButton
          variant="contained"
          color="primary"
          loading={!isFileReady}
          loadingIndicator={
            <CircularProgress size={20} sx={{ color: 'white' }} />
          }
          disabled={!isFileReady}
          onClick={() => isFileReady && window.open(downloadUrl, '_blank')}
          sx={{
            backgroundColor: isFileReady ? '#4caf50' : '#b0bec5',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            transition: 'transform 0.3s',
            cursor: isFileReady ? 'pointer' : 'not-allowed',
            '&:hover': {
              backgroundColor: isFileReady ? '#388e3c' : '#b0bec5',
            },
          }}
        >
          {isFileReady ? `Download Remediated ${filename}` : `Remediating: ${filename}`}
        </LoadingButton>
      </Box>
    </motion.div>
  );
}
