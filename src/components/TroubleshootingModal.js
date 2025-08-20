import React, { useState } from 'react';
import s3Service from '../services/s3Service';

const TroubleshootingModal = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResults({});

    const results = {
      credentials: false,
      pdfConnection: false,
      htmlConnection: false,
      corsTest: false
    };

    // Test 1: Check credentials
    console.log('🔍 Testing AWS credentials...');
    results.credentials = !!(process.env.REACT_APP_AWS_ACCESS_KEY_ID && process.env.REACT_APP_AWS_SECRET_ACCESS_KEY);
    
    // Test 2: Test S3 connections
    if (results.credentials) {
      console.log('🔍 Testing S3 connections...');
      results.pdfConnection = await s3Service.testConnection('pdf');
      results.htmlConnection = await s3Service.testConnection('html');
    }

    setTestResults(results);
    setTesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content troubleshooting-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AWS Configuration Troubleshooting</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="diagnostics-section">
            <h3>Current Configuration</h3>
            <div className="config-item">
              <span className="config-label">AWS Access Key:</span>
              <span className={`config-value ${process.env.REACT_APP_AWS_ACCESS_KEY_ID ? 'success' : 'error'}`}>
                {process.env.REACT_APP_AWS_ACCESS_KEY_ID ? '✅ Configured' : '❌ Not Set'}
              </span>
            </div>
            <div className="config-item">
              <span className="config-label">AWS Secret Key:</span>
              <span className={`config-value ${process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ? 'success' : 'error'}`}>
                {process.env.REACT_APP_AWS_SECRET_ACCESS_KEY ? '✅ Configured' : '❌ Not Set'}
              </span>
            </div>
            <div className="config-item">
              <span className="config-label">Region:</span>
              <span className="config-value">us-east-1</span>
            </div>
          </div>

          <div className="test-section">
            <button 
              className="test-btn" 
              onClick={runDiagnostics}
              disabled={testing}
            >
              {testing ? 'Running Tests...' : 'Run Connection Tests'}
            </button>

            {Object.keys(testResults).length > 0 && (
              <div className="test-results">
                <h4>Test Results:</h4>
                <div className="result-item">
                  <span>Credentials:</span>
                  <span className={testResults.credentials ? 'success' : 'error'}>
                    {testResults.credentials ? '✅ Valid' : '❌ Missing'}
                  </span>
                </div>
                <div className="result-item">
                  <span>PDF Bucket Connection:</span>
                  <span className={testResults.pdfConnection ? 'success' : 'error'}>
                    {testResults.pdfConnection ? '✅ Connected' : '❌ Failed'}
                  </span>
                </div>
                <div className="result-item">
                  <span>HTML Bucket Connection:</span>
                  <span className={testResults.htmlConnection ? 'success' : 'error'}>
                    {testResults.htmlConnection ? '✅ Connected' : '❌ Failed'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="help-section">
            <h4>Common Issues & Solutions:</h4>
            <div className="help-item">
              <strong>"Failed to fetch" Error:</strong>
              <p>This usually indicates a CORS issue. Run: <code>./setup-s3-cors.sh</code></p>
            </div>
            <div className="help-item">
              <strong>Credentials Not Working:</strong>
              <p>1. Check your .env file<br/>2. Restart the development server<br/>3. Verify IAM permissions</p>
            </div>
            <div className="help-item">
              <strong>Demo Mode:</strong>
              <p>The app automatically falls back to demo mode when AWS is not configured. This is normal for testing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootingModal;