import React, { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

// MUI Components
import {
  Box,
  Typography,
  Link,
  List,
  ListItem,
  ListItemIcon,
} from '@mui/material';
import { styled } from '@mui/system';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // For bullet points
import LoadingButton from '@mui/lab/LoadingButton'; // Import LoadingButton
import CircularProgress from '@mui/material/CircularProgress'; // Import CircularProgress

// Images (adjust paths to match your setup)
import asuLogo from '../assets/ASU_CIC_LOGO_WHITE.png';
import gradientImg from '../assets/Gradient.svg';
import awsLogo from '../assets/POWERED_BY_AWS.png';
import bottomGradient from '../assets/bottom_gradient.svg'; // Bottom gradient asset

// Styled Components

const StyledLink = styled(Link)(({ theme }) => ({
  color: '#8C1D40', // Custom color for links
  textDecoration: 'underline',
  component: 'a', // Ensure it behaves like a link
  '&:hover': {
    color: '#70122F', // Slightly darker shade on hover
  },
}));

// New styled component for email links without underline
const StyledEmailLink = styled(Link)(({ theme }) => ({
  color: '#8C1D40', // Custom color for email links
  textDecoration: 'none',
  component: 'a', // Ensure it behaves like a link
  '&:hover': {
    color: '#70122F', // Slightly darker shade on hover
    textDecoration: 'underline', // Optional: underline on hover for better UX
  },
}));

// Optional: Create a styled version of the FiberManualRecordIcon for reusability
const SmallFiberManualRecordIcon = styled(FiberManualRecordIcon)(({ size }) => ({
  fontSize: size || '8px', // Default to 8px if size prop is not provided
}));

const GradientBox = styled(Box)(({ theme }) => ({
  backgroundImage: `url(${gradientImg})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  padding: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.spacing(1), // Slightly rounded edges for a modern look
}));

const LandingPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  const handleSignIn = () => {
    setLoading(true);
    // Introduce a 1-second delay before redirecting
    setTimeout(() => {
      auth.signinRedirect();
      // No need to reset loading here as redirect will occur
    }, 1000);
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

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden', // Ensure the background gradient doesn't overflow
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* New Top Black Area */}
      <Box
        sx={{
          backgroundColor: '#000', // Black background
          height: '36px', // Adjust the height as needed
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Optional: Add any content or leave it empty for just spacing
        }}
      >
        {/* Optional: You can add content here, such as a navigation menu or title */}
      </Box>

      {/* Bottom Gradient */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: '50%', // Covers from the middle of the screen to the bottom
          backgroundImage: `url(${bottomGradient})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          zIndex: -1, // Ensure it stays behind the main content
        }}
      />

      {/* Black Section: Includes Text + Enlarged Gradient */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#000',
          color: '#fff',
          minHeight: '65vh', // Adjusted height for the black section
          alignItems: 'center',
          pb: 4,
          flexGrow: 1,
          flexWrap: 'wrap', // Ensures responsiveness on smaller screens
        }}
      >
        {/* Left Side: Text Content */}
        <Box
          sx={{
            flex: 1,
            padding: '0 4%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minWidth: '300px', // Ensures content doesn't get too narrow
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            PDF Accessibility Remediation
          </Typography>

          <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium', mb: 2 }}>
            About this solution:
          </Typography>
          <Typography variant="body1" component="h3" paragraph>
            This solution was created by the Arizona State University Artificial
            Intelligence Cloud Innovation Center (AI CIC), powered by Amazon Web
            Services (AWS), to tackle a significant challenge in the digital
            era: improving the accessibility of digital document collections.
          </Typography>
          <Typography variant="body1" component="h3" paragraph>
            With the Department of Justice’s April 2024 updates to how the
            Americans with Disabilities Act (ADA) will be regulated, the AI CIC
            developed a scalable open‐source solution that quickly and
            efficiently brings PDF documents into compliance with WCAG 2.1 Level
            AA standards. For bulk processing, 10 pages would cost
            approximately $0.013 for AWS service costs + Adobe API costs.
          </Typography>
          <Typography variant="body1" component="h3" paragraph>
            To test out this open‐source solution,{' '}
            <Box component="span" sx={{ color: '#FFC627', fontWeight: 'bold' }}>
              click the button to the right
            </Box>{' '}
            to briefly create an account, upload your document, and receive your
            remediated PDF in return.
          </Typography>

          {/* Provided By Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 4, // Margin top for spacing from the text above
            }}
          >
            <Typography variant="body1" component="h3" sx={{ mr: 1, fontWeight: 'bold' }}>
              Provided by:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <img
                src={asuLogo}
                alt="ASU AI CIC Logo (white)"
                style={{ height: 70, width: 'auto', marginRight: '16px' }} // Adjust height and margin as needed
              />
              <img
                src={awsLogo}
                alt="Powered by AWS logo (white)"
                style={{ height: 40, width: 'auto' }} // Adjust height as needed
              />
            </Box>
          </Box>
        </Box>

        {/* Right Side: Enlarged Gradient Box with Button */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            minWidth: '300px', // Ensures content doesn't get too narrow
          }}
        >
          <GradientBox>
            <Typography
              variant="h5"
              component="h2" // Larger text
              sx={{
                mb: 4,
                color: '#FFC627', // Yellow color for the text
                textAlign: 'center',
                fontWeight: 'bold',
              }}
            >
              READY TO TRANSFORM YOUR PDF?
            </Typography>
            <LoadingButton
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIosIcon />}
              onClick={handleSignIn}
              loading={loading}
              component="button"
              loadingIndicator={
                <CircularProgress
                  size={24}
                  sx={{ color: '#000' }} // Set loading indicator color to black
                />
              }
              sx={{
                backgroundColor: '#FFC627', // Default button color
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1.2rem', // Larger button text
                width: 350, // Increased button width
                height: 50, // Increased button height
                overflow: 'hidden', // Ensure content stays inside
                position: 'relative',
                borderRadius: '25px', // Fully rounded for semi-circle ends
                transition: 'transform 0.2s, background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: '#e6ae22', // Darker shade on hover
                  transform: 'scale(1.05)', // Enlarge on hover
                },
                // Optional: Adjust the loading state styles
                '&.MuiLoadingButton-loading': {
                  backgroundColor: '#FFC627', // Maintain background color during loading
                },
              }}
            >
              Login and Remediate My PDF
            </LoadingButton>
          </GradientBox>
        </Box>
      </Box>
      <Box
        sx={{
          height: '5px', // Thickness of the line
          backgroundColor: '#FFC627', // The same yellow color
        }}
      />

      {/* Support Resources Section */}
      <Box
        sx={{
          p: 4,
          borderTop: '1px solid #ddd',
          borderBottom: '1px solid #ddd',
        }}
      >
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Support resources:
        </Typography>
        <List>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemIcon sx={{ minWidth: '24px' }}> {/* Adjusted minWidth */}
              {/* Using the styled SmallFiberManualRecordIcon */}
              <SmallFiberManualRecordIcon size="12px" sx={{ color: '#000000' }} />
            </ListItemIcon>
            <Typography variant="body1" component="h3">
              This solution is available open source and can be added to your
              AWS account for usage and testing.
              <StyledLink
                href="https://github.com/ASUCICREPO/PDF_Accessibility"
                target="_blank"
                rel="noopener"
                sx={{ ml: 0.5 }}
              >
                Review documentation and access the GitHub repo.
              </StyledLink>
            </Typography>
          </ListItem>
          <ListItem disablePadding>
            <ListItemIcon sx={{ minWidth: '24px' }}> {/* Adjusted minWidth */}
              {/* Using the styled SmallFiberManualRecordIcon */}
              <SmallFiberManualRecordIcon size="12px" sx={{ color: '#000000' }} />
            </ListItemIcon>
            <Typography variant="body1" component="h3">
              Have questions about this solution or need support? Email us:{' '}
              <StyledEmailLink href="mailto:ai-cic@amazon.com">
                ai-cic@amazon.com
              </StyledEmailLink>
            </Typography>
          </ListItem>
        </List>
      </Box>

      {/* About the AI CIC Section */}
      <Box
        sx={{
          p: 4,
          backgroundColor: '#FAFAFA',
          position: 'relative',
          overflow: 'hidden', // Ensures the rolling asset stays within the bounds
        }}
      >
        {/* Rolling Asset */}
        <Box
          sx={{
            position: 'absolute',
            top: '-20%', // Adjust based on asset size
            left: '-10%',
            width: '120%',
            height: '150%',
            backgroundImage: `url(${bottomGradient})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            transform: 'rotate(-15deg)', // Slight tilt for dynamic look
            opacity: 0.2, // Light opacity for subtle effect
            zIndex: -1, // Keeps the asset behind the content
          }}
        />
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          About the AI CIC:
        </Typography>
        <Typography variant="body1" component="h3" paragraph>
          The ASU Artificial Intelligence Cloud Innovation Center (AI CIC),
          powered by AWS, is a no‐cost design thinking and rapid prototyping
          shop dedicated to bridging the digital divide and driving innovation
          in the nonprofit, healthcare, education, and government sectors.
        </Typography>
        <Typography variant="body1" component="h3" paragraph>
          Our expert team harnesses Amazon’s pioneering approach to dive deep into
          high-priority pain points, meticulously define challenges, and craft
          strategic solutions. We collaborate with AWS solutions architects and
          talented student workers to develop tailored prototypes showcasing
          how advanced technology can tackle a wide range of operational and
          mission-related challenges.
        </Typography>
        <Typography variant="body1" component="h3" paragraph>
          Discover how we use technology to drive innovation. Visit our website at{' '}
          <StyledLink
            href="https://smartchallenges.asu.edu/challenges/pdf-accessibility-ohio-state-university"
            target="_blank"
            rel="noopener"
          >
            AI CIC
          </StyledLink>{' '}
          or contact us directly at{' '}
          <StyledEmailLink href="mailto:ai-cic@amazon.com">
            ai-cic@amazon.com
          </StyledEmailLink>
          .
        </Typography>
      </Box>

      {/* Removed the Footer: Powered by AWS Section */}
    </Box>
  );
};

export default LandingPage;
