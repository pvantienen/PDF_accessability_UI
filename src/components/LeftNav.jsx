import React, { useState } from 'react';
import { Drawer, List, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';  // For expanding arrow icon
import UpdateAdobeAPICredentials from './UpdateAdobeAPICredentials';

const LeftNav = () => {
  // Accordion state to control expanded/collapsed
  const [expanded, setExpanded] = useState(false);

  const handleAccordionChange = () => {
    setExpanded(!expanded);
  };

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
        {/* Accordion for Adobe API Credentials Update */}
        <Accordion expanded={expanded} onChange={handleAccordionChange}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}  // Arrow icon for expanding/collapsing
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Update Adobe API Credentials</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <UpdateAdobeAPICredentials />
          </AccordionDetails>
        </Accordion>
      </List>
    </Drawer>
  );
};

export default LeftNav;
