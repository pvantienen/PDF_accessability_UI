import React, { useState } from 'react';
import './App.css';
import { Header } from './components';
import { UploadPage, ResultsPage } from './pages';
import ProcessingPage from './pages/ProcessingPage';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);

  const handleUploadComplete = (file) => {
    console.log('📤 [APP] Upload completed with data:', file);
    console.log('📄 [APP] File name:', file?.name);
    console.log('🎯 [APP] Format:', file?.format);
    console.log('📊 [APP] File size:', file?.size);
    
    setUploadedFile(file);
    setCurrentPage('processing');
  };

  const handleProcessingComplete = (result) => {
    setProcessedResult(result);
    setCurrentPage('results');
  };

  return (
    <div className="App">
      <Header />
      {currentPage === 'upload' && (
        <UploadPage onUploadComplete={handleUploadComplete} />
      )}
      {currentPage === 'processing' && uploadedFile && (
        <ProcessingPage 
          fileName={uploadedFile.name || 'unknown-file.pdf'}
          fileSize={uploadedFile.size || 0}
          format={uploadedFile.format || 'html'}
          onComplete={handleProcessingComplete}
        />
      )}
      {currentPage === 'processing' && !uploadedFile && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading processing page...</p>
        </div>
      )}
      {currentPage === 'results' && (
        <ResultsPage 
          fileName={uploadedFile?.name} 
          processedResult={processedResult}
          format={uploadedFile?.format}
        />
      )}
    </div>
  );
}

export default App;
