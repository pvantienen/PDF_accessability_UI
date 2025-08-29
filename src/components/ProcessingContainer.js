import React, { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import './ProcessingContainer.css';
import img from "../assets/file-clock.svg";
import img1 from "../assets/clock-4.svg";
import s3Service from '../services/s3Service';

const ProcessingContainer = ({ fileName, fileSize, format, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('processing');
  const [error, setError] = useState(null);
  const auth = useAuth();

  const steps = [
    {
      title: "Analyzing Document Structure",
      description: "Scanning PDF for accessibility issues"
    },
    {
      title: "Adding Accessibility Tags",
      description: "Implementing WCAG 2.1 compliance"
    },
    {
      title: "Adding Metadata",
      description: "Final accessibility enhancements"
    },
    {
      title: "Generating Accessible PDF",
      description: "Creating your accessible PDF document"
    }
  ];

  useEffect(() => {
    // Update S3Service with current auth state
    s3Service.updateAuthState(
      auth.user?.id_token,
      auth.isAuthenticated
    );
  }, [auth.isAuthenticated, auth.user?.id_token]);

  useEffect(() => {
    console.log('🔍 [PROCESSING CONTAINER] useEffect triggered with props:');
    console.log('📄 [PROCESSING CONTAINER] fileName:', fileName);
    console.log('🎯 [PROCESSING CONTAINER] format:', format);
    console.log('📊 [PROCESSING CONTAINER] fileSize:', fileSize);

    if (!fileName || !format) {
      console.warn('⚠️ [PROCESSING CONTAINER] Missing required props:');
      console.warn('📄 fileName:', fileName);
      console.warn('🎯 format:', format);
      console.warn('🔄 Will retry when props are available...');
      return;
    }

    console.log(`\n🎬 [PROCESSING] ===== STARTING PROCESSING CONTAINER =====`);
    console.log(`📄 [PROCESSING] File: ${fileName}`);
    console.log(`🎯 [PROCESSING] Format: ${format}`);
    console.log(`🕐 [PROCESSING] Started at: ${new Date().toLocaleTimeString()}`);

    // Start time tracking immediately
    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (newTime % 30 === 0) {
          console.log(`⏰ [PROCESSING] Timer update: ${Math.floor(newTime / 60)}:${(newTime % 60).toString().padStart(2, '0')} elapsed`);
        }
        return newTime;
      });
    }, 1000);

    // Simulate progress and steps while polling
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 85) {
          const newProgress = prev + Math.random() * 1.5;
          return newProgress;
        }
        return prev;
      });
    }, 3000);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < 4) {
          const newStep = prev + 1;
          console.log(`📋 [PROCESSING] Moving to step ${newStep}: ${steps[newStep - 1]?.title}`);
          return newStep;
        }
        return prev;
      });
    }, 30000); // Change step every 30 seconds to match polling

    console.log(`🚀 [PROCESSING] Starting S3 polling service...`);

    // Start S3 polling for processed file
    s3Service.startPolling(
      format,
      fileName,
      (status) => {
        console.log(`📊 [PROCESSING] Status update: ${status}`);
        setProcessingStatus(status);
      },
      (result) => {
        // Processing complete
        console.log(`\n🎉 [PROCESSING] ===== PROCESSING COMPLETED! =====`);
        console.log(`📄 [PROCESSING] Result:`, result);

        setProgress(100);
        setCurrentStep(4);
        setProcessingStatus('completed');
        clearInterval(progressInterval);
        clearInterval(stepInterval);

        setTimeout(() => {
          if (onComplete) {
            const outputFileName = result.mock ?
              `${fileName.replace('.pdf', '.zip')}` :
              result.key.split('/').pop();

            onComplete({
              downloadUrl: result.key,
              bucket: result.bucket,
              fileName: outputFileName,
              ...result
            });
          }
        }, 1000);
      },
      (error) => {
        // Processing failed
        console.error(`\n❌ [PROCESSING] ===== PROCESSING FAILED =====`);
        console.error(`🚨 [PROCESSING] Error:`, error.message);

        setError(error.message);
        setProcessingStatus('error');
        clearInterval(progressInterval);
        clearInterval(stepInterval);
      }
    );

    return () => {
      console.log(`🛑 [PROCESSING] Cleaning up intervals...`);
      clearInterval(progressInterval);
      clearInterval(timeInterval);
      clearInterval(stepInterval);
    };
  }, [fileName, format, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} minutes`;
  };

  return (
    <div className="processing-container">
      <div className="processing-content">
        <div className="processing-header">
          <div className="file-clock-icon">
            <img alt="" className="block max-w-none size-full" src={img} />
          </div>
          <h2>Remediating Your PDF</h2>
        </div>

        <div className="processing-info">
          <div className="time-info">
            <img alt="" className="block max-w-none size-full" src={img1} />
            <span>Time Elapsed: {formatTime(timeElapsed)}</span>
          </div>
          {error ? (
            <p className="processing-error">
              Processing failed: {error}
            </p>
          ) : (
            <p className="processing-description">
              {processingStatus === 'completed'
                ? 'Processing completed successfully!'
                : 'Remediation process typically takes a few minutes to complete depending on the document complexity'
              }
            </p>
          )}
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>

          <div className="steps-list">
            {steps.map((step, index) => (
              <div key={index} className="step-item">
                <div className={`step-number ${index + 1 <= currentStep ? 'active' : ''}`}>
                  {index + 1}
                </div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingContainer;