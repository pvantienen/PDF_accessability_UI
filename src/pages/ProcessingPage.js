import React from 'react';
import ProcessingContainer from '../components/ProcessingContainer';

const ProcessingPage = ({ fileName, fileSize, format, onComplete }) => {
  console.log('📋 [PROCESSING PAGE] Received props:');
  console.log('📄 [PROCESSING PAGE] fileName:', fileName);
  console.log('📊 [PROCESSING PAGE] fileSize:', fileSize);
  console.log('🎯 [PROCESSING PAGE] format:', format);
  
  return <ProcessingContainer fileName={fileName} fileSize={fileSize} format={format} onComplete={onComplete} />;
};

export default ProcessingPage;