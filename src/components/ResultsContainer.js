import React, { useState } from 'react';
import './ResultsContainer.css';
import ReportModal from './ReportModal';
import img from "../assets/circle-check-big.svg";
import img1 from "../assets/clock-4.svg";
import s3Service from '../services/s3Service';

const ResultsContainer = ({ fileName, processedResult, format, fileSize = "1.2 MB", processingTime = "5:00 minutes" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleViewReport = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDownload = async () => {
    if (!processedResult || !format || !fileName) {
      alert('Download information not available');
      return;
    }

    setIsDownloading(true);
    try {
      const downloadUrl = await s3Service.getDownloadUrl(format, fileName);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = processedResult.fileName || `final_${fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="results-container">
      <div className="results-content">
        <div className="success-icon">
          <img alt="" className="block max-w-none size-full" src={img} />
        </div>
        
        <h2>PDF Remediation Successful</h2>
        
        <div className="processing-info">
          <div className="processing-time">
            <img alt="" className="block max-w-none size-full" src={img1} />
            <span>Total Processing Time: {processingTime}</span>
          </div>
          <p className="description">Your PDF has been successfully remediated for accessibility</p>
        </div>
        
        <div className="file-info">
          <span>{fileName} • {fileSize}</span>
        </div>
        
        <div className="button-group">
          <button className="view-report-btn" onClick={handleViewReport}>View Report</button>
          <button 
            className="download-btn" 
            onClick={handleDownload}
            disabled={isDownloading || !processedResult}
          >
            {isDownloading ? 'Downloading...' : 'Download ZIP File'}
          </button>
        </div>
        
        <ReportModal isOpen={isModalOpen} onClose={handleCloseModal} />
      </div>
    </div>
  );
};

export default ResultsContainer;