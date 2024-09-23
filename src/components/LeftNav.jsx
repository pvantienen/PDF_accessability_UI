import React from 'react';
import { Drawer, List, ListItem, ListItemText, Box, Typography } from '@mui/material';
import ElapsedTimer from './ElapsedTimer';  // Import the ElapsedTimer component
import UpdateAdobeAPICredentials from './UpdateAdobeAPICredentials';
const LeftNav = ({ uploadedAt, isFileReady }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 360,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 360, boxSizing: 'border-box', backgroundColor: '#f3f4f6' },
      }}
    >
      <Box sx={{ padding: 2 }}>
        <Typography variant="h6" noWrap>
          Dashboard
        </Typography>
      </Box>
      <List>
        <ListItem button={"true"}>  {/* Ensure button is a boolean */}
          <UpdateAdobeAPICredentials/>
        </ListItem>
      </List>

      {/* Timer Section */}
      <Box sx={{ padding: 2 }}>
        <ElapsedTimer isFileReady={isFileReady} uploadedAt={uploadedAt} />
      </Box>
    </Drawer>
  );
};

export default LeftNav;
