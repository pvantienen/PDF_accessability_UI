import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { useAuth } from 'react-oidc-context';

// Country/State/City data
import { Country, State, City } from 'country-state-city';

import { API_URL } from '../utilities/constants';

function FirstSignInDialog() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  // Controlled inputs
  const [organization, setOrganization] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Loading indicator for submission
  const [loading, setLoading] = useState(false);

  // Get all countries
  const allCountries = Country.getAllCountries();

  // States for the selected country
  const statesOfSelectedCountry = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.isoCode)
    : [];

  // Cities for the selected state
  const citiesOfSelectedState = selectedState
    ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
    : [];

  // Check OIDC claim for "first_sign_in"
  const firstSignInClaim = auth.user?.profile?.['custom:first_sign_in'];

  useEffect(() => {
    if (auth.isAuthenticated && firstSignInClaim === 'true') {
      setOpen(true);
    }
  }, [auth.isAuthenticated, firstSignInClaim]);

  // Check if form is valid (i.e., required fields are non-empty)
  const formIsValid = Boolean(
    organization.trim() &&
    selectedCountry &&
    selectedState &&
    selectedCity
  );

  const handleSubmit = async () => {
    // If it’s already loading, or the form isn’t valid, do nothing
    if (loading || !formIsValid) return;

    setLoading(true); // Start loading spinner

    try {
      const userSub = auth.user?.profile?.sub;
      const idToken = auth.user?.id_token;

      const bodyData = {
        sub: userSub,
        organization,
        country: selectedCountry.isoCode,
        state: selectedState.isoCode,
        city: selectedCity.name
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Error from /update-attributes:', err);
      } else {
        console.log('Successfully updated Cognito attributes!');
        setOpen(false);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Welcome! We just need a few more details.</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Thank you for signing up! Before you can access the app, please provide 
          us with a few additional details about yourself and your organization.
        </Typography>

        {/* ORGANIZATION */}
        <TextField
          fullWidth
          required
          label="Organization"
          placeholder="If you don't belong to an organization, please type N/A"
          variant="outlined"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          margin="normal"
        />

        {/* COUNTRY AUTOCOMPLETE */}
        <Autocomplete
          sx={{ mt: 2 }}
          value={selectedCountry}
          onChange={(event, newValue) => {
            setSelectedCountry(newValue);
            setSelectedState(null);
            setSelectedCity(null);
          }}
          options={allCountries}
          getOptionLabel={(option) => (option?.name ? option.name : '')}
          isOptionEqualToValue={(option, value) =>
            option.isoCode === value.isoCode
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Country"
              variant="outlined"
              required
            />
          )}
        />

        {/* STATE AUTOCOMPLETE */}
        <Autocomplete
          sx={{ mt: 2 }}
          value={selectedState}
          onChange={(event, newValue) => {
            setSelectedState(newValue);
            setSelectedCity(null);
          }}
          options={statesOfSelectedCountry}
          getOptionLabel={(option) => (option?.name ? option.name : '')}
          isOptionEqualToValue={(option, value) =>
            option.isoCode === value.isoCode
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="State"
              variant="outlined"
              required
            />
          )}
          disabled={!selectedCountry}
        />

        {/* CITY AUTOCOMPLETE */}
        <Autocomplete
          sx={{ mt: 2 }}
          value={selectedCity}
          onChange={(event, newValue) => setSelectedCity(newValue)}
          options={citiesOfSelectedState}
          getOptionLabel={(option) => (option?.name ? option.name : '')}
          isOptionEqualToValue={(option, value) =>
            option.name === value.name
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="City"
              variant="outlined"
              required
            />
          )}
          disabled={!selectedState}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formIsValid || loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FirstSignInDialog;
