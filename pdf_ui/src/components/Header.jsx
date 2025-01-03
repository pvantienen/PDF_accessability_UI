// src/components/Header.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import PropTypes from 'prop-types';
import {HEADER_BACKGROUND} from '../utilities/constants';

function Header({ handleSignOut }) {
  return (
    <AppBar position="static" color= {HEADER_BACKGROUND} role="banner" aria-label="Application Header">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PDF Accessibility
        </Typography>
        <Box>
          <Button 
    onClick={handleSignOut} 
    variant="outlined"
    sx={{
      borderColor: '#1976d2', // Blue border for better contrast
      color: '#1976d2', // Matching text color
      padding: '6px 16px', // Balanced spacing
      borderRadius: '8px', // Smooth rounded corners
      fontSize: '0.875rem', // Consistent font size
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.1)', // Subtle hover effect with blue tint
        borderColor: '#1565c0', // Darker blue on hover
      },
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 4px rgba(25, 118, 210, 0.5)', // Minimal blue focus outline
      },
      transition: 'all 0.3s ease-in-out', // Smooth transition
    }}
  >
    Sign Out
  </Button>


        </Box>
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  handleSignOut: PropTypes.func.isRequired,
};

export default Header;
