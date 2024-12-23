import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = () => (
  <AppBar position="static" color="default" role="banner" aria-label="Application Header">
    <Toolbar>
      <Typography variant="h6" component="h1" tabIndex="0">
        PDF Accessibility
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
