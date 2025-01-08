// FirstSignInDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';
import { useAuth } from 'react-oidc-context';

import {API_URL} from '../utilities/constants';
function FirstSignInDialog() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [organization, setOrganization] = useState('');

  // Check OIDC claim for "first_sign_in"
  const firstSignInClaim = auth.user?.profile?.['custom:first_sign_in'];

  useEffect(() => {
    if (auth.isAuthenticated && firstSignInClaim === 'true') {
      setOpen(true);
    }
  }, [auth.isAuthenticated, firstSignInClaim]);

  const handleSubmit = async () => {
    try {
      // 'sub' from ID token claims
      const userSub = auth.user?.profile?.sub;
      // Use either the ID token or Access token as your Bearer token
      const idToken = auth.user?.id_token;
  
      const bodyData = {
        sub: userSub,
        organization,
      };
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass the token in the Authorization header
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(bodyData),
      });
      console.log('response:', response);
      if (!response.ok) {
        const err = await response.json();
        console.error('Error from /update-attributes:', err);
        return;
      }
  
      console.log('Successfully updated Cognito attributes!');
      setOpen(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };
  
  // (If you want it "inescapable," don't provide a 'Cancel' button and disableEscapeKeyDown)
  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Welcome! Tell us about your organization.</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Since this is your first time signing in, please provide a few details.
        </Typography>
        <TextField
          fullWidth
          label="Organization"
          variant="outlined"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FirstSignInDialog;
