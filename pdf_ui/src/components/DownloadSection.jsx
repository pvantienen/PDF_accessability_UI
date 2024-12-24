import React, { useEffect, useState } from 'react';
import { Box, Alert, Button, Typography } from '@mui/material';
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    <Box sx={{ textAlign: 'center', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      {!isFileReady ? (
        <Alert severity="info">
          Note: Processing may take 3–15 minutes for files around 1–20 pages. Please be patient.
        </Alert>
      ) : (
        <Alert severity="success">
          Remediation complete! Click below to download your file.
        </Alert>
      )}
      <Button
        variant="contained"
        color={isFileReady ? 'success' : 'info'}
        onClick={() => isFileReady && window.open(downloadUrl, '_blank')}
        disabled={!isFileReady}
        sx={{ marginTop: '1rem' }}
      >
        {isFileReady ? `Download ${filename}` : `Remediating ${filename}`}
      </Button>
    </Box>
  );
}
