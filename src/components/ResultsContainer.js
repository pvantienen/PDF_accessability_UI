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
      console.log('Starting download for:', { fileName, format });
      
      // Get the signed URL from S3 service
      const downloadResult = await s3Service.getDownloadUrl(format, fileName);
      console.log('Download result:', downloadResult);
      
      // Extract the URL from the result object
      const downloadUrl = downloadResult.url || downloadResult;
      
      if (!downloadUrl) {
        throw new Error('No download URL received');
      }

      console.log('Using download URL:', downloadUrl);
      
      // Method 1: Try window.open first (bypasses React Router)
      const downloadWindow = window.open(downloadUrl, '_blank');
      
      // Fallback: If popup blocked, use temporary link method
      if (!downloadWindow || downloadWindow.closed) {
        console.log('Popup blocked, using link method');
        
        // Method 2: Create temporary link and force download
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Set download filename based on format
        let downloadFileName;
        if (format === 'html') {
          // For HTML format, expect a .zip file
          const baseFileName = fileName.replace(/\.pdf$/i, '');
          downloadFileName = `${baseFileName}.zip`;
        } else {
          // For PDF format, keep original name with prefix
          downloadFileName = `COMPLIANT_${fileName}`;
        }
        
        link.download = downloadFileName;
        link.target = '_blank';
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If window.open worked, close it after a short delay (the download should start)
        setTimeout(() => {
          if (downloadWindow && !downloadWindow.closed) {
            downloadWindow.close();
          }
        }, 1000);
      }
      
      console.log('Download initiated successfully');
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Download failed. Please try again.';
      
      if (error.message.includes('File not found')) {
        errorMessage = 'File not ready yet. Please wait for processing to complete.';
      } else if (error.message.includes('Access denied')) {
        errorMessage = 'Access denied. Please check permissions or contact support.';
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  // Alternative download method using fetch (uncomment if the above doesn't work)
  const handleDownloadViaFetch = async () => {
    if (!processedResult || !format || !fileName) {
      alert('Download information not available');
      return;
    }

    setIsDownloading(true);
    try {
      console.log('Starting fetch download for:', { fileName, format });
      
      // Get the signed URL from S3 service
      const downloadResult = await s3Service.getDownloadUrl(format, fileName);
      const downloadUrl = downloadResult.url || downloadResult;
      
      if (!downloadUrl) {
        throw new Error('No download URL received');
      }

      console.log('Fetching file from:', downloadUrl);
      
      // Fetch the file content
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      
      // Create a blob URL and download
      const blobUrl = URL.createObjectURL(blob);
      
      // Set download filename based on format
      let downloadFileName;
      if (format === 'html') {
        const baseFileName = fileName.replace(/\.pdf$/i, '');
        downloadFileName = `${baseFileName}.zip`;
      } else {
        downloadFileName = `COMPLIANT_${fileName}`;
      }
      
      // Create and click download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      
      console.log('Download completed successfully');
      
    } catch (error) {
      console.error('Fetch download failed:', error);
      
      let errorMessage = 'Download failed. Please try again.';
      
      if (error.message.includes('File not found')) {
        errorMessage = 'File not ready yet. Please wait for processing to complete.';
      } else if (error.message.includes('Access denied') || error.message.includes('403')) {
        errorMessage = 'Access denied. Please check permissions or contact support.';
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Authentication error. Please refresh the page and try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      alert(errorMessage);
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
            title={isDownloading ? 'Downloading...' : 'Download the processed file'}
          >
            {isDownloading ? 'Downloading...' : 'Download ZIP File'}
          </button>
          {/* Uncomment this button if the main download doesn't work */}
          {/* <button 
            className="download-btn" 
            onClick={handleDownloadViaFetch}
            disabled={isDownloading || !processedResult}
            style={{ marginLeft: '10px' }}
          >
            {isDownloading ? 'Downloading...' : 'Download (Fetch Method)'}
          </button> */}
        </div>
        
        <ReportModal isOpen={isModalOpen} onClose={handleCloseModal} />
      </div>
    </div>
  );
};

export default ResultsContainer;