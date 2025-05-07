# PDF Accessibility Remediation UI: Automated PDF Document Compliance with WCAG 2.1 Level AA Standards

This solution provides an automated system for remediating PDF documents to meet WCAG 2.1 Level AA accessibility standards. Built by Arizona State University's AI Cloud Innovation Center (AI CIC) and powered by AWS, it helps organizations efficiently process and update their PDF documents to ensure accessibility compliance.

The application features a React-based frontend interface integrated with AWS services through CDK infrastructure. It provides user authentication via Amazon Cognito, secure file storage with S3, and automated PDF processing using AWS Lambda and ECS tasks. The system supports quota management, progress tracking, and detailed accessibility reporting to ensure documents meet compliance standards.

## Repository Structure
```
PDF_accessability_UI/
├── cdk_backend/                 # AWS CDK infrastructure code
│   ├── bin/                     # CDK app entry point
│   ├── lambda/                  # Lambda function implementations
│   │   ├── checkOrIncrementQuota/     # Handles user upload quotas
│   │   ├── postConfirmation/          # User pool post-confirmation handler
│   │   ├── updateAttributes/          # Updates user attributes
│   │   └── UpdateAttributesGroups/    # Manages group-based attributes
│   └── lib/                     # Core CDK stack definition
└── pdf_ui/                      # React frontend application
    ├── public/                  # Static assets
    └── src/                     # Source code
        ├── components/          # React components for UI elements
        ├── pages/              # Page-level components
        └── utilities/          # Shared utilities and constants
```

## Usage Instructions
### Prerequisites
- Node.js 14.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Git for version control
- Python 3.9 for Lambda functions

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PDF_accessability_UI
```

2. Install backend dependencies:
```bash
cd cdk_backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../pdf_ui
npm install
```

4. Configure AWS CDK:
```bash
cd ../cdk_backend
cdk bootstrap
```

5. Deploy the infrastructure:
```bash
cdk deploy -c githubToken=<your-token> -c bucketName=<your-bucket-name>
```

### Quick Start

1. Start the frontend development server:
```bash
cd pdf_ui
npm start
```

2. Access the application at `http://localhost:3000`

3. Sign in using your credentials or create a new account

4. Upload a PDF file through the interface to begin remediation

### More Detailed Examples

1. User Authentication Flow:
```javascript
// Sign in using Cognito
const auth = useAuth();
await auth.signinRedirect();
```

2. File Upload with Quota Check:
```javascript
const handleUpload = async (file) => {
  const response = await fetch('/api/upload-quota', {
    method: 'POST',
    body: JSON.stringify({ 
      sub: userSub,
      mode: 'check'
    })
  });
  // Check quota before proceeding with upload
};
```

### Troubleshooting

1. Authentication Issues
- Error: "No matching state found"
  - Clear browser cookies and cache
  - Ensure correct Cognito configuration in environment variables
  - Check redirect URIs in Cognito user pool client settings

2. Upload Failures
- Check file size limits in user attributes
- Verify S3 bucket permissions
- Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

3. PDF Processing Errors
- Check CloudWatch logs for Lambda functions
- Verify Adobe API credentials
- Monitor ECS task status

## Data Flow
The application processes PDFs through a multi-stage pipeline for accessibility remediation.

```ascii
User → Upload → S3 Bucket → Lambda Trigger → ECS Tasks → S3 Output → User Download
      ↑          ↓           ↓               ↓           ↓           ↓
      └── Quota Check    Validation    Processing    Validation  Notification
```

Key Component Interactions:
1. User uploads PDF through React frontend
2. Frontend checks quota via Lambda function
3. File stored in S3 triggers processing pipeline
4. ECS tasks perform PDF remediation
5. CloudWatch monitors processing status
6. Frontend polls for completion
7. User downloads remediated PDF

## Infrastructure

![Infrastructure diagram](./docs/infra.svg)

The infrastructure is defined using AWS CDK and includes:

Lambda Functions:
- `checkOrIncrementQuota`: Manages user upload quotas
- `postConfirmation`: Handles user pool post-confirmation
- `updateAttributes`: Updates user attributes
- `UpdateAttributesGroups`: Manages group-based attributes

Cognito Resources:
- User Pool with custom attributes
- Identity Pool for AWS service access
- User groups for access control

Additional Resources:
- S3 bucket for PDF storage
- Amplify application for frontend hosting
- IAM roles and policies for service access

## Deployment

Prerequisites:
- AWS account with appropriate permissions
- GitHub token for Amplify deployment
- S3 bucket for PDF storage

Deployment Steps:
1. Configure environment variables
2. Bootstrap CDK environment
3. Deploy infrastructure stack
4. Configure Amplify application
5. Verify resource creation
