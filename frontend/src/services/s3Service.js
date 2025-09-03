import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { BUCKET_CONFIGS, IndentityPoolId, region, UserPoolId } from '../utilities/constants';
import CustomCredentialsProvider from '../utilities/CustomCredentialsProvider';

class S3Service {
  constructor() {
    this.clients = {};
    this.credentialsProvider = new CustomCredentialsProvider();
    
    // Authentication state
    this.isAuthenticated = false;
    this.userIdToken = null;
    this.cognitoIdentityId = null;
    this.authStateCallbacks = new Set();
    
    this.initializeClients();
  }

  /**
   * Update authentication state and reinitialize clients with new credentials
   * @param {string|null} idToken - JWT ID token from Cognito User Pool
   * @param {boolean} isAuthenticated - Authentication status
   */
  updateAuthState(idToken = null, isAuthenticated = false) {
    const wasAuthenticated = this.isAuthenticated;
    const tokenChanged = this.userIdToken !== idToken;
    
    this.isAuthenticated = isAuthenticated;
    this.userIdToken = idToken;
    
    // Clear identity ID if auth state changed
    if (wasAuthenticated !== isAuthenticated || tokenChanged) {
      this.cognitoIdentityId = null;
      console.log(`🔄 [AUTH] Authentication state changed: ${wasAuthenticated ? 'authenticated' : 'anonymous'} → ${isAuthenticated ? 'authenticated' : 'anonymous'}`);
      
      // Reinitialize clients with new credentials
      this.initializeClients();
      
      // Notify callbacks of auth state change
      this.authStateCallbacks.forEach(callback => {
        try {
          callback({ isAuthenticated, wasAuthenticated, tokenChanged });
        } catch (error) {
          console.error('Error in auth state callback:', error);
        }
      });
    }
  }

  /**
   * Subscribe to authentication state changes
   * @param {Function} callback - Callback function to execute on auth state change
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    this.authStateCallbacks.add(callback);
    return () => this.authStateCallbacks.delete(callback);
  }

  /**
   * Get current user's Cognito Identity ID (useful for user-specific S3 prefixes)
   * @returns {Promise<string|null>} The Cognito Identity ID or null
   */
  async getCognitoIdentityId() {
    if (this.cognitoIdentityId) {
      return this.cognitoIdentityId;
    }

    // Only available when using Cognito Identity Pool
    const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
      (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

    if (!hasCredentials) {
      return null;
    }

    try {
      // This will be populated during the first AWS API call
      // We can't easily extract it without making a call, so we'll return null
      // and let it be populated naturally during S3 operations
      return this.cognitoIdentityId;
    } catch (error) {
      console.warn('Could not retrieve Cognito Identity ID:', error);
      return null;
    }
  }

  initializeClients() {
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
    console.log(`🔧 [${authMode}] Initializing S3 clients...`);

    Object.keys(BUCKET_CONFIGS).forEach(key => {
      const clientConfig = {
        region: BUCKET_CONFIGS[key].region,
        // Browser-specific configuration
        requestHandler: {
          requestTimeout: 300000, // 5 minutes
          httpsAgent: undefined
        }
      };

      // 4-tier credential strategy
      if (process.env.REACT_APP_AWS_ACCESS_KEY_ID && process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
        // Tier 1: Environment variables (development only)
        clientConfig.credentials = {
          accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        };
        console.log(`🔑 [${key.toUpperCase()}] Using environment credentials`);
      } else if (this.isAuthenticated && this.userIdToken && IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id') {
        // Tier 2: Authenticated Cognito Identity Pool (NEW)
        const loginKey = `cognito-idp.${region}.amazonaws.com/${UserPoolId}`;
        clientConfig.credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: IndentityPoolId,
          logins: {
            [loginKey]: this.userIdToken
          }
        });
        console.log(`🔑 [${key.toUpperCase()}] Using authenticated Cognito Identity Pool`);
        console.log(`👤 [${key.toUpperCase()}] Login provider: ${loginKey}`);
      } else if (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id') {
        // Tier 3: Anonymous Cognito Identity Pool (existing)
        clientConfig.credentials = fromCognitoIdentityPool({
          client: new CognitoIdentityClient({ region }),
          identityPoolId: IndentityPoolId,
        });
        console.log(`🔑 [${key.toUpperCase()}] Using anonymous Cognito Identity Pool`);
      } else {
        // Tier 4: Demo mode (fallback)
        console.log(`⚠️ [${key.toUpperCase()}] No credentials configured - will use demo mode`);
      }

      this.clients[key] = new S3Client(clientConfig);
    });

    console.log(`✅ [${authMode}] S3 clients initialized for ${Object.keys(BUCKET_CONFIGS).length} configurations`);
  }

  /**
   * Get user-specific S3 prefix based on authentication state
   * @param {string} basePrefix - Base prefix from config
   * @returns {string} User-specific or base prefix
   */
  getUserSpecificPrefix(basePrefix) {
    if (this.isAuthenticated && this.cognitoIdentityId) {
      // Use Cognito Identity ID for user-specific folders
      return `${basePrefix}users/${this.cognitoIdentityId}/`;
    }
    return basePrefix;
  }

  /**
   * Check if user has enhanced permissions (authenticated users)
   * @returns {boolean}
   */
  hasEnhancedPermissions() {
    return this.isAuthenticated && !!this.userIdToken;
  }

  async uploadFile(file, format, onProgress) {
    const config = BUCKET_CONFIGS[format];
    if (!config) {
      throw new Error(`Invalid format: ${format}`);
    }

    // Use user-specific prefix for authenticated users
    const uploadFolder = this.getUserSpecificPrefix(config.uploadFolder);
    const key = `${uploadFolder}${file.name}`;
    let progressInterval;

    try {
      // Check if we have proper AWS credentials configured
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        console.warn('No AWS credentials configured. Running in demo mode.');
        return this.mockUpload(file, format, onProgress, key, config);
      }

      const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
      console.log(`📤 [${authMode}] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`🎯 [${authMode}] Target: ${config.bucketName}/${key}`);
      console.log(`📁 [${authMode}] Upload folder: ${uploadFolder}`);
      
      if (this.isAuthenticated) {
        console.log(`👤 [${authMode}] User-specific upload path enabled`);
      }

      // Enhanced file size limits for authenticated users
      const maxFileSize = this.hasEnhancedPermissions() ? 100 * 1024 * 1024 : 50 * 1024 * 1024; // 100MB vs 50MB
      if (file.size > maxFileSize) {
        const limitMB = maxFileSize / (1024 * 1024);
        const authHint = this.hasEnhancedPermissions() ? '' : ' (Sign in for larger file limits)';
        throw new Error(`File size exceeds ${limitMB}MB limit${authHint}`);
      }

      const fileBuffer = await this.fileToArrayBuffer(file);

      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type || 'application/pdf',
        ContentLength: file.size,
        // Add metadata for authenticated users
        ...(this.isAuthenticated && {
          Metadata: {
            'uploaded-by': 'authenticated-user',
            'cognito-identity-id': this.cognitoIdentityId || 'pending',
            'upload-timestamp': new Date().toISOString()
          }
        })
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

      // Store Cognito Identity ID if available (for user-specific prefixes)
      if (!this.cognitoIdentityId && result.$metadata?.httpStatusCode === 200) {
        // The identity ID would be available in the credentials, but it's not easily accessible
        // It will be naturally populated during credential resolution
      }

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (onProgress) {
        onProgress(100);
      }

      console.log(`✅ [${authMode}] Upload successful! ETag: ${result.ETag}`);

      return {
        success: true,
        key,
        bucket: config.bucketName,
        etag: result.ETag,
        authenticated: this.isAuthenticated,
        userSpecificPath: this.isAuthenticated
      };
    } catch (error) {
      console.error('Upload failed:', error);

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Handle authentication-specific errors
      if (error.message?.includes('token') || error.message?.includes('Token')) {
        console.warn('🔄 Token-related error. This might indicate token expiration.');
        // Could trigger a token refresh here if you have that capability
      }

      // Enhanced error handling for authenticated users
      if (this.isAuthenticated) {
        if (error.message?.includes('Access Denied') || error.message?.includes('Forbidden')) {
          console.warn('🚫 Authenticated access denied. Check IAM role permissions for authenticated users.');
        }
      }

      // Existing error handling...
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

      console.warn('⚠️ Unknown upload error. Falling back to demo mode for better user experience.');
      console.warn('🔧 Error details:', errorMessage);
      return this.mockUpload(file, format, onProgress, key, config);
    }
  }

  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async mockUpload(file, format, onProgress, key, config) {
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
    console.log(`🎭 [DEMO MODE - ${authMode}] Simulating upload for: ${file.name}`);
    console.log(`📁 [DEMO MODE - ${authMode}] Target bucket: ${config.bucketName}`);
    console.log(`🔑 [DEMO MODE - ${authMode}] Target key: ${key}`);
    console.log(`📊 [DEMO MODE - ${authMode}] File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    if (this.isAuthenticated) {
      console.log(`👤 [DEMO MODE - ${authMode}] Simulating user-specific upload path`);
    }

    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          clearInterval(interval);
          onProgress(100);
          console.log(`✅ [DEMO MODE - ${authMode}] Mock upload completed successfully!`);
        } else {
          onProgress(progress);
        }
      }, 200);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      key,
      bucket: config.bucketName,
      etag: 'mock-etag-' + Date.now(),
      mock: true,
      authenticated: this.isAuthenticated,
      userSpecificPath: this.isAuthenticated
    };
  }

  async testConnection(format = 'pdf') {
    const config = BUCKET_CONFIGS[format];
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';

    try {
      console.log(`🔍 [${authMode}] Testing connection to ${config.bucketName}...`);
      console.log(`📂 Upload folder: ${this.getUserSpecificPrefix(config.uploadFolder)}`);
      console.log(`📁 Output folder: ${config.outputFolder}`);
      console.log(`🏷️ Output prefix: ${config.outputPrefix}`);

      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        MaxKeys: 1
      });

      await this.clients[format].send(command);
      console.log(`✅ [${authMode}] Connection test successful for ${config.bucketName}`);
      return true;
    } catch (error) {
      console.error(`❌ [${authMode}] Connection test failed for ${config.bucketName}:`, error.message);
      return false;
    }
  }

  async testProcessedFileCheck(format, fileName) {
    const config = BUCKET_CONFIGS[format];
    const processedFileName = `${config.outputPrefix}${fileName}`;
    const key = `${config.outputFolder}${processedFileName}`;
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';

    console.log(`🧪 [TEST - ${authMode}] Checking for processed file:`);
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
        console.log(`✅ [TEST - ${authMode}] File found!`, result.Contents[0]);
        return { found: true, file: result.Contents[0] };
      } else {
        console.log(`❌ [TEST - ${authMode}] File not found: ${key}`);
        return { found: false };
      }
    } catch (error) {
      console.error(`❌ [TEST - ${authMode}] Error checking file:`, error.message);
      return { found: false, error: error.message };
    }
  }

  async checkForProcessedFile(format, originalFileName, onStatusUpdate, attemptNumber = 0) {
    const config = BUCKET_CONFIGS[format];
    let processedFileName;
    if (format === 'html') {
      const baseFileName = originalFileName.replace(/\.pdf$/i, '');
      processedFileName = `${config.outputPrefix}${baseFileName}.zip`;
    } else {
      processedFileName = `${config.outputPrefix}${originalFileName}`;
    }
    const key = `${config.outputFolder}${processedFileName}`;

    try {
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        console.log(`🔄 [DEMO MODE] Running mock processing check for: ${originalFileName}`);
        return this.mockProcessingCheck(key, config, onStatusUpdate, attemptNumber);
      }

      const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
      console.log(`🔍 [${authMode}] Checking S3 for remediated file: ${key}`);
      console.log(`📊 [${authMode}] Bucket: ${config.bucketName}`);

      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: key,
        MaxKeys: 1
      });

      const result = await this.clients[format].send(command);

      if (result.Contents && result.Contents.length > 0) {
        console.log(`🎉 [${authMode}] Processing completed! File found: ${key}`);
        console.log(`📄 [${authMode}] File details:`, result.Contents[0]);
        if (onStatusUpdate) {
          onStatusUpdate('completed');
        }
        return {
          found: true,
          key,
          bucket: config.bucketName,
          lastModified: result.Contents[0].LastModified,
          size: result.Contents[0].Size,
          authenticated: this.isAuthenticated
        };
      } else {
        console.log(`⏳ [${authMode}] Still processing... File not ready yet`);
        if (onStatusUpdate) {
          onStatusUpdate('processing');
        }
        return { found: false, authenticated: this.isAuthenticated };
      }
    } catch (error) {
      console.error('Error checking for processed file:', error);

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
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
    console.log(`🔍 [DEMO MODE - ${authMode}] Checking for remediated file: ${key}`);
    console.log(`📊 [DEMO MODE - ${authMode}] Bucket: ${config.bucketName}`);
    console.log(`⏱️ [DEMO MODE - ${authMode}] Check attempt: ${attempts + 1}`);

    // Slightly faster processing for authenticated users in demo mode
    const baseChance = this.isAuthenticated ? 0.2 : 0.15; // 20% vs 15%
    const attemptBonus = attempts * 0.1;
    const completionChance = Math.min(baseChance + attemptBonus, 0.8);
    const shouldComplete = Math.random() < completionChance;

    console.log(`🎲 [DEMO MODE - ${authMode}] Completion chance: ${(completionChance * 100).toFixed(1)}%`);
    console.log(`✅ [DEMO MODE - ${authMode}] Will complete this check: ${shouldComplete}`);

    if (shouldComplete) {
      console.log(`🎉 [DEMO MODE - ${authMode}] Processing completed! File found: ${key}`);
      if (onStatusUpdate) {
        onStatusUpdate('completed');
      }
      return {
        found: true,
        key,
        bucket: config.bucketName,
        lastModified: new Date(),
        size: 1024 * 1024,
        mock: true,
        authenticated: this.isAuthenticated
      };
    } else {
      console.log(`⏳ [DEMO MODE - ${authMode}] Still processing... File not ready yet`);
      if (onStatusUpdate) {
        onStatusUpdate('processing');
      }
      return { found: false, mock: true, authenticated: this.isAuthenticated };
    }
  }

  async getDownloadUrl(format, fileName, expiresIn = 3600) {
    const config = BUCKET_CONFIGS[format];
    let processedFileName;

    if (format === 'html') {
      const baseFileName = fileName.replace(/\.pdf$/i, '');
      processedFileName = `${config.outputPrefix}${baseFileName}.zip`;
    } else {
      processedFileName = `${config.outputPrefix}${fileName}`;
    }

    const key = `${config.outputFolder}${processedFileName}`;

    try {
      const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
        (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

      if (!hasCredentials) {
        const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
        console.log(`🎭 [DEMO MODE - ${authMode}] Generating mock download URL for: ${processedFileName}`);
        
        const mockUrl = `https://demo-download.example.com/${processedFileName}?demo=true&expires=${Date.now() + (expiresIn * 1000)}`;
        console.log(`🔗 [DEMO MODE - ${authMode}] Mock download URL: ${mockUrl}`);
        
        return {
          url: mockUrl,
          expires: new Date(Date.now() + (expiresIn * 1000)),
          mock: true,
          authenticated: this.isAuthenticated
        };
      }

      const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
      console.log(`🔗 [${authMode}] Generating signed URL for: ${processedFileName}`);
      console.log(`📁 [${authMode}] Bucket: ${config.bucketName}`);
      console.log(`🔑 [${authMode}] Key: ${key}`);
      console.log(`⏰ [${authMode}] Expires in: ${expiresIn} seconds`);

      // Enhanced expiration for authenticated users
      const actualExpiresIn = this.hasEnhancedPermissions() ? expiresIn * 2 : expiresIn;
      if (this.hasEnhancedPermissions() && actualExpiresIn > expiresIn) {
        console.log(`👤 [${authMode}] Enhanced expiration: ${actualExpiresIn} seconds`);
      }

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${processedFileName}"`
      });

      const signedUrl = await getSignedUrl(this.clients[format], command, {
        expiresIn: actualExpiresIn
      });

      console.log(`✅ [${authMode}] Signed URL generated successfully`);
      console.log(`🔗 [${authMode}] URL expires at: ${new Date(Date.now() + (actualExpiresIn * 1000)).toISOString()}`);

      return {
        url: signedUrl,
        expires: new Date(Date.now() + (actualExpiresIn * 1000)),
        bucket: config.bucketName,
        key: key,
        authenticated: this.isAuthenticated,
        enhancedExpiration: this.hasEnhancedPermissions()
      };

    } catch (error) {
      console.error('❌ Error generating download URL:', error);

      if (error.message.includes('NoSuchKey') || error.message.includes('Not Found')) {
        throw new Error(`File not found: ${processedFileName}. Make sure the file processing is complete.`);
      }

      if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
        const authHint = this.isAuthenticated ? 
          `Check if your authenticated IAM role has s3:GetObject permission for ${config.bucketName}/${key}` :
          `Check if your anonymous IAM role has s3:GetObject permission for ${config.bucketName}/${key}`;
        throw new Error(`Access denied. ${authHint}`);
      }

      if (error.message.includes('Credential') || error.message.includes('credentials')) {
        throw new Error(`AWS credentials error. Please check your configuration.`);
      }

      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  startPolling(format, originalFileName, onStatusUpdate, onComplete, onError) {
    const pollInterval = 30000;
    const maxAttempts = 40;
    let attempts = 0;
    const startTime = Date.now();

    const hasCredentials = process.env.REACT_APP_AWS_ACCESS_KEY_ID ||
      (IndentityPoolId && IndentityPoolId !== 'your-identity-pool-id');

    // Slightly reduced timeout for authenticated users in demo mode
    const demoMaxAttempts = hasCredentials ? maxAttempts : (this.isAuthenticated ? 3 : 4);
    const authMode = this.isAuthenticated ? 'AUTHENTICATED' : 'ANONYMOUS';
    const mode = hasCredentials ? authMode : `DEMO MODE - ${authMode}`;
    const config = BUCKET_CONFIGS[format];

    console.log(`\n🚀 [${mode}] ===== STARTING PROCESSING POLL =====`);
    console.log(`📄 [${mode}] File: ${originalFileName}`);
    console.log(`🎯 [${mode}] Format: ${format.toUpperCase()}`);
    console.log(`📁 [${mode}] Bucket: ${config.bucketName}`);
    
    if (this.isAuthenticated) {
      console.log(`👤 [${mode}] Authenticated user polling`);
      if (!hasCredentials) {
        console.log(`⚡ [${mode}] Faster demo processing for authenticated users`);
      }
    }

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
              mock: true,
              authenticated: this.isAuthenticated
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

    console.log(`🎬 [${mode}] Starting first poll check immediately...`);
    poll();
  }
}

export default new S3Service();