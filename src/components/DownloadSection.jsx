import { getUrl } from 'aws-amplify/storage';
import { useEffect, useState } from 'react';
import { Box, Alert } from '@mui/material';  
import { Button } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsconfig from '../aws-exports';  // Import the Amplify configuration

const bucketName = awsconfig.aws_user_files_s3_bucket;  // Get the bucket name

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
          path: `result/COMPLIANT_${filename}`,  // Dynamically use the filename
          options: {
            bucket: {
              bucketName: bucketName,  // Bucket name
              region: 'us-east-1',  // Ensure the correct region is provided
            },
            validateObjectExistence: true,  // Only generate if the file exists
            expiresIn: 300,  // Signed URL expires in 5 minutes (300 seconds)
          },
        });

        console.log('File is ready. Generated URL:', url);
        setDownloadUrl(url);  // Save the URL to state
        setIsFileReady(true);  // Mark the file as ready
        onFileReady();  // Notify the parent component that the file is ready

        clearInterval(intervalId);  // Stop checking once the file is found
      } catch (error) {
        console.log('File not ready or error fetching URL. Retrying in 15 seconds...', error);
        // Continue checking every 15 seconds until the file is available
      }
    };

    // Start checking for the file every 15 seconds, but only if the file is not ready
    if (filename && !isFileReady) {
      intervalId = setInterval(checkFileAvailability, 15000);  // Poll every 15 seconds
    }

    return () => clearInterval(intervalId);  // Cleanup the interval on component unmount
  }, [filename, isFileReady, onFileReady]);

  return (
    <Box sx={{ textAlign: 'center' }}>
      {!isFileReady && (  // Only show the Alert while the file is processing
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          Note: Processing may take 3–15 minutes for files around 1–20 pages. Please be patient.
        </Alert>
      )}

      <Button
        fullWidth  // Amplify UI prop to make button full width
        variation={isFileReady ? 'primary' : 'menu'}  // 'primary' when ready, 'menu' while processing
        colorTheme={isFileReady ? 'success' : 'info'}  // Change color based on file readiness
        size="large"
        isLoading={!isFileReady}  // Show loading spinner while checking file
        loadingText={'Remediating ' + filename}
        onClick={() => {
          if (isFileReady) {
            window.open(downloadUrl, '_blank');  // Open file in new tab when ready
          }
        }}
        isDisabled={!isFileReady}  // Disable the button until the file is ready
      >
        Download Remediated {filename} 
      </Button>
    </Box>
  );
};

export default DownloadSection;
