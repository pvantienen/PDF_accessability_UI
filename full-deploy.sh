#!/bin/bash
# PDF Accessibility - Hybrid Deployment with Two-Stage Process
# Stage 1: Deploy Amplify infrastructure
# Stage 2: Deploy Cognito with Amplify URL knowledge

echo "🚀 PDF Accessibility - Two-Stage Hybrid Deployment"
echo "=============================================================="

# ------------------------- Configuration -------------------------

# Auto-detect GitHub URL from current repo
GITHUB_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$GITHUB_URL" ]; then
    echo "❌ Could not detect GitHub URL. Make sure you're in a git repository."
    exit 1
fi
echo "📡 Detected GitHub URL: $GITHUB_URL"

# Auto-detect current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    # Fallback method for older git versions
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
fi

# Set target branch (with fallback)
if [ -z "$TARGET_BRANCH" ]; then
    if [ -z "$CURRENT_BRANCH" ]; then
        TARGET_BRANCH="pdf2html"  # Default fallback
        echo "⚠️ Could not detect current branch. Using default: $TARGET_BRANCH"
    else
        TARGET_BRANCH="$CURRENT_BRANCH"
        echo "📍 Using current branch: $TARGET_BRANCH"
    fi
else
    echo "📍 Using specified branch: $TARGET_BRANCH"
fi

# Validate branch exists on remote
if ! git ls-remote --heads origin "$TARGET_BRANCH" | grep -q "$TARGET_BRANCH"; then
    echo "❌ Branch '$TARGET_BRANCH' not found on remote origin"
    echo "Available branches:"
    git ls-remote --heads origin | sed 's/.*refs\/heads\//  - /'
    exit 1
fi

echo "✅ Target branch validated: $TARGET_BRANCH"

if [ -z "$PROJECT_NAME" ]; then
    read -p "Enter project name [pdf-accessibility]: " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-pdf-accessibility}
fi


# ------------------------- S3 Bucket Configuration -------------------------

echo ""
echo "📦 S3 Bucket Configuration"
echo "The application requires two S3 buckets for PDF processing:"
echo "  1. PDF-to-PDF bucket: For original PDF storage and processing"
echo "  2. PDF-to-HTML bucket: For converted HTML output storage"
echo ""

# Prompt for PDF-to-PDF bucket ARN
if [ -z "$PDF_TO_PDF_BUCKET_ARN" ]; then
    echo "Enter the ARN for your PDF-to-PDF processing bucket:"
    echo "  Example: arn:aws:s3:::my-pdf-processing-bucket"
    echo "  (Leave empty to auto-generate based on project name)"
    read -p "PDF-to-PDF Bucket ARN: " PDF_TO_PDF_BUCKET_ARN
    
    if [ -z "$PDF_TO_PDF_BUCKET_ARN" ]; then
        PDF_TO_PDF_BUCKET_NAME="${PROJECT_NAME}-pdf-to-pdf-$(date +%s)"
        PDF_TO_PDF_BUCKET_ARN="arn:aws:s3:::${PDF_TO_PDF_BUCKET_NAME}"
        echo "  Auto-generated: $PDF_TO_PDF_BUCKET_ARN"
    fi
fi

# Prompt for PDF-to-HTML bucket ARN
if [ -z "$PDF_TO_HTML_BUCKET_ARN" ]; then
    echo ""
    echo "Enter the ARN for your PDF-to-HTML output bucket:"
    echo "  Example: arn:aws:s3:::my-pdf-html-output-bucket"
    echo "  (Leave empty to auto-generate based on project name)"
    read -p "PDF-to-HTML Bucket ARN: " PDF_TO_HTML_BUCKET_ARN
    
    if [ -z "$PDF_TO_HTML_BUCKET_ARN" ]; then
        PDF_TO_HTML_BUCKET_NAME="${PROJECT_NAME}-pdf-to-html-$(date +%s)"
        PDF_TO_HTML_BUCKET_ARN="arn:aws:s3:::${PDF_TO_HTML_BUCKET_NAME}"
        echo "  Auto-generated: $PDF_TO_HTML_BUCKET_ARN"
    fi
