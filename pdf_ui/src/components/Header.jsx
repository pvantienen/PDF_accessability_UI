// src/components/Header.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from 'react-oidc-context';
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
          color="inherit" 
          onClick={handleSignOut} 
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.6)', // Slightly subdued border color
            color: 'white', // Consistent text color
            padding: '6px 16px', // Better spacing for a polished look
            borderRadius: '8px', // Smooth rounded corners
            fontSize: '0.875rem', // Slightly smaller font for elegance
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)', // Subtle hover effect
              borderColor: 'rgba(255, 255, 255, 0.8)', // Slightly brighter on hover
            },
            '&:focus': {
              outline: 'none',
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.5)', // Minimal focus outline
            },
            transition: 'all 0.3s ease-in-out', // Smooth transitions for hover/focus effects
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
