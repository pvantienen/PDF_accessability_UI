# PDF Accessibility Tool

A React application for uploading PDFs and converting them to accessible formats (PDF or HTML) using AWS S3 storage.

## Features

- Upload PDF files with format selection (PDF to PDF or PDF to HTML)
- Automatic S3 upload to appropriate buckets based on selected format
- Real-time processing status monitoring
- Download processed files as ZIP archives
- Responsive design with Material-UI components

## S3 Bucket Configuration

The application uses different S3 buckets based on the selected output format:

- **PDF to PDF**: `pdfaccessibility-pdfaccessibilitybucket149b7021e-bozihkmq6r52`
- **PDF to HTML**: `pdf2html-bucket-390402571123-us-east-1`

Files are uploaded to the `uploads/` folder and processed files are expected in the `remediated/` folder with the prefix `final_`.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AWS credentials (Optional for Demo):**
   
   The app can run in demo mode without AWS credentials. For production use:
   
   Copy `.env.example` to `.env` and add your AWS credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your AWS credentials:
   ```
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
   REACT_APP_AWS_REGION=us-east-1
   REACT_APP_COGNITO_IDENTITY_POOL_ID=your_cognito_identity_pool_id
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## Demo Mode

If no AWS credentials are configured, the app runs in demo mode:
- File uploads are simulated (no actual S3 upload)
- Processing is simulated with faster completion (30 seconds vs 10 minutes)
- Download URLs are mocked
- All functionality works for demonstration purposes

## Usage

1. **Select Output Format**: Choose between "PDF to PDF" or "PDF to HTML"
2. **Upload File**: Select a PDF file (max 25MB, max 10 pages)
3. **Processing**: The app uploads to S3 and monitors for processed files
4. **Download**: Once processing is complete, download the ZIP file

## File Structure

```
src/
├── components/
│   ├── UploadContainer.js     # File upload and format selection
│   ├── ProcessingContainer.js # Processing status and monitoring
│   ├── ResultsContainer.js    # Download and results display
│   └── ...
├── services/
│   └── s3Service.js          # AWS S3 operations
├── pages/
│   ├── UploadPage.js
│   ├── ProcessingPage.js
│   └── ResultsPage.js
└── App.js                    # Main application component
```

## AWS Permissions

Ensure your AWS credentials have the following permissions for the S3 buckets:

- `s3:PutObject` - Upload files to uploads/ folder
- `s3:ListBucket` - Check for processed files in remediated/ folder
- `s3:GetObject` - Download processed files

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner

### `npm run build`
Builds the app for production

### `npm run eject`
Ejects from Create React App (one-way operation)

## Processing Flow

1. User selects format and uploads PDF
2. File is uploaded to appropriate S3 bucket's `uploads/` folder
3. App polls the `remediated/` folder for `final_<filename>`
4. Once found, user can download the processed ZIP file

## Error Handling

- File size validation (25MB limit)
- Upload error display
- Processing timeout (10 minutes)
- Network error handling
- Browser compatibility fallbacks

## Troubleshooting

### "readableStream.getReader is not a function" Error

This error occurs when the AWS SDK tries to use Node.js streams in the browser. The app now automatically:

1. **Converts files to ArrayBuffer** for browser compatibility
2. **Falls back to demo mode** if upload fails
3. **Handles CORS issues** gracefully

### S3 CORS Configuration

If you get CORS errors, configure your S3 buckets:

```bash
# Run the CORS setup script
./setup-s3-cors.sh

# Or manually configure via AWS CLI
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://s3-cors-config.json
```

### Common Issues

1. **Credentials not working**: Check `.env` file and restart server
2. **CORS errors**: Run CORS setup script
3. **Upload timeouts**: Check file size (max 25MB)
4. **Demo mode stuck**: Verify AWS credentials in `.env`

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
