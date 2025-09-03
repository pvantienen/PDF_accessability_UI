#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkBackendStack, CdkBackendStackProps } from '../lib/cdk_backend-stack';
import { AmplifyHostingStack } from "../lib/amplify-hosting-stack";
require("dotenv").config();

// Check if we're running bootstrap
const isBootstrap = process.argv.includes('bootstrap');

// Get CDK context values (passed via --context)
const app = new cdk.App();
const deployTarget = app.node.tryGetContext('deploy') || 'both';
const environment = app.node.tryGetContext('env') || 'dev';

// Skip validation and deployment logic during bootstrap
if (isBootstrap) {
  console.log('🔄 Bootstrap mode detected - skipping stack deployment');
  console.log('💡 After bootstrap completes, deploy with:');
  console.log('   cdk deploy --context deploy=amplify    # Deploy Amplify first');
  console.log('   cdk deploy --context deploy=backend    # Deploy backend after setting env vars');
  console.log('   cdk deploy --context deploy=both       # Deploy both stacks');
  process.exit(0);
}

// Validate deployment target
const validTargets = ['amplify', 'backend', 'both'];
if (!validTargets.includes(deployTarget)) {
  console.error("❌ Invalid deployment target");
  console.error("Usage: cdk deploy --context deploy=<target> [--context env=<environment>]");
  console.error("Valid targets: amplify, backend, both");
  console.error("Valid environments: dev, staging, prod (default: dev)");
  process.exit(1);
}

console.log(`🚀 Deploying: ${deployTarget}`);
console.log(`🌍 Environment: ${environment}`);

// Environment-specific configuration
const envConfig = {
  dev: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
  staging: {
    account: process.env.AWS_ACCOUNT_STAGING || process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION_STAGING || process.env.AWS_REGION,
  },
  prod: {
    account: process.env.AWS_ACCOUNT_PROD || process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION_PROD || process.env.AWS_REGION,
  }
};

const currentEnv = envConfig[environment as keyof typeof envConfig];

// Base required environment variables
const baseRequiredVars = {
  AWS_ACCOUNT: currentEnv.account,
  AWS_REGION: currentEnv.region,
};

// Stack-specific required environment variables
const amplifyRequiredVars = {
  ...baseRequiredVars,
  // Add amplify-specific vars if needed
};

const backendRequiredVars = {
  ...baseRequiredVars,
  AMPLIFY_URL: process.env.AMPLIFY_URL,
  AMPLIFY_APP_ID: process.env.AMPLIFY_APP_ID,
  PDF_TO_PDF_BUCKET_ARN: process.env.PDF_TO_PDF_BUCKET_ARN,
  PDF_TO_HTML_BUCKET_ARN: process.env.PDF_TO_HTML_BUCKET_ARN,
};

// Function to validate environment variables
function validateEnvVars(requiredVars: Record<string, string | undefined>, stackName: string): boolean {
  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables for ${stackName}:`);
    missingVars.forEach(varName => console.error(` - ${varName}`));
    
    if (stackName === 'Backend') {
      console.error("\n🔧 Backend stack requires:");
      console.error(" - AMPLIFY_URL: The Amplify app URL");
      console.error(" - AMPLIFY_APP_ID: The Amplify app ID");
      console.error(" - PDF_TO_PDF_BUCKET_ARN: ARN of the PDF-to-PDF bucket");
      console.error(" - PDF_TO_HTML_BUCKET_ARN: ARN of the PDF-to-HTML bucket");
    }
    
    console.error("\n🔧 Base requirements:");
    console.error(" - AWS_ACCOUNT: Your AWS account ID");
    console.error(" - AWS_REGION: Your AWS region (e.g., us-west-2)");
    
    return false;
  }
  
  console.log(`✅ Environment variables validated for ${stackName}:`);
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (key.includes('ARN') || key.includes('URL')) {
      console.log(` - ${key}: ${value ? '✓ Set' : '✗ Missing'}`);
    } else {
      console.log(` - ${key}: ${value}`);
    }
  });
  
  return true;
}

// Helper function to create stack names with environment suffix
function getStackName(baseName: string, environment: string): string {
  return environment === 'dev' ? baseName : `${baseName}-${environment}`;
}

// Deploy Amplify stack
if (deployTarget === 'amplify' || deployTarget === 'both') {
  if (!validateEnvVars(amplifyRequiredVars, 'Amplify')) {
    process.exit(1);
  }

  const stackName = getStackName('AmplifyHostingStack', environment);
  const amplify = new AmplifyHostingStack(app, stackName, {
    env: currentEnv,
    description: `${environment.toUpperCase()} Environment Stack for PDF Accessibility V1 FRONTEND APP - Manual Deployment`,
    // Add amplify-specific props here if needed
  });

  // Add tags for better resource management
  cdk.Tags.of(amplify).add('Environment', environment);
  cdk.Tags.of(amplify).add('StackType', 'Frontend');

  console.log(`📦 Amplify stack configured: ${stackName}`);
}

// Deploy Backend stack
if (deployTarget === 'backend' || deployTarget === 'both') {
  if (!validateEnvVars(backendRequiredVars, 'Backend')) {
    process.exit(1);
  }

  const stackName = getStackName('CdkBackendStack', environment);
  const backendProps: CdkBackendStackProps = {
    env: currentEnv,
    description: `${environment.toUpperCase()} Environment Stack for PDF Accessibility V1 BACKEND`,
    // Backend-specific configuration
    amplifyWebsiteUrl: process.env.AMPLIFY_URL!,
    pdfToPdfBucketArn: process.env.PDF_TO_PDF_BUCKET_ARN!,
    pdfToHtmlBucketArn: process.env.PDF_TO_HTML_BUCKET_ARN!,
  };

  const backend = new CdkBackendStack(app, stackName, backendProps);
  
  // Add tags for better resource management
  cdk.Tags.of(backend).add('Environment', environment);
  cdk.Tags.of(backend).add('StackType', 'Backend');

  console.log(`📦 Backend stack configured: ${stackName}`);
  console.log(`🔗 Using Amplify URL: ${process.env.AMPLIFY_URL}`);
}

console.log(`\n🎯 Deployment target: ${deployTarget}`);
console.log(`🌍 Environment: ${environment}`);
console.log("🚀 CDK synthesis complete - ready for deployment!");