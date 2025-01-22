import { Card, CardContent, Typography, Box, Alert } from '@mui/material';
import { useState, useEffect } from 'react';

const ElapsedTimer = ({ isFileReady, uploadedAt }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNote, setShowNote] = useState(false); // New state to track if the note should be displayed

  useEffect(() => {
    if (!uploadedAt || isFileReady) return;

    const interval = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - uploadedAt) / 1000);
      setElapsedTime(timeElapsed);

      // Check if 15 minutes have passed (900 seconds)
      if (timeElapsed > 900) {
        setShowNote(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uploadedAt, isFileReady]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs} minutes`;
  };

  return (
    <Box sx={{ textAlign: 'center', marginTop: 2 }}>
      {uploadedAt ? (
        <>
          <Card
            elevation={3}
            sx={{
              padding: 2,
              backgroundColor: isFileReady ? '#e0f7e0' : '#f4f6f8', // Change background color to green when file is ready
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
            }}
          >
            <CardContent>
              {/* Conditionally render either "Time Elapsed Since Upload" or "Total Time For Remediation" */}
              <Typography
                variant="h6"
                sx={{
                  marginBottom: 1,
                  color: isFileReady ? 'green' : 'inherit', // Change text color to green when file is ready
                }}
              >
                {isFileReady ? 'Total Time Taken For Remediation' : 'Time Elapsed Since Upload'}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: isFileReady ? 'green' : 'textSecondary', // Change time color to green when file is ready
                }}
              >
                {formatTime(elapsedTime)}
              </Typography>
            </CardContent>
          </Card>

          {/* Show alert if more than 15 minutes have passed */}
          {showNote && (
            <Alert severity="warning" sx={{ marginTop: 2 }}>
              If remediation takes more than 15 minutes, Please try to refresh the page and re-upload the file. If it still doesn't work. Please checkout support resources.
            </Alert>
          )}
        </>
      ) : (
        <Typography variant="body1" color="textSecondary">
          No file uploaded yet.
        </Typography>
      )}
    </Box>
  );
};

export default ElapsedTimer;
