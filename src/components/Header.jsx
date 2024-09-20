import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = () => (
  <AppBar position="static" color="default">
    <Toolbar>
      <Typography variant="h6">
        PDF Accessibility: Ohio State University
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
