import { getUrl } from 'aws-amplify/storage';
import { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
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
    <Box sx={{ textAlign: 'center', marginTop: 4 }}>
      {isFileReady ? (
        <>
          <Typography variant="h6" gutterBottom>
            Your file is ready for download:
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href={downloadUrl}  // Now passing the URL string instead of the object
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Remidiated {filename}
          </Button>
        </>
      ) : (
        <>{/* Important Note */}
        <Alert severity="info" sx={{ marginBottom: 2 }}>
        Note: Processing may take up to 2–10 minutes for files around 10–20 pages. Please be patient.
        </Alert>
        <Typography variant="body1" color="textSecondary">
          Remidiating the PDF...
        </Typography>
        </>
      )}
    </Box>
  );
};

export default DownloadSection;