fi

# Validate bucket ARN format
validate_bucket_arn() {
    local arn=$1
    local bucket_type=$2
    
    if [[ ! $arn =~ ^arn:aws:s3:::[a-z0-9.-]+$ ]]; then
        echo "❌ Invalid S3 bucket ARN format for $bucket_type: $arn"
        echo "   Expected format: arn:aws:s3:::bucket-name"
        exit 1
    fi
}

validate_bucket_arn "$PDF_TO_PDF_BUCKET_ARN" "PDF-to-PDF"
validate_bucket_arn "$PDF_TO_HTML_BUCKET_ARN" "PDF-to-HTML"

echo ""
echo "✅ S3 Bucket Configuration:"
echo "  PDF-to-PDF Bucket: $PDF_TO_PDF_BUCKET_ARN"
echo "  PDF-to-HTML Bucket: $PDF_TO_HTML_BUCKET_ARN"
echo ""

# Export for use in environment variables
export PDF_TO_PDF_BUCKET_ARN
export PDF_TO_HTML_BUCKET_ARN

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
AWS_REGION=${AWS_REGION:-us-east-1}

# Project naming
AMPLIFY_PROJECT_NAME="${PROJECT_NAME}-amplify"
BACKEND_PROJECT_NAME="${PROJECT_NAME}-backend"

echo "📋 Configuration:"
echo "  Project: $PROJECT_NAME"
echo "  GitHub: $GITHUB_URL"  
echo "  Target Branch: $TARGET_BRANCH"
echo "  Account: $AWS_ACCOUNT"
echo "  Region: $AWS_REGION"
echo "  Amplify CodeBuild: $AMPLIFY_PROJECT_NAME"
echo "  Backend CodeBuild: $BACKEND_PROJECT_NAME"
echo ""

# ------------------------- Setup IAM Role -------------------------

ROLE_NAME="${PROJECT_NAME}-codebuild-service-role"

echo "🔧 Setting up IAM role for CodeBuild projects..."

# Create IAM role if needed
if ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    echo "Creating IAM role..."
    
    TRUST_POLICY='{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "codebuild.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }'

    aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST_POLICY" >/dev/null
    aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess"
    sleep 10
    echo "✅ IAM role created"
else
    echo "✅ IAM role exists"
fi

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

# ------------------------- Stage 1: Setup Amplify CodeBuild -------------------------

echo ""
echo "🗂️ Stage 1: Setting up Amplify infrastructure deployment..."

# Create First CodeBuild project for Amplify
echo "Creating Amplify CodeBuild project..."

if aws codebuild create-project \
    --name "$AMPLIFY_PROJECT_NAME" \
    --source '{"type": "GITHUB", "location": "'"$GITHUB_URL"'", "buildspec": "buildspec-amplify.yml"}' \
    --source-version "$TARGET_BRANCH" \
    --artifacts '{"type": "NO_ARTIFACTS"}' \
    --environment '{
        "type": "LINUX_CONTAINER",
        "image": "aws/codebuild/amazonlinux-x86_64-standard:5.0",
        "computeType": "BUILD_GENERAL1_MEDIUM",
        "environmentVariables": [
            {"name": "AWS_ACCOUNT", "value": "'$AWS_ACCOUNT'"},
            {"name": "AWS_REGION", "value": "'$AWS_REGION'"},
            {"name": "PROJECT_NAME", "value": "'$PROJECT_NAME'"},
            {"name": "TARGET_BRANCH", "value": "'$TARGET_BRANCH'"}
        ]
    }' \
    --service-role "$ROLE_ARN" >/dev/null 2>&1; then
    echo "✅ Amplify CodeBuild project created"
else
    echo "ℹ️ Amplify CodeBuild project already exists or updated"
fi

# Start Amplify deployment
echo "🚀 Starting Amplify infrastructure deployment..."

