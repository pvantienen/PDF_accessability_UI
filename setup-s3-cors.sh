#!/bin/bash

# S3 bucket names
PDF_BUCKET="pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52"
HTML_BUCKET="pdf2html-bucket-390402571123-us-east-1"

echo "Setting up CORS configuration for S3 buckets..."

# Try simple CORS configuration first
echo "Using simple CORS configuration (recommended)..."

# Configure CORS for PDF bucket
echo "Configuring CORS for PDF bucket: $PDF_BUCKET"
aws s3api put-bucket-cors \
  --bucket $PDF_BUCKET \
  --cors-configuration file://s3-cors-simple.json

if [ $? -eq 0 ]; then
  echo "✅ PDF bucket CORS configured successfully"
else
  echo "❌ Failed to configure PDF bucket CORS"
fi

# Configure CORS for HTML bucket
echo "Configuring CORS for HTML bucket: $HTML_BUCKET"
aws s3api put-bucket-cors \
  --bucket $HTML_BUCKET \
  --cors-configuration file://s3-cors-simple.json

if [ $? -eq 0 ]; then
  echo "✅ HTML bucket CORS configured successfully"
else
  echo "❌ Failed to configure HTML bucket CORS"
fi

echo ""
echo "CORS configuration complete!"
echo ""
echo "To verify CORS configuration:"
echo "aws s3api get-bucket-cors --bucket $PDF_BUCKET"
echo "aws s3api get-bucket-cors --bucket $HTML_BUCKET"
echo ""
echo "If you need to remove CORS configuration:"
echo "aws s3api delete-bucket-cors --bucket $PDF_BUCKET"
echo "aws s3api delete-bucket-cors --bucket $HTML_BUCKET"