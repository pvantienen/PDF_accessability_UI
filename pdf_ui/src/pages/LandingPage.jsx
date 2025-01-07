// LandingPageFramer.jsx

import React, { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

// --- MUI Components and Icons ---

import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  Link,
  Slide,
} from '@mui/material';
import { styled } from '@mui/system';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { HostedUIUrl,UserPoolClientId,region,DomainPrefix } from '../utilities/constants';
// --- Framer Motion ---
import { motion } from 'framer-motion';

function LandingPageFramer() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return; 
    if (auth.isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [auth.isAuthenticated, auth.isLoading, navigate]);

  const signOutRedirect = () => {
    const clientId = UserPoolClientId;
    const logoutUri = 'http://localhost:3000/home';
    // const logoutUri = `${HostedUIUrl}/home`;
    const cognitoDomain = `https://${DomainPrefix}.auth.${region}.amazoncognito.com`;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const handleSignIn = () => {
    auth.signinRedirect();
  };

  if (auth.isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={50} thickness={5} />
      </Box>
    );
  }

  // --- Microinteraction Button styling (arrow slides fully to the right) ---
  const MicroInteractionButton = styled(Button)(({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    paddingLeft: '3rem',
    paddingRight: '3rem',
    transition: 'all 0.3s ease',
    fontSize: '1.1rem',
    fontWeight: 500,

    '.arrowIcon': {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      transition: 'all 0.45s ease',
    },

    '&:hover': {
      transform: 'scale(1.05)',
      backgroundColor: 'green',
      color: '#fff',
    },
    '&:hover .arrowIcon': {
      left: 'calc(100% - 2.5rem)',
    },
  }));

  return (
    <Slide direction="up" in={!auth.isLoading} mountOnEnter unmountOnExit timeout={500}>
      <Container
        maxWidth="md"
        sx={{
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minHeight: '100vh',
        }}
      >
        {/* Title */}
        <Typography variant="h3" align="center" sx={{ fontWeight: 600, mt: 2 }}>
          PDF Accessibility Remediation
        </Typography>

        {/* Row: Left side -> "Transform Your PDF" & Button, Right side -> Framer Motion icon */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
            mt: 4,
          }}
        >
          {/* Left Side */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 500, mb: 2 }}>
              Transform Your PDF
            </Typography>

            {/* Microinteraction Button */}
            <MicroInteractionButton variant="contained" size="large" onClick={handleSignIn}>
              <ArrowForwardIosIcon className="arrowIcon" />
              Remediate My PDF
            </MicroInteractionButton>
          </Box>

          {/* Right Side: Framer Motion 3D Rotation Icon */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <motion.img
              src="/pdf-icon.png" // Replace with your PDF icon path or URL
              alt="PDF Icon"
              animate={{
                rotateY: [0, 360], 
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: 'linear',
              }}
              style={{
                width: '200px',
                height: '200px',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>

        {/* BELOW THIS: The existing text/content */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            About this solution
          </Typography>
          <Typography paragraph>
            This solution was created by the Arizona State University Artificial Intelligence Cloud 
            Innovation Center (AI CIC), powered by Amazon Web Services (AWS) to tackle a significant 
            challenge in the digital era: improving the accessibility of digital document collections.
          </Typography>
          <Typography paragraph>
            With the Department of Justice’s April 2024 updates to how the Americans with Disabilities 
            Act (ADA) will be regulated, the AI CIC developed a scalable open-source solution that 
            quickly and efficiently brings PDF documents into compliance with WCAG 2.1 Level AA 
            standards. For bulk processing, 10 pages would cost approximately <strong>$0.013130164</strong> 
            for AWS service costs + Adobe API costs.
          </Typography>
          <Typography paragraph>
            To test out this open-source solution, click the button above to briefly create an account, 
            upload your document, and receive your remediated PDF in return.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Support resources
          </Typography>
          <List>
            <ListItem sx={{ display: 'list-item' }}>
              This solution is available open source and can be added to your AWS account 
              for usage and testing. Review documentation and access the GitHub repo.
            </ListItem>
            <ListItem sx={{ display: 'list-item' }}>
              Have questions about this solution or need support? Email us:
              <Link href="mailto:ai-cic@amazon.com" sx={{ color: 'primary.main', ml: 1 }}>
                ai-cic@amazon.com
              </Link>
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            About the AI CIC
          </Typography>
          <Typography paragraph>
            The ASU Artificial Intelligence Cloud Innovation Center (AI CIC), powered by AWS 
            is a no-cost design thinking and rapid prototyping shop dedicated to bridging 
            the digital divide and driving innovation in the nonprofit, healthcare, 
            education, and government sectors.
          </Typography>
          <Typography paragraph>
            Our expert team harnesses Amazon’s pioneering approach to dive deep into 
            high-priority pain points, meticulously define challenges, and craft strategic 
            solutions. We collaborate with AWS solutions architects and talented student 
            workers to develop tailored prototypes showcasing how advanced technology 
            can tackle a wide range of operational and mission-related challenges.
          </Typography>
          <Typography paragraph>
            Discover how we use technology to drive innovation. Visit our website at AI CIC 
            or contact us directly at
            <Link href="mailto:ai-cic@amazon.com" sx={{ color: 'primary.main', ml: 1 }}>
              ai-cic@amazon.com
            </Link>.
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button variant="contained" color="error" size="large" onClick={signOutRedirect}>
            Sign Out
          </Button>
        </Box>
      </Container>
    </Slide>
  );
}

export default LandingPageFramer;
