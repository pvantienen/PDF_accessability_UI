import React, { useState } from 'react';
import { Drawer, List, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';  // For expanding arrow icon
import UpdateAdobeAPICredentials from './UpdateAdobeAPICredentials';
import PacChecker from './PacChecker';  // Import the PAC Accessibility component

const LeftNav = () => {
  // Accordion state to control expanded/collapsed
  const [expanded, setExpanded] = useState({ adobe: false, pac: false });

  const handleAccordionChange = (panel) => {
    setExpanded(prev => ({ ...prev, [panel]: !prev[panel] }));
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
        <Accordion expanded={expanded.adobe} onChange={() => handleAccordionChange('adobe')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Update Adobe API Credentials</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <UpdateAdobeAPICredentials />
          </AccordionDetails>
        </Accordion>
        {/* Accordion for PAC Accessibility */}
        <Accordion expanded={expanded.pac} onChange={() => handleAccordionChange('pac')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography>Check PDF Accessibility</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <PacChecker />
          </AccordionDetails>
        </Accordion>
      </List>
    </Drawer>
  );
};

export default LeftNav;
