import '@aws-amplify/ui-react/styles.css';
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { useState } from 'react';

const UploadSection = ({ onUploadComplete }) => {
  const [files, setFiles] = useState({}); // Track files and their statuses

  return (
    <>
      <FileUploader
        acceptedFileTypes={['.pdf']}
        path="pdf/"  // Upload files to the 'pdf/' path in S3
        maxFileCount={1}  // Allow only one file upload at a time
        displayText={{
          dropFilesText: 'Drop files here',
          browseFilesText: 'Browse files',
          getFilesUploadedText(count) {
            return `${count} PDF files uploaded`;
          },
        }}
        aria-label="File uploader for PDF documents" // Accessible label for screen readers
        onUploadSuccess={({ key }) => {
          const cleanedKey = key.replace('pdf/', '');

          console.log('Upload successful, file key:', cleanedKey);

          // Update the file status to 'success' with the cleaned key
          setFiles((prevFiles) => ({
            ...prevFiles,
            [cleanedKey]: { status: 'success' },
          }));

          // Pass the cleaned key (filename without 'pdf/') back to the parent component
          onUploadComplete(cleanedKey);
        }}
      />
    </>
  );
};

export default UploadSection;
