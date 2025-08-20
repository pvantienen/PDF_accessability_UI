import React from 'react';
import { InformationBlurb, HeroSection, UploadContainer } from '../components';
import './UploadPage.css';

const UploadPage = ({ onUploadComplete }) => {
  return (
    <div className="upload-page">
      <HeroSection />
      <div className="page-content">
        <UploadContainer onUploadComplete={onUploadComplete} />
      </div>
      <div className="information-section">
        <InformationBlurb />
      </div>
    </div>
  );
};

export default UploadPage;