import { getUrl } from 'aws-amplify/storage';
import { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// import awsconfig from '../aws-exports';  // Import the Amplify configuration
const bucketName = process.env.REACT_APP_BUCKET_NAME;
const region = process.env.REACT_APP_BUCKET_REGION;
const DownloadSection = ({ filename, onFileReady }) => {
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isFileReady, setIsFileReady] = useState(false);

  useEffect(() => {
    let intervalId;

    const checkFileAvailability = async () => {
      try {
        console.log(`Checking for file: result/COMPLIANT_${filename}`);
        
        // Attempt to generate a signed URL for the file in the S3 result folder
        const { url } = await getUrl({
          path: `result/COMPLIANT_${filename}`,
          options: {
            bucket: {
              bucketName: bucketName,
              region: region,
            },
            validateObjectExistence: true,
            expiresIn: 300,
          },
        });

        console.log('File is ready. Generated URL:', url);
        setDownloadUrl(url);
        setIsFileReady(true);
        onFileReady();

        clearInterval(intervalId);
      } catch (error) {
        console.log('File not ready or error fetching URL. Retrying in 15 seconds...', error);
      }
    };

    if (filename && !isFileReady) {
      intervalId = setInterval(checkFileAvailability, 15000);
    }

    return () => clearInterval(intervalId);
  }, [filename, isFileReady, onFileReady]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      {!isFileReady ? (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          Note: Processing may take 3–15 minutes for files around 1–20 pages. Please be patient.
        </Alert>
      ) : (
        <Box>
          <Alert severity="success" sx={{ marginBottom: 2 }}>
            Remediation complete! Once downloaded, verify the remediation using Check PDF accessibility in dashboard on the left navigation.
          </Alert>
        </Box>
      )}

      <Button
        fullWidth
        variation={isFileReady ? 'primary' : 'menu'}
        colorTheme={isFileReady ? 'success' : 'info'}
        size="large"
        isLoading={!isFileReady}
        loadingText={'Remediating ' + filename}
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
};

export default DownloadSection;
