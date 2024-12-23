import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CdkBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const bucketName = this.node.tryGetContext('bucketName');
    const githubToken = this.node.tryGetContext('githubToken');

    if (!githubToken || !bucketName) {
      throw new Error(
        'Both GitHub token and bucket name are required! Pass them using `-c githubToken=<token> -c bucketName=<name>`'
      );
    }

    const bucket = s3.Bucket.fromBucketName(this, 'ImportedBucket', bucketName);
    console.log(`Using bucket: ${bucket.bucketName}`);
    
    const githubToken_secret_manager = new secretsmanager.Secret(this, 'GitHubToken', {
      secretName: 'pdfui-github-token',
      description: 'GitHub Personal Access Token for Amplify',
      secretStringValue: cdk.SecretValue.unsafePlainText(githubToken)
    });

    // Create the Amplify App
    const amplifyApp = new amplify.App(this, 'pdfui', {
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'ASUCICREPO',
        repository: 'PDF_accessability_UI',
        oauthToken: githubToken_secret_manager.secretValue
      }),
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
        version: '1.0',
        frontend: {
          phases: {
            preBuild: {
              commands: [
                'cd pdf_ui',
                'npm ci'
              ]
            },
            build: {
              commands: [
                'npm run build'
              ]
            }
          },
          artifacts: {
            baseDirectory: 'pdf_ui/build',
            files: [
              '**/*'
            ]
          },
          cache: {
            paths: [
              'pdf_ui/node_modules/**/*'
            ]
          }
        }
      }),
    });

    // Add a branch
    const mainBranch = amplifyApp.addBranch('main', {
      autoBuild: true,
      stage: 'PRODUCTION'
    });

    const userPool = new cognito.UserPool(this, 'PDF-Accessability-User-Pool', {
      userPoolName: 'PDF-Accessability-User-Pool',

      // Enable self sign-up if you want users to sign themselves up
      selfSignUpEnabled: true,

      signInAliases: {
        email: true,   // users can sign in with email
        phone: false,  // toggle phone if you want phone sign-in
      },

      // Enable email verification
      autoVerify: {
        email: true,
        phone: false,
      },

      // Provide password complexity if desired
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
        requireUppercase: false,
      },

      // Configure standard & custom attributes
      // IMPORTANT: Use "name" as the full name attribute, not "fullname"
      standardAttributes: {
        email: {
          required: true,
          mutable: true,  // Allow users to update their email
        },
        fullname: {
          required: true, // Best practice to require name for user identification
          mutable: true,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
      },

      // Example custom attribute “organization” that is mutable
      customAttributes: {
        organization: new cognito.StringAttribute({ mutable: true }),
      },
    });

    //    The "domainPrefix" must be unique across AWS region
    const userPoolDomain = new cognito.CfnUserPoolDomain(this, 'PDF-Accessability-User-Pool-Domain', {
      domain: 'pdf-ui-auth',  // Your domain prefix
      userPoolId: userPool.userPoolId,
      managedLoginVersion: 2
    });

    // 3. Create a User Pool Client for Hosted UI with OAuth flows
    const userPoolClient = userPool.addClient('PDF-Accessability-User-Pool-Client', {
      userPoolClientName: 'PDF-Accessability-User-Pool-Client',
      // If you plan to do SRP-based sign-in with Amplify Auth, allow these flows:
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true
      },
      // OAuth settings for your Hosted UI
      oAuth: {
        flows: {
          // If you want the full OAuth code flow with tokens
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        // Which scopes do you need? Typically at least OPENID, EMAIL, PHONE, PROFILE
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.PROFILE
        ],
        // Redirect to your Amplify app after sign-in and sign-out
        callbackUrls: [
          'https://main.d1zl0fpln5b8oq.amplifyapp.com/',
        ],
        logoutUrls: [
          'https://main.d1zl0fpln5b8oq.amplifyapp.com/',
        ],
      },
      // Typically you don't want "generateSecret: true" for web-based clients
      generateSecret: false,
      // For better security: 
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        // If you add Social/Federation providers, add them here
      ]
    });


    const abcd = new cognito.CfnManagedLoginBranding(this, 'MyManagedLoginBranding', {
      userPoolId: userPool.userPoolId,
      clientId: userPoolClient.userPoolClientId,

      // ReturnMergedResources ensures we keep any existing style settings
      // if you make multiple updates.
      returnMergedResources: true,
      useCognitoProvidedValues: true,});
    
    
    

    mainBranch.addEnvironment('REACT_APP_BUCKET_NAME', bucket.bucketName);
    mainBranch.addEnvironment('REACT_APP_BUCKET_REGION', this.region);
    // Grant Amplify permission to read the secret
    githubToken_secret_manager.grantRead(amplifyApp);

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domain
    });
    new cdk.CfnOutput(this, 'AmplifyAppURL', {
      value: amplifyApp.defaultDomain,
      description: 'Amplify App URL'
    });
  }
}