AMPLIFY_BUILD_ID=$(aws codebuild start-build --project-name "$AMPLIFY_PROJECT_NAME" --query 'build.id' --output text)
if [ -z "$AMPLIFY_BUILD_ID" ] || [ "$AMPLIFY_BUILD_ID" = "None" ]; then
    echo "❌ Failed to start Amplify CodeBuild"
    exit 1
fi
echo "Amplify build started: $AMPLIFY_BUILD_ID"

# Wait for Amplify build to complete
echo "⏳ Waiting for Amplify deployment to complete..."

while true; do
    AMPLIFY_BUILD_STATUS=$(aws codebuild batch-get-builds --ids "$AMPLIFY_BUILD_ID" --query 'builds[0].buildStatus' --output text)
    
    case $AMPLIFY_BUILD_STATUS in
        "IN_PROGRESS")
            echo "  🔄 Still building Amplify... ($(date '+%H:%M:%S'))"
            sleep 30
            ;;
        "SUCCEEDED")
            echo "✅ Amplify deployment completed successfully!"
            break
            ;;
        "FAILED")
            echo "❌ Amplify deployment failed!"
            echo "Check CodeBuild logs at:"
            echo "https://$AWS_REGION.console.aws.amazon.com/codesuite/codebuild/projects/$AMPLIFY_PROJECT_NAME/history"
            exit 1
            ;;
        *)
            echo "⏳ Build status: $AMPLIFY_BUILD_STATUS"
            sleep 30
            ;;
    esac
done

# ------------------------- Get Amplify URL from CloudFormation -------------------------

echo ""
echo "📄 Getting Amplify URL from CloudFormation..."

# Wait a moment for stack to be available
sleep 10

# Get Amplify App ID from amplify stack
echo "Getting Amplify App ID..."
export AMPLIFY_APP_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-AmplifyHostingStack" \
    --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
    --output text 2>/dev/null)

# Verify Amplify App ID
if [ "$AMPLIFY_APP_ID" = "None" ] || [ -z "$AMPLIFY_APP_ID" ]; then
    echo "❌ Could not get Amplify App ID from CloudFormation stack"
    echo "Available stacks:"
    aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[].StackName'
    exit 1
fi

# Construct Amplify URL using the target branch
AMPLIFY_URL="https://$TARGET_BRANCH.$AMPLIFY_APP_ID.amplifyapp.com"
echo "🌐 Amplify URL: $AMPLIFY_URL"

# ------------------------- Stage 2: Setup Backend CodeBuild -------------------------

echo ""
echo "🗂️ Stage 2: Setting up backend deployment with Amplify URL..."

# Create Second CodeBuild project for Backend (Cognito)
echo "Creating Backend CodeBuild project..."

if aws codebuild create-project \
    --name "$BACKEND_PROJECT_NAME" \
    --source '{"type": "GITHUB", "location": "'"$GITHUB_URL"'", "buildspec": "buildspec-backend.yml", "sourceVersion": "'$TARGET_BRANCH'"}' \
    --source-version "$TARGET_BRANCH" \
    --artifacts '{"type": "NO_ARTIFACTS"}' \
    --environment '{
        "type": "LINUX_CONTAINER",
        "image": "aws/codebuild/amazonlinux-x86_64-standard:5.0",
        "computeType": "BUILD_GENERAL1_MEDIUM",
        "environmentVariables": [
            {"name": "AWS_ACCOUNT", "value": "'$AWS_ACCOUNT'"},
            {"name": "AWS_REGION", "value": "'$AWS_REGION'"},
            {"name": "PROJECT_NAME", "value": "'$PROJECT_NAME'"},
            {"name": "AMPLIFY_URL", "value": "'$AMPLIFY_URL'"},
            {"name": "AMPLIFY_APP_ID", "value": "'$AMPLIFY_APP_ID'"},
            {"name": "TARGET_BRANCH", "value": "'$TARGET_BRANCH'"},
            {"name": "PDF_TO_PDF_BUCKET_ARN", "value": "'$PDF_TO_PDF_BUCKET_ARN'"},
            {"name": "PDF_TO_HTML_BUCKET_ARN", "value": "'$PDF_TO_HTML_BUCKET_ARN'"}
        ]
    }' \
    --service-role "$ROLE_ARN" >/dev/null 2>&1; then
    echo "✅ Backend CodeBuild project created"
else
    echo "ℹ️ Backend CodeBuild project already exists or updated"
fi

# Start Backend deployment
echo "🚀 Starting backend deployment with Amplify URL..."

BACKEND_BUILD_ID=$(aws codebuild start-build --project-name "$BACKEND_PROJECT_NAME" --query 'build.id' --output text)
if [ -z "$BACKEND_BUILD_ID" ] || [ "$BACKEND_BUILD_ID" = "None" ]; then
    echo "❌ Failed to start Backend CodeBuild"
    exit 1
fi
echo "Backend build started: $BACKEND_BUILD_ID"

# Wait for Backend build to complete
echo "⏳ Waiting for backend deployment to complete..."

while true; do
    BACKEND_BUILD_STATUS=$(aws codebuild batch-get-builds --ids "$BACKEND_BUILD_ID" --query 'builds[0].buildStatus' --output text)
    
    case $BACKEND_BUILD_STATUS in
        "IN_PROGRESS")
            echo "  🔄 Still building backend... ($(date '+%H:%M:%S'))"
            sleep 30
            ;;
        "SUCCEEDED")
            echo "✅ Backend deployment completed successfully!"
            break
            ;;
        "FAILED")
            echo "❌ Backend deployment failed!"
            echo "Check CodeBuild logs at:"
            echo "https://$AWS_REGION.console.aws.amazon.com/codesuite/codebuild/projects/$BACKEND_PROJECT_NAME/history"
            exit 1
            ;;
        *)
            echo "⏳ Build status: $BACKEND_BUILD_STATUS"
            sleep 30
            ;;
    esac
done

# ------------------------- Get Backend Outputs from CloudFormation -------------------------

echo ""
echo "📄 Getting backend outputs from CloudFormation..."

# Wait a moment for stacks to be available
sleep 10

# Get User Pool ID from backend stack
echo "Getting User Pool ID from backend stack..."
export USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-CdkBackendStack" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text 2>/dev/null)

# Get User Pool Client ID from backend stack
echo "Getting User Pool Client ID from backend stack..."
export USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-CdkBackendStack" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text 2>/dev/null)

# Get User Pool Domain from backend stack
echo "Getting User Pool Domain from backend stack..."
export USER_POOL_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-CdkBackendStack" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
    --output text 2>/dev/null)

# Get Identity Pool ID from backend stack
echo "Getting Identity Pool ID from backend stack..."
export IDENTITY_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "${PROJECT_NAME}-CdkBackendStack" \
    --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue' \
    --output text 2>/dev/null)


# Verify all outputs
if [ "$USER_POOL_ID" = "None" ] || [ -z "$USER_POOL_ID" ]; then
    echo "❌ Could not get User Pool ID from CloudFormation stack"
    exit 1
fi

if [ "$USER_POOL_CLIENT_ID" = "None" ] || [ -z "$USER_POOL_CLIENT_ID" ]; then
    echo "❌ Could not get User Pool Client ID from CloudFormation stack"
    exit 1
fi

if [ "$USER_POOL_DOMAIN" = "None" ] || [ -z "$USER_POOL_DOMAIN" ]; then
    echo "❌ Could not get User Pool Domain from CloudFormation stack"
    exit 1
fi

if [ "$IDENTITY_POOL_ID" = "None" ] || [ -z "$IDENTITY_POOL_ID" ]; then
    echo "❌ Could not get Identity Pool ID from CloudFormation stack"
    exit 1
fi


# Display the retrieved values
echo ""
echo "🔐 Backend Configuration:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  User Pool Domain: $USER_POOL_DOMAIN"
echo "  Identity Pool ID: $IDENTITY_POOL_ID"
echo "  Amplify App ID: $AMPLIFY_APP_ID"
echo "  Amplify URL: $AMPLIFY_URL"
echo "  Target Branch: $TARGET_BRANCH"
echo ""

echo "✅ All backend outputs retrieved successfully!"

