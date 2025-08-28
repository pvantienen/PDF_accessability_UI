// AWS Configuration Constants
export const IndentityPoolId = process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || 'your-identity-pool-id';
export const region = process.env.REACT_APP_AWS_REGION || 'us-east-1';

// S3 Bucket configurations with folder structure
export const BUCKET_CONFIGS = {
  pdf: {
    bucketName: 'pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52',
    region: 'us-east-1',
    uploadFolder: 'pdf/',
    outputFolder: 'result/',
    outputPrefix: 'COMPLIANT_',
    outputExtension: '.pdf'
  },
  html: {
    bucketName: 'pdf2html-bucket-390402571123-us-east-1',
    region: 'us-east-1',
    uploadFolder: 'uploads/',
    outputFolder: 'remediated/',
    outputPrefix: 'final_',
    outputExtension: '.zip'
  }
};

// Colors for your theme
export const PRIMARY_MAIN = '#1976d2';  // Your primary color (blue)
export const SECONDARY_MAIN = '#ff4081';  // Your secondary color (pink)
export const CHAT_LEFT_PANEL_BACKGROUND = '#2c3e50';  // Background color for left panel
export const HEADER_BACKGROUND = '#34495e';  // Background color for header
export const primary_50 = '#e3f2fd';  // Lighter shade of primary color

export const isMaintenanceMode = process.env.REACT_APP_MAINTENANCE_MODE === 'true';

export const Authority = process.env.REACT_APP_AUTHORITY;

export const DomainPrefix = process.env.REACT_APP_DOMAIN_PREFIX;
export const HostedUIUrl = process.env.REACT_APP_HOSTED_UI_URL;


export const UserPoolClientId = process.env.REACT_APP_USER_POOL_CLIENT_ID;
export const UserPoolId = process.env.REACT_APP_USER_POOL_ID;





// Preferably not use
// export const HostedUserPoolDomain = process.env.REACT_APP_USER_POOL_DOMAIN;




