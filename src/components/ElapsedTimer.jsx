import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

const ElapsedTimer = ({ isFileReady, uploadedAt }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!uploadedAt || isFileReady) return;  // Ensure that uploadedAt is valid and file isn't ready

    const interval = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - uploadedAt) / 1000); // Time in seconds
      setElapsedTime(timeElapsed);
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval when component unmounts
  }, [uploadedAt, isFileReady]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs} minutes`;
  };

  // Ensure the content passed to Box is a valid ReactNode (not null or undefined)
  return (
    <Box sx={{ textAlign: 'center', marginTop: 2 }}>
      {uploadedAt ? (  // Only render content if uploadedAt is valid
        <>
          <Typography variant="body1">
            Time Elapsed: {formatTime(elapsedTime)}
          </Typography>
          {isFileReady && (
            <Typography variant="body1" color="success.main">
              Total Time: {formatTime(elapsedTime)}
            </Typography>
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
