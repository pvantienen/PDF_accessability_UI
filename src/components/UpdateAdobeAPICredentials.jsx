import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const UpdateAdobeAPICredentials = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdate = async () => {
    setErrorMessage('');
    
    const payload = {
        client_id: clientId,
        client_secret: clientSecret
    };

    const apiUrl = process.env.REACT_APP_API_GATEWAY_INVOKE_URL;

    try {
        setLoading(true);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update credentials: ${errorText}`);
        }

        const result = await response.json();
        alert('Credentials successfully updated in AWS Secrets Manager!');
        
        // Clear the form fields after successful update
        setClientId('');
        setClientSecret('');

    } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Failed to update credentials: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Box sx={{ width: 250, margin: '0 auto', textAlign: 'center', padding: '20px' }}>
      <Typography variant="h6" gutterBottom>
        Adobe API Credentials
      </Typography>

      <TextField
        label="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        fullWidth
        sx={{ marginBottom: 2 }}
      />
      <TextField
        label="Client Secret"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        fullWidth
        type="password"
        sx={{ marginBottom: 2 }}
      />

      {errorMessage && (
        <Typography variant="body2" color="error" sx={{ marginBottom: 2 }}>
          {errorMessage}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdate}
        disabled={!clientId || !clientSecret || loading}
      >
        {loading ? 'Updating...' : 'Update'}
      </Button>
    </Box>
  );
};

export default UpdateAdobeAPICredentials;
