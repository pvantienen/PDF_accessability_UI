import React from 'react';
import { Drawer, Box, Typography, Card, CardContent, Divider, Link } from '@mui/material';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import SupportIcon from '@mui/icons-material/Support';

const LeftNav = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 360,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 360, boxSizing: 'border-box', backgroundColor: '#f9f9f9' },
      }}
    >
      <Box sx={{ padding: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          About this Solution
        </Typography>

        {/* Document Requirements Card */}
        <Card
          sx={{
            marginBottom: 3,
            borderRadius: 2,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" marginBottom={2}>
              <DocumentScannerIcon fontSize="large" color="primary" />
              <Typography variant="h6" fontWeight="bold" sx={{ marginLeft: 1 }}>
                Document Requirements
              </Typography>
            </Box>
            <Divider sx={{ marginBottom: 2 }} />
            <Typography variant="body2" gutterBottom>
              - Each user is limited to <strong>3 PDF document uploads</strong>.
            </Typography>
            <Typography variant="body2" gutterBottom>
              - Documents cannot exceed <strong>10 pages</strong>.
            </Typography>
            <Typography variant="body2" gutterBottom>
              - Documents must be smaller than <strong>25 MB</strong>.
            </Typography>
            <Typography variant="body2" gutterBottom>
              - Do not upload documents containing <strong>sensitive information</strong>.
            </Typography>
            <Typography variant="body2" gutterBottom>
              - This solution only remediates <strong>PDF documents</strong>. Other document types will not be accepted.
            </Typography>
            <Typography variant="body2" gutterBottom>
              - This solution does not remediate for <strong>color selection/contrast for people with color blindness</strong>.
            </Typography>
          </CardContent>
        </Card>

        {/* Support Resources Card */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" marginBottom={2}>
              <SupportIcon fontSize="large" color="secondary" />
              <Typography variant="h6" fontWeight="bold" sx={{ marginLeft: 1 }}>
                Support Resources
              </Typography>
            </Box>
            <Divider sx={{ marginBottom: 2 }} />
            <Typography variant="body2" gutterBottom>
              This solution is available open source and can be added to your AWS account for usage and testing. 
              Review documentation and access the GitHub repo at:
            </Typography>
            <Typography variant="body2" gutterBottom>
              <Link href="https://github.com/ASUCICREPO/PDF_Accessibility" target="_blank" rel="noopener noreferrer">
                GitHub Repo
              </Link>
            </Typography>
            <Typography variant="body2" gutterBottom>
              Have questions or need support? Email us: <strong>ai-cic@amazon.com</strong>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Drawer>
  );
};

export default LeftNav;




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