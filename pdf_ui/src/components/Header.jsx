// src/components/Header.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from 'react-oidc-context';
import PropTypes from 'prop-types';

function Header({ handleSignOut }) {
  return (
    <AppBar position="static" color="primary" role="banner" aria-label="Application Header">
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
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'white',
              },
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
