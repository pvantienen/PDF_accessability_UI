#!/bin/bash

# Create IAM user
echo "Creating IAM user: pdf-accessibility-app-user"
aws iam create-user --user-name pdf-accessibility-app-user

# Create the policy
echo "Creating IAM policy: PDFAccessibilityAppPolicy"
aws iam create-policy \
  --policy-name PDFAccessibilityAppPolicy \
  --policy-document file://aws-policy.json

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach policy to user
echo "Attaching policy to user"
aws iam attach-user-policy \
  --user-name pdf-accessibility-app-user \
  --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/PDFAccessibilityAppPolicy

# Create access keys
echo "Creating access keys"
aws iam create-access-key --user-name pdf-accessibility-app-user

echo "Setup complete! Use the Access Key ID and Secret Access Key in your .env file"