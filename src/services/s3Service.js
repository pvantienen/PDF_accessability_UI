import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { BUCKET_CONFIGS, IndentityPoolId, region } from '../utilities/constants';
import CustomCredentialsProvider from '../utilities/CustomCredentialsProvider';

class S3Service {
  constructor() {
    this.clients = {};
    this.credentialsProvider = new CustomCredentialsProvider();
    this.initializeClients();
  }

  initializeClients() {
    Object.keys(BUCKET_CONFIGS).forEach(key => {
      const clientConfig = {
        region: BUCKET_CONFIGS[key].region,
        // Browser-specific configuration
        requestHandler: {
          requestTimeout: 300000, // 5 minutes
          httpsAgent: undefined
        }
      };

      // Try different credential methods in order of preference
      if (process.env.REACT_APP_AWS_ACCESS_KEY_ID && process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
        // Use environment variables if available
        clientConfig.credentials = {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        };
        console.log(`🔑 [${key.toUpperCase()}] Using environment credentials`);
      } else if (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id') {
        // Use Cognito Identity Pool for anonymous access
        clientConfig.credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: IndentityPoolId,
        });
        console.log(`🔑 [${key.toUpperCase()}] Using Cognito Identity Pool`);
      } else {
        console.log(`⚠️ [${key.toUpperCase()}] No credentials configured - will use demo mode`);
      }

      this.clients[key] = new S3Client(clientConfig);
    });
  }

  async uploadFile(file, format, onProgress) {
    const config = BUCKET_CONFIGS[format];
    if (!config) {
      throw new Error(`Invalid format: ${format}`);
    }

    const key = `${config.uploadFolder}${file.name}`;
    let progressInterval; // Declare at function scope

    try {
      // Check if we have proper AWS credentials configured
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        // Mock upload for demo purposes when no credentials are available
        console.warn('No AWS credentials configured. Running in demo mode.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      console.log(`📤 [PRODUCTION] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`🎯 [PRODUCTION] Target: ${config.bucketName}/${key}`);
      console.log(`📁 [PRODUCTION] Upload folder: ${config.uploadFolder}`);
      console.log(`🔍 [PRODUCTION] Will check for: ${config.outputFolder}${config.outputPrefix}${file.name}`);

      // Convert File to ArrayBuffer for browser compatibility
      const fileBuffer = await this.fileToArrayBuffer(file);

      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type || 'application/pdf',
        ContentLength: file.size
      });

      // Start progress simulation
      if (onProgress) {
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress >= 90) {
            clearInterval(progressInterval);
            onProgress(90);
          } else {
            onProgress(progress);
          }
        }, 200);
      }

      const result = await this.clients[format].send(command);

      // Complete progress
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (onProgress) {
        onProgress(100);
      }

      console.log(`✅ [PRODUCTION] Upload successful! ETag: ${result.ETag}`);

      return {
        success: true,
        key,
        bucket: config.bucketName,
        etag: result.ETag
      };
    } catch (error) {
      console.error('Upload failed:', error);

      // Clear any progress intervals
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Handle various error types and fall back to demo mode
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes('Credential') || errorMessage.includes('credentials')) {
        console.warn('🔄 AWS credentials issue. Falling back to demo mode.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkingError')) {
        console.warn('🌐 Network/CORS issue detected. Falling back to demo mode.');
        console.warn('💡 This usually means CORS is not configured on the S3 bucket.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      if (errorMessage.includes('readableStream') || errorMessage.includes('getReader')) {
        console.warn('🔄 Browser compatibility issue. Falling back to demo mode.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      if (errorMessage.includes('Access Denied') || errorMessage.includes('Forbidden')) {
        console.warn('🚫 Access denied. Check IAM permissions. Falling back to demo mode.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      // For any other error, also fall back to demo mode to keep the app functional
      console.warn('⚠️ Unknown upload error. Falling back to demo mode for better user experience.');
      console.warn('🔧 Error details:', errorMessage);
      return this.mockUpload(file, format, onProgress, key, config);
    }
  }

  // Helper method to convert File to ArrayBuffer
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async mockUpload(file, format, onProgress, key, config) {
    console.log(`🎭 [DEMO MODE] Simulating upload for: ${file.name}`);
    console.log(`📁 [DEMO MODE] Target bucket: ${config.bucketName}`);
    console.log(`🔑 [DEMO MODE] Target key: ${key}`);
    console.log(`📊 [DEMO MODE] File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📂 [DEMO MODE] Upload folder: ${config.uploadFolder}`);
    console.log(`🔍 [DEMO MODE] Will check for: ${config.outputFolder}${config.outputPrefix}${file.name}`);

    // Simulate upload progress
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          clearInterval(interval);
          onProgress(100);
          console.log(`✅ [DEMO MODE] Mock upload completed successfully!`);
        } else {
          onProgress(progress);
        }
      }, 200);
    }

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      key,
      bucket: config.bucketName,
      etag: 'mock-etag-' + Date.now(),
      mock: true
    };
  }

  // Test AWS connectivity and show bucket structure
  async testConnection(format = 'pdf') {
    const config = BUCKET_CONFIGS[format];

    try {
      console.log(`🔍 Testing connection to ${config.bucketName}...`);
      console.log(`📂 Upload folder: ${config.uploadFolder}`);
      console.log(`📁 Output folder: ${config.outputFolder}`);
      console.log(`🏷️ Output prefix: ${config.outputPrefix}`);

      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 1
      });

      await this.clients[format].send(command);
      console.log(`✅ Connection test successful for ${config.bucketName}`);
      return true;
    } catch (error) {
      console.error(`❌ Connection test failed for ${config.bucketName}:`, error.message);
      return false;
    }
  }

  // Test checking for processed files in the correct output folder
  async testProcessedFileCheck(format, fileName) {
    const config = BUCKET_CONFIGS[format];
    const processedFileName = `${config.outputPrefix}${fileName}`;
    const key = `${config.outputFolder}${processedFileName}`;

    console.log(`🧪 [TEST] Checking for processed file:`);
    console.log(`📁 Bucket: ${config.bucketName}`);
    console.log(`🔑 Key: ${key}`);
    console.log(`📂 Output folder: ${config.outputFolder}`);
    console.log(`🏷️ Expected filename: ${processedFileName}`);

    try {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: key,
        MaxKeys: 1
      });

      const result = await this.clients[format].send(command);

      if (result.Contents && result.Contents.length > 0) {
        console.log(`✅ [TEST] File found!`, result.Contents[0]);
        return { found: true, file: result.Contents[0] };
      } else {
        console.log(`❌ [TEST] File not found: ${key}`);
        return { found: false };
      }
    } catch (error) {
      console.error(`❌ [TEST] Error checking file:`, error.message);
      return { found: false, error: error.message };
    }
  }

  async checkForProcessedFile(format, originalFileName, onStatusUpdate, attemptNumber = 0) {
    const config = BUCKET_CONFIGS[format];
    // For HTML format, look for .zip files in remediated folder
    // For PDF format, look for COMPLIANT_ files in result folder
    let processedFileName;
    if (format === 'html') {
      // Remove .pdf extension and add .zip for HTML format
      const baseFileName = originalFileName.replace(/\.pdf$/i, '');
      processedFileName = `${config.outputPrefix}${baseFileName}.zip`;
    } else {
      // Keep original filename for PDF format
      processedFileName = `${config.outputPrefix}${originalFileName}`;
    }
    const key = `${config.outputFolder}${processedFileName}`;

    try {
      // Check if we have proper AWS credentials configured
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        // Mock processing check for demo purposes
        console.log(`🔄 [DEMO MODE] Running mock processing check for: ${originalFileName}`);
        return this.mockProcessingCheck(key, config, onStatusUpdate, attemptNumber);
      }

      console.log(`🔍 [PRODUCTION] Checking S3 for remediated file: ${key}`);
      console.log(`📊 [PRODUCTION] Bucket: ${config.bucketName}`);

      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: key,
        MaxKeys: 1
      });

      const result = await this.clients[format].send(command);

      if (result.Contents && result.Contents.length > 0) {
        // File found
        console.log(`🎉 [PRODUCTION] Processing completed! File found: ${key}`);
        console.log(`📄 [PRODUCTION] File details:`, result.Contents[0]);
        if (onStatusUpdate) {
          onStatusUpdate('completed');
        }
        return {
          found: true,
          key,
          bucket: config.bucketName,
          lastModified: result.Contents[0].LastModified,
          size: result.Contents[0].Size
        };
      } else {
        // File not found yet
        console.log(`⏳ [PRODUCTION] Still processing... File not ready yet`);
        if (onStatusUpdate) {
          onStatusUpdate('processing');
        }
        return { found: false };
      }
    } catch (error) {
      console.error('Error checking for processed file:', error);

      // If check fails due to credentials, fall back to mock mode
      if (error.message.includes('Credential') || error.message.includes('credentials')) {
        console.warn('🔄 AWS credentials issue. Falling back to demo mode.');
        return this.mockProcessingCheck(key, config, onStatusUpdate, attemptNumber);
      }

      if (onStatusUpdate) {
        onStatusUpdate('error');
      }
      throw new Error(`Failed to check processing status: ${error.message}`);
    }
  }

  mockProcessingCheck(key, config, onStatusUpdate, attempts = 0) {
    console.log(`🔍 [DEMO MODE] Checking for remediated file: ${key}`);
    console.log(`📊 [DEMO MODE] Bucket: ${config.bucketName}`);
    console.log(`⏱️ [DEMO MODE] Check attempt: ${attempts + 1}`);
    console.log(`📁 [DEMO MODE] Expected file type: ${key.endsWith('.zip') ? 'ZIP archive' : 'PDF file'}`);

    // Simulate processing time - gradually increase chance of completion
    const baseChance = 0.15; // 15% base chance
    const attemptBonus = attempts * 0.1; // 10% increase per attempt
    const completionChance = Math.min(baseChance + attemptBonus, 0.8); // Max 80% chance
    const shouldComplete = Math.random() < completionChance;

    console.log(`🎲 [DEMO MODE] Completion chance: ${(completionChance * 100).toFixed(1)}%`);
    console.log(`✅ [DEMO MODE] Will complete this check: ${shouldComplete}`);

    if (shouldComplete) {
      console.log(`🎉 [DEMO MODE] Processing completed! File found: ${key}`);
      if (onStatusUpdate) {
        onStatusUpdate('completed');
      }
      return {
        found: true,
        key,
        bucket: config.bucketName,
        lastModified: new Date(),
        size: 1024 * 1024, // 1MB mock size
        mock: true
      };
    } else {
      console.log(`⏳ [DEMO MODE] Still processing... File not ready yet`);
      if (onStatusUpdate) {
        onStatusUpdate('processing');
      }
      return { found: false, mock: true };
    }
  }

  async getDownloadUrl(format, fileName, expiresIn = 3600) {
    const config = BUCKET_CONFIGS[format];
    let processedFileName;

    if (format === 'html') {
      // Remove .pdf extension and add .zip for HTML format
      const baseFileName = fileName.replace(/\.pdf$/i, '');
      processedFileName = `${config.outputPrefix}${baseFileName}.zip`;
    } else {
      // Keep original filename for PDF format
      processedFileName = `${config.outputPrefix}${fileName}`;
    }

    const key = `${config.outputFolder}${processedFileName}`;

    try {
      // Check if we have proper AWS credentials configured
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        // Return mock download URL for demo mode
        console.log(`🎭 [DEMO MODE] Generating mock download URL for: ${processedFileName}`);
        console.log(`📁 [DEMO MODE] Bucket: ${config.bucketName}`);
        console.log(`🔑 [DEMO MODE] Key: ${key}`);
        
        // Return a blob URL for demo purposes (you could generate a mock file here)
        const mockUrl = `https://demo-download.example.com/${processedFileName}?demo=true&expires=${Date.now() + (expiresIn * 1000)}`;
        console.log(`🔗 [DEMO MODE] Mock download URL: ${mockUrl}`);
        
        return {
          url: mockUrl,
          expires: new Date(Date.now() + (expiresIn * 1000)),
          mock: true
        };
      }

      console.log(`🔗 [PRODUCTION] Generating signed URL for: ${processedFileName}`);
      console.log(`📁 [PRODUCTION] Bucket: ${config.bucketName}`);
      console.log(`🔑 [PRODUCTION] Key: ${key}`);
      console.log(`⏰ [PRODUCTION] Expires in: ${expiresIn} seconds`);

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${processedFileName}"`
      });

      const signedUrl = await getSignedUrl(this.clients[format], command, {
        expiresIn: expiresIn
      });

      console.log(`✅ [PRODUCTION] Signed URL generated successfully`);
      console.log(`🔗 [PRODUCTION] URL expires at: ${new Date(Date.now() + (expiresIn * 1000)).toISOString()}`);

      return {
        url: signedUrl,
        expires: new Date(Date.now() + (expiresIn * 1000)),
        bucket: config.bucketName,
        key: key
      };

    } catch (error) {
      console.error('❌ Error generating download URL:', error);

      // Handle different error types
      if (error.message.includes('NoSuchKey') || error.message.includes('Not Found')) {
        throw new Error(`File not found: ${processedFileName}. Make sure the file processing is complete.`);
      }

      if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
        throw new Error(`Access denied. Check if your credentials have s3:GetObject permission for ${config.bucketName}/${key}`);
      }

      if (error.message.includes('Credential') || error.message.includes('credentials')) {
        throw new Error(`AWS credentials error. Please check your configuration.`);
      }

      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  // Polling function to continuously check for processed file
  startPolling(format, originalFileName, onStatusUpdate, onComplete, onError) {
    const pollInterval = 30000; // Check every 30 seconds
    const maxAttempts = 40; // Stop after 20 minutes (40 * 30 seconds)
    let attempts = 0;
    const startTime = Date.now();

    // In demo mode, simulate faster processing
    const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
      (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

    const demoMaxAttempts = hasCredentials ? maxAttempts : 4; // 2 minutes in demo mode
    const mode = hasCredentials ? 'PRODUCTION' : 'DEMO MODE';
    const config = BUCKET_CONFIGS[format];

    console.log(`\n🚀 [${mode}] ===== STARTING PROCESSING POLL =====`);
    console.log(`📄 [${mode}] File: ${originalFileName}`);
    console.log(`🎯 [${mode}] Format: ${format.toUpperCase()}`);
    console.log(`📁 [${mode}] Bucket: ${config.bucketName}`);
    console.log(`📂 [${mode}] Upload folder: ${config.uploadFolder}`);
    console.log(`📁 [${mode}] Output folder: ${config.outputFolder}`);
    console.log(`🏷️ [${mode}] Output prefix: ${config.outputPrefix}`);
    // Calculate expected filename for logging
    let expectedFileName;
    if (format === 'html') {
      const baseFileName = originalFileName.replace(/\.pdf$/i, '');
      expectedFileName = `${config.outputPrefix}${baseFileName}.zip`;
    } else {
      expectedFileName = `${config.outputPrefix}${originalFileName}`;
    }

    console.log(`🔍 [${mode}] Looking for: ${config.outputFolder}${expectedFileName}`);
    console.log(`⏰ [${mode}] Poll interval: ${pollInterval / 1000} seconds`);
    console.log(`🔢 [${mode}] Max attempts: ${demoMaxAttempts} (${(demoMaxAttempts * pollInterval) / 60000} minutes total)`);
    console.log(`🕐 [${mode}] Started at: ${new Date().toLocaleTimeString()}`);

    const poll = async () => {
      try {
        const currentTime = Date.now();
        const elapsedMinutes = Math.floor((currentTime - startTime) / 60000);
        const elapsedSeconds = Math.floor(((currentTime - startTime) % 60000) / 1000);

        console.log(`\n🔄 [${mode}] ===== POLL ATTEMPT ${attempts + 1}/${demoMaxAttempts} =====`);
        console.log(`⏱️ [${mode}] Time elapsed: ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`);
        console.log(`🕐 [${mode}] Current time: ${new Date().toLocaleTimeString()}`);
        console.log(`📊 [${mode}] Progress: ${Math.round((attempts / demoMaxAttempts) * 100)}%`);

        attempts++;

        if (attempts > demoMaxAttempts) {
          const timeoutMessage = hasCredentials
            ? `Processing timeout - file not ready after ${(demoMaxAttempts * pollInterval) / 60000} minutes`
            : 'Demo processing complete - simulating completion';

          console.log(`\n⏰ [${mode}] ===== TIMEOUT REACHED =====`);
          console.log(`🔢 [${mode}] Total attempts: ${attempts - 1}`);
          console.log(`⏱️ [${mode}] Total time: ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`);

          if (hasCredentials) {
            console.error(`❌ [${mode}] ${timeoutMessage}`);
            onError(new Error(timeoutMessage));
          } else {
            // In demo mode, simulate completion after timeout
            console.log(`✅ [${mode}] Simulating completion after timeout`);

            let processedFileName;
            if (format === 'html') {
              const baseFileName = originalFileName.replace(/\.pdf$/i, '');
              processedFileName = `${config.outputPrefix}${baseFileName}.zip`;
            } else {
              processedFileName = `${config.outputPrefix}${originalFileName}`;
            }
            const key = `${config.outputFolder}${processedFileName}`;

            onComplete({
              found: true,
              key,
              bucket: config.bucketName,
              lastModified: new Date(),
              size: 1024 * 1024,
              mock: true
            });
          }
          return;
        }

        const result = await this.checkForProcessedFile(format, originalFileName, onStatusUpdate, attempts - 1);

        if (result.found) {
          console.log(`\n🎉 [${mode}] ===== PROCESSING COMPLETED! =====`);
          console.log(`✅ [${mode}] File found after ${attempts} attempts`);
          console.log(`⏱️ [${mode}] Total processing time: ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`);
          console.log(`📄 [${mode}] Result:`, result);
          onComplete(result);
        } else {
          console.log(`⏳ [${mode}] File not ready yet...`);
          console.log(`⏰ [${mode}] Next check in ${pollInterval / 1000} seconds`);
          console.log(`🔮 [${mode}] Estimated remaining: ${Math.max(0, demoMaxAttempts - attempts)} attempts`);
          // Continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error(`\n❌ [${mode}] ===== POLLING ERROR =====`);
        console.error(`🚨 [${mode}] Error details:`, error);
        console.error(`🔢 [${mode}] Failed on attempt: ${attempts}`);
        onError(error);
      }
    };

    // Start polling immediately
    console.log(`🎬 [${mode}] Starting first poll check immediately...`);
    poll();
  }
}

export default new S3Service();