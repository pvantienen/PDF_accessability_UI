import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Link } from '@mui/material';

const UpdateAdobeAPICredentials = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFields, setShowFields] = useState(false);

  useEffect(() => {
    // Delay the rendering of the input fields
    setTimeout(() => {
      setShowFields(true);
    }, 100);
  }, []);

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

        // Since CORS allows access to response, handle it correctly
        if (!response.ok) {
            const errorText = await response.text(); // Get error message from the server
            throw new Error(`Failed to update credentials: ${errorText}`);
        }

        const result = await response.json();
        alert('Credentials successfully updated in AWS Secrets Manager!');
        
    } catch (error) {
        console.error('Error:', error);
        setErrorMessage('Failed to update credentials: ' + error.message);
    } finally {
        setLoading(false);
    }
  };
  
  const handleFocus = (e) => {
    e.target.removeAttribute('readonly');
  };

  return (
    <Box
      sx={{
        width: 250,
        margin: '0 auto',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Adobe API Credentials
      </Typography>

      {/* Link to Adobe Credentials Documentation */}
      <Link
        href="https://acrobatservices.adobe.com/dc-integration-creation-app-cdn/main.html?api=pdf-services-api"
        target="_blank"
        rel="noopener"
        sx={{ display: 'block', marginBottom: 2 }}
      >
        Click here to get Adobe API credentials and usage
      </Link>

      <form autoComplete="off">
        {/* Hidden dummy inputs to absorb autofill */}
        <input
          type="text"
          name="fakeUsername"
          style={{ display: 'none' }}
        />
        <input
          type="password"
          name="fakePassword"
          style={{ display: 'none' }}
        />

        {showFields && (
          <>
            <TextField
              label="Client ID"
              name="clientIdField"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              fullWidth
              autoComplete="nope"
              onFocus={handleFocus}
              InputProps={{
                readOnly: true,
              }}
              sx={{ marginBottom: 2 }}
            />
            <TextField
              label="Client Secret"
              name="clientSecretField"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              fullWidth
              onFocus={handleFocus}
              InputProps={{
                readOnly: true,
              }}
              sx={{ marginBottom: 2 }}
            />
          </>
        )}

        {errorMessage && (
          <Typography
            variant="body2"
            color="error"
            sx={{ marginBottom: 2 }}
          >
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
      </form>
    </Box>
  );
};

export default UpdateAdobeAPICredentials;
