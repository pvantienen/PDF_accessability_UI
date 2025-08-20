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