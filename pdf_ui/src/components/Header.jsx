// src/components/Header.js
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  LinearProgress
} from '@mui/material';
import PropTypes from 'prop-types';
import { HEADER_BACKGROUND } from '../utilities/constants';
function Header({ handleSignOut, usageCount, refreshUsage, usageError, loadingUsage }) {
  // Compute usage visually
  const usagePercentage = Math.min((usageCount / 3) * 100, 100);

  return (
    <AppBar position="static" color= {HEADER_BACKGROUND} role="banner" aria-label="Application Header">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Left Side: App Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="div">
            PDF Accessibility Remediation
          </Typography>
        </Box>

        {/* Right Side: Usage Count and Home Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          
          {/* Display usage + progress bar */}
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {loadingUsage
                ? 'Checking usage...'
                : usageError
                  ? `Error: ${usageError}`
                  : `Used: ${usageCount} / 3`}
            </Typography>
            
            {!usageError && !loadingUsage && (
              <LinearProgress
                variant="determinate"
                value={usagePercentage}
                sx={{
                  height: 6,
                  borderRadius: '3px',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: usagePercentage < 100 ? '#66bb6a' : '#ef5350', 
                  },
                }}
              />
            )}
          </Box>

          {/* Optional: "Refresh Usage" button */}
          {/* Uncomment the button below if you want to allow manual refreshing from the header */}
          {/*
          <Button
            onClick={refreshUsage}
            variant="contained"
            disabled={loadingUsage}
            sx={{
              textTransform: 'none',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#125b9d'
              }
            }}
          >
            Refresh Usage
          </Button>
          */}

          {/* Home Button */}
          <Button
            onClick={handleSignOut}
            variant="outlined"
            sx={{
              borderColor: '#1976d2',
              color: '#1976d2',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                borderColor: '#1565c0',
              },
              '&:focus': {
                outline: 'none',
                boxShadow: '0 0 4px rgba(25, 118, 210, 0.5)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Home
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  handleSignOut: PropTypes.func.isRequired,
  usageCount: PropTypes.number.isRequired,
  refreshUsage: PropTypes.func.isRequired,
  usageError: PropTypes.string,
  loadingUsage: PropTypes.bool,
};

export default Header;
