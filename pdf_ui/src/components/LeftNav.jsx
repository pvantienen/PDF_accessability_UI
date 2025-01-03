import React from 'react';
import { Drawer, Box, Typography,Link } from '@mui/material';

const LeftNav = () => {
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
          About this Solution
        </Typography>
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Document Requirements:
          </Typography>
          <Typography variant="body2" gutterBottom>
            - Each user is limited to X PDF document uploads.
          </Typography>
          <Typography variant="body2" gutterBottom>
            - Documents cannot exceed XX pages.
          </Typography>
          <Typography variant="body2" gutterBottom>
            - Documents must be smaller than XX MB.
          </Typography>
          <Typography variant="body2" gutterBottom>
            - Do not upload documents containing sensitive information.
          </Typography>
          <Typography variant="body2" gutterBottom>
            - This solution only remediates PDF documents. Other document types will not be accepted.
          </Typography>
          <Typography variant="body2" gutterBottom>
            - This solution does not remediate for color selection/contrast for people with color blindness.
          </Typography>
        </Box>

        <Box sx={{ marginTop: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Support Resources:
          </Typography>
          <Typography variant="body2" gutterBottom>
            This solution is available open source and can be added to your AWS account for usage and testing.
            Review documentation and access the GitHub repo.
          </Typography>
          <Typography variant="body2" gutterBottom>
            <Link href="https://github.com/ASUCICREPO/PDF_Accessibility" target="_blank" rel="noopener noreferrer">
              https://github.com/ASUCICREPO/PDF_Accessibility
            </Link>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Have questions about this solution or need support? Email us: <strong>ai-cic@amazon.com</strong>
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

// Commented-out Accordion code for future use
/*
import React, { useState } from 'react';
import { Drawer, List, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';  // For expanding arrow icon
import UpdateAdobeAPICredentials from './UpdateAdobeAPICredentials';
import PacChecker from './PacChecker';  // Import the PAC Accessibility component

const LeftNav = () => {
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
        About this Solution
        </Typography>
      </Box>
      <List>
        <Accordion expanded={expanded.pac} onChange={() => handleAccordionChange('pac')}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2a-content"
            id="panel2a-header"
          >
            <Typography>Document Requirements:</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <PacChecker />
          </AccordionDetails>
        </Accordion>
      </List>
    </Drawer>
  );
};
*/

export default LeftNav;