# ------------------------- Build Frontend with Configuration -------------------------

echo ""
echo "🗂️ Building frontend with backend configuration..."

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not available"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    sudo yum install -y jq
fi

# Navigate to frontend
if [ -d "frontend" ]; then
    cd frontend
else
    echo "❌ Frontend directory not found"
    exit 1
fi

# Create or update .env file with configuration
echo "📝 Creating frontend configuration..."
cat > .env << EOF
# AWS Configuration
REACT_APP_AWS_ACCESS_KEY_ID=
REACT_APP_AWS_SECRET_ACCESS_KEY=
REACT_APP_AWS_REGION=$AWS_REGION

# Cognito Identity Pool (for anonymous access)
REACT_APP_COGNITO_IDENTITY_POOL_ID=$IDENTITY_POOL_ID

# ===== AUTHENTICATION CONFIGURATION (Required for Login) =====
# Cognito User Pool Configuration
REACT_APP_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_AUTHORITY=cognito-idp.$AWS_REGION.amazonaws.com

# Hosted UI Configuration
REACT_APP_DOMAIN_PREFIX=$USER_POOL_DOMAIN
REACT_APP_HOSTED_UI_URL=$AMPLIFY_URL

# Maintenance Mode
REACT_APP_MAINTENANCE_MODE=false
EOF

echo "✅ Frontend configuration created"

# Install and build
echo "Installing frontend dependencies..."
npm install

echo "Building React app with authentication configuration..."
npm run build

if [ ! -f "build/index.html" ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
cd build
zip -r ../frontend-build.zip .
cd ..

echo "✅ Frontend built and packaged"
cd .. # Back to project root

# ------------------------- Deploy Frontend to Amplify -------------------------

echo ""
echo "🚀 Deploying frontend to Amplify..."

# Create deployment using the target branch
DEPLOYMENT_RESULT=$(aws amplify create-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$TARGET_BRANCH" \
    --output json)

ZIP_UPLOAD_URL=$(echo "$DEPLOYMENT_RESULT" | jq -r '.zipUploadUrl')
JOB_ID=$(echo "$DEPLOYMENT_RESULT" | jq -r '.jobId')

echo "🎯 Job ID: $JOB_ID"

# Upload frontend package
echo "📤 Uploading frontend..."
curl -T frontend/frontend-build.zip "$ZIP_UPLOAD_URL"

# Start deployment
echo "🚀 Starting Amplify frontend deployment..."
aws amplify start-deployment \
    --app-id "$AMPLIFY_APP_ID" \
    --branch-name "$TARGET_BRANCH" \
    --job-id "$JOB_ID"

# Monitor deployment
echo "⏳ Monitoring frontend deployment..."
for i in {1..20}; do
    STATUS=$(aws amplify get-job --app-id $AMPLIFY_APP_ID --branch-name $TARGET_BRANCH --job-id $JOB_ID --query 'job.summary.status' --output text)
    
    if [ "$STATUS" = "SUCCEED" ]; then
        echo "✅ Frontend deployment completed!"
        break
    elif [ "$STATUS" = "FAILED" ]; then
        echo "❌ Frontend deployment failed!"
        aws amplify get-job --app-id $AMPLIFY_APP_ID --branch-name $TARGET_BRANCH --job-id $JOB_ID --query 'job.summary.result'
        exit 1
    else
        echo "  Status: $STATUS (attempt $i/20)"
        sleep 30
    fi
done

# ------------------------- Success -------------------------

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=================================="
echo ""
echo "📊 Your secure PDF Accessibility application:"
echo "  🌐 Frontend URL: $AMPLIFY_URL"
echo "  🌿 Target Branch: $TARGET_BRANCH"
echo "  🔐 User Pool ID: $USER_POOL_ID"
echo "  📱 Amplify App ID: $AMPLIFY_APP_ID"
echo ""
echo "🔧 Next steps:"
echo "  1. Visit your application at: $AMPLIFY_URL"
echo "  2. Test user registration and authentication"
echo "  3. Configure any additional settings in AWS Console"
echo ""
echo "✅ All done!"