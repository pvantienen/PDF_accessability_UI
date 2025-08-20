# S3 CORS Configuration Guide

## Quick Fix via AWS CLI

Run the setup script:
```bash
./setup-s3-cors.sh
```

## Manual Setup via AWS Console

### Step 1: Navigate to S3 Console
1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Select your bucket: `pdf2html-bucket-390402571123-us-east-1`

### Step 2: Configure CORS
1. Click on the **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Replace the content with this configuration:

```json
[
  {
    "AllowedHeaders": [
      "Authorization",
      "Content-Type",
      "Content-Length",
      "x-amz-date",
      "x-amz-content-sha256",
      "x-amz-security-token"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save changes**

### Step 3: Repeat for PDF Bucket
Repeat the same process for: `pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52`

## Alternative: Minimal CORS Configuration

If the above doesn't work, try this minimal configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Troubleshooting

### Common Issues:
1. **Wildcard Error**: Don't use `*` in `ExposeHeaders`
2. **Origin Mismatch**: Make sure `AllowedOrigins` matches your dev server URL
3. **Method Not Allowed**: Ensure `PUT` and `POST` are in `AllowedMethods`

### Verify Configuration:
```bash
# Check CORS configuration
aws s3api get-bucket-cors --bucket pdf2html-bucket-390402571123-us-east-1
aws s3api get-bucket-cors --bucket pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52
```

### Remove CORS (if needed):
```bash
# Remove CORS configuration
aws s3api delete-bucket-cors --bucket pdf2html-bucket-390402571123-us-east-1
aws s3api delete-bucket-cors --bucket pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52
```

## Production Considerations

For production deployment, update `AllowedOrigins` to include your production domain:

```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://your-production-domain.com"
]
```