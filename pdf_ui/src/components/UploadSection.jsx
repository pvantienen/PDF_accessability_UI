// UploadSection.js
import React, { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function UploadSection({ onUploadComplete, awsCredentials }) {
  const [selectedFile, setSelectedFile] = useState(null);

  // Handle <input type="file" /> change
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Only allow PDFs
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    // Check file size (100 MB = 100 * 1024 * 1024 bytes)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size exceeds 100 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  // Upload to S3
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file before uploading.');
      return;
    }
    if (!awsCredentials) {
      alert('AWS credentials not available yet. Please wait...');
      return;
    }
    try {
      // Create S3 client
      const client = new S3Client({
        region: 'us-east-1',
        credentials: {
          accessKeyId: awsCredentials.accessKeyId,
          secretAccessKey: awsCredentials.secretAccessKey,
          sessionToken: awsCredentials.sessionToken,
        },
      });

      // Prepare the PUT params
      const params = {
        Bucket: 'pdfaccessibility-pdfaccessibilitybucket149b7021e-wurx8blwem2d',
        Key: `pdf/${selectedFile.name}`, // store it inside pdf/ folder
        Body: selectedFile,
      };

      const command = new PutObjectCommand(params);
      const data = await client.send(command);

      console.log('Upload successful:', data);
      // Notify parent component that upload is complete
      onUploadComplete(selectedFile.name);

      // Reset file state
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Only accept PDF */}
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        style={{ marginBottom: '1rem' }}
      />
      <div>
        <button onClick={handleUpload}>Upload To S3</button>
      </div>
    </div>
  );
}

export default UploadSection;
