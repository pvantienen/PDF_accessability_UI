import '@aws-amplify/ui-react/styles.css';
import { FileUploader } from '@aws-amplify/ui-react-storage';

const UploadSection = () => {
  return (
    <FileUploader
      acceptedFileTypes={['.pdf']}
      path="public/"
      maxFileCount={100}
      displayText={{
        // some text are plain strings
        dropFilesText: 'drag-and-drop here',
        browseFilesText: 'Open file picker',
        // others are functions that take an argument
        getFilesUploadedText(count) {
          return `${count} pdf uploaded`;
        },
      }}
    />
  );
};

export default UploadSection;