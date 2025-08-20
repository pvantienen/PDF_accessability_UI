import React, { useState } from 'react';
import './UploadContainer.css';
import imgFileQuestion from '../assets/file-question.svg';
import imgFileText from '../assets/file-text.svg';
import imgCodeXml from '../assets/code-xml.svg';
import s3Service from '../services/s3Service';
import TroubleshootingModal from './TroubleshootingModal';
import './TroubleshootingModal.css';

const UploadContainer = ({ onUploadComplete }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
  };

  const uploadToS3 = async (file) => {
    console.log('🚀 [UPLOAD] Starting upload process...');
    console.log('📄 [UPLOAD] File:', file.name);
    console.log('🎯 [UPLOAD] Format:', selectedFormat);
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const result = await s3Service.uploadFile(file, selectedFormat, setUploadProgress);
      
      console.log('📤 [UPLOAD] Upload result:', result);
      
      if (result.success) {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          format: selectedFormat,
          s3Key: result.key,
          bucket: result.bucket,
          mock: result.mock || false
        };
        
        console.log('✅ [UPLOAD] Calling onUploadComplete with:', fileData);
        console.log('📄 [UPLOAD] File name check:', fileData.name);
        console.log('🎯 [UPLOAD] Format check:', fileData.format);
        
        // Call immediately instead of setTimeout to avoid timing issues
        onUploadComplete?.(fileData);
        setIsUploading(false);
      } else {
        console.error('❌ [UPLOAD] Upload was not successful:', result);
        setUploadError('Upload failed');
        setIsUploading(false);
      }
    } catch (error) {
      console.error('❌ [UPLOAD] Upload error:', error);
      setUploadError(error.message);
      setIsUploading(false);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (25MB limit)
        if (file.size > 25 * 1024 * 1024) {
          setUploadError('File size exceeds 25MB limit');
          return;
        }
        
        setSelectedFile(file);
        uploadToS3(file);
      }
    };
    input.click();
  };



  if (selectedFormat === 'pdf' || selectedFormat === 'html') {
    const formatTitle = selectedFormat === 'pdf' ? 'PDF to PDF' : 'PDF to HTML';
    const formatIcon = selectedFormat === 'pdf' ? imgFileText : imgCodeXml;
    
    if (selectedFile) {
      return (
        <div className="upload-container-selected">
          <div className="upload-content">
            <div className="upload-header">
              <div className="file-icon">
                <img src={formatIcon} alt="" width="40" height="40" />
              </div>
              <div className="upload-title">
                <h2>{formatTitle}</h2>
              </div>
            </div>
            
            <div className="upload-progress">
              <div className="file-info">
                <span className="file-name">{selectedFile.name} • {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                <span className="progress-percent">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
            
            {uploadError && (
              <div className="upload-error">
                <p>Upload failed: {uploadError}</p>
              </div>
            )}
            
            <div className="upload-buttons">
              <button 
                className="change-file-btn" 
                onClick={() => {
                  setSelectedFile(null);
                  setUploadProgress(0);
                  setUploadError(null);
                  setIsUploading(false);
                }}
                disabled={isUploading}
              >
                Choose New PDF
              </button>
            </div>
          </div>
          
          <div className="disclaimer">
            <p>This solution does not remediate for fillable forms and color selection/ contrast for people with color blindness</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="upload-container-selected">
        <div className="upload-content">
          <div className="upload-header">
            <div className="file-icon">
              <img src={formatIcon} alt="" width="40" height="40" />
            </div>
            <div className="upload-title">
              <h2>{formatTitle}</h2>
            </div>
          </div>
          
          <div className="upload-instructions">
            <p className="upload-main-text">Drop your PDF here or click to browse</p>
            <p className="upload-sub-text">Maximum file size: 25MB • Maximum pages: 10</p>
          </div>
          
          {uploadError && (
            <div className="upload-error">
              <p>{uploadError}</p>
            </div>
          )}
          
          <div className="upload-buttons">
            <button className="change-format-btn" onClick={() => setSelectedFormat(null)}>
              Change Output Format
            </button>
            <button className="upload-btn" onClick={handleFileSelect} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
        </div>
        
        <div className="disclaimer">
          <p>This solution does not remediate for fillable forms and color selection/ contrast for people with color blindness</p>
          {uploadError && uploadError.includes('Failed to fetch') && (
            <div className="troubleshooting-hint">
              <p>Having connection issues? <button className="troubleshoot-link" onClick={() => setShowTroubleshooting(true)}>Run diagnostics</button></p>
            </div>
          )}
        </div>
        
        <TroubleshootingModal 
          isOpen={showTroubleshooting} 
          onClose={() => setShowTroubleshooting(false)} 
        />
      </div>
    );
  }

  return (
    <div className="upload-container">
      <div className="upload-content">
        <div className="upload-header">
          <div className="file-icon">
            <img src={imgFileQuestion} alt="" width="40" height="40" />
          </div>
          <div className="upload-title">
            <h2>Choose Output Format</h2>
          </div>
        </div>
        
        <div className="format-options">
          <div 
            className={`format-option ${selectedFormat === 'pdf' ? 'selected' : ''}`}
            onClick={() => handleFormatSelect('pdf')}
          >
            <div className="format-header">
              <div className="format-icon">
                <img src={imgFileText} alt="" width="24" height="24" />
              </div>
              <span className="format-name">PDF to PDF</span>
            </div>
            <p className="format-description">
              Improve accessibility and maintain document structure
            </p>
          </div>
          
          <div 
            className={`format-option ${selectedFormat === 'html' ? 'selected' : ''}`}
            onClick={() => handleFormatSelect('html')}
          >
            <div className="format-header">
              <div className="format-icon">
                <img src={imgCodeXml} alt="" width="24" height="24" />
              </div>
              <span className="format-name">PDF to HTML</span>
            </div>
            <p className="format-description">
              Convert document to accessible HTML version
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadContainer;