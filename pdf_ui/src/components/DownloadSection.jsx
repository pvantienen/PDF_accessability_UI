// DownloadSection.js
import React, { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { Button } from '@aws-amplify/ui-react'; // or replace with your preferred Button

// AWS SDK v3
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

    // Poll for file availability
    const checkFileAvailability = async () => {
      try {
        console.log(`Checking for file: result/COMPLIANT_${filename}`);

        // Create S3 client with credentials passed from parent
        const s3 = new S3Client({
          region,
          credentials: {
            accessKeyId: awsCredentials?.accessKeyId,
            secretAccessKey: awsCredentials?.secretAccessKey,
            sessionToken: awsCredentials?.sessionToken,
          },
        });

        // 1) HEAD request to see if the object is there
        await s3.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: `result/COMPLIANT_${filename}`,
          })
        );

        // 2) If it exists, generate a presigned GET URL
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: `result/COMPLIANT_${filename}`,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
        console.log('File is ready. Generated URL:', url);

        setDownloadUrl(url);
        setIsFileReady(true);

        // Let the parent (App.js) know the file is ready
        onFileReady();

        // Stop polling
        clearInterval(intervalId);
      } catch (error) {
        console.log(
          'File not ready or error fetching URL. Retrying in 15 seconds...',
          error
        );
      }
    };

    if (filename && !isFileReady) {
      intervalId = setInterval(checkFileAvailability, 15000);
    }

    return () => clearInterval(intervalId);
  }, [filename, isFileReady, onFileReady, awsCredentials]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      {!isFileReady ? (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          Note: Processing may take 3–15 minutes for files around 1–20 pages. Please be patient.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ marginBottom: 2 }}>
          Remediation complete! Click the button below to download. Then verify
          the remediation in the dashboard on the left navigation.
        </Alert>
      )}

      <Button
        fullWidth
        variation={isFileReady ? 'primary' : 'menu'}
        colorTheme={isFileReady ? 'success' : 'info'}
        size="large"
        isLoading={!isFileReady}
        loadingText={`Remediating ${filename}`}
        onClick={() => {
          if (isFileReady) {
            window.open(downloadUrl, '_blank');
          }
        }}
        isDisabled={!isFileReady}
      >
        Download Remediated {filename}
      </Button>
    </Box>
  );
}
