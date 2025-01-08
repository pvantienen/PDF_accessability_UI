import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

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

    // --------- Create Amplify App (WITHOUT referencing the domain yet) ----------
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
              commands: ['cd pdf_ui', 'npm ci']
            },
            build: {
              commands: ['npm run build']
            }
          },
          artifacts: {
            baseDirectory: 'pdf_ui/build',
            files: ['**/*']
          },
          cache: {
            paths: ['pdf_ui/node_modules/**/*']
          }
        }
      }),
    });
    
    amplifyApp.addCustomRule({
      source: '</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>',
      target: '/index.html',
      status: amplify.RedirectStatus.REWRITE
    });

    // amplifyApp.addCustomRule({
    //   source: '/<*>',
    //   target: '/index.html',
    //   status: amplify.RedirectStatus.REWRITE
    // });


    // Create main branch
    const mainBranch = amplifyApp.addBranch('main', {
      autoBuild: true,
      stage: 'PRODUCTION'
    });

    const domainPrefix = 'pdf-ui-auth'; // must be globally unique in that region

    // Construct Amplify app URL using known format without creating circular dependency
    const appUrl = `https://main.${amplifyApp.appId}.amplifyapp.com`;
    // const hostedUiDomain = `https://${domainPrefix}.auth.${this.region}.amazoncognito.com/oauth2`;
    // Create the Lambda role first with necessary permissions
    const postConfirmationLambdaRole = new iam.Role(this, 'PostConfirmationLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    postConfirmationLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminUpdateUserAttributes',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: ['*']  // You can restrict this further if needed
      })
    );

    // Create the Lambda with the role
    const postConfirmationFn = new lambda.Function(this, 'PostConfirmationLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/postConfirmation/'),
      timeout: cdk.Duration.seconds(30),
      role: postConfirmationLambdaRole
    });

    // ------------------- Cognito: User Pool, Domain, Client -------------------
    const userPool = new cognito.UserPool(this, 'PDF-Accessability-User-Pool', {
      userPoolName: 'PDF-Accessability-User-Pool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },

      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
        requireUppercase: false,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        // fullname: { required: true, mutable: true },
        // phoneNumber: { required: true, mutable: true },
        //First name, Last name
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },

      },
      customAttributes: {
        first_sign_in: new cognito.BooleanAttribute({ mutable: true }),
        total_files_uploaded: new cognito.NumberAttribute({ mutable: true }),
        organization: new cognito.StringAttribute({ mutable: true }),
        country: new cognito.StringAttribute({ mutable: true }),
        state: new cognito.StringAttribute({ mutable: true }),
        city: new cognito.StringAttribute({ mutable: true }),
        
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        postConfirmation: postConfirmationFn,
      },
    });
    
    // Domain prefix is defined above with appUrl
    const userPoolDomain = new cognito.CfnUserPoolDomain(this, 'PDF-Accessability-User-Pool-Domain', {
      domain: domainPrefix,
      userPoolId: userPool.userPoolId,
      managedLoginVersion: 2,
    });

    const userPoolClient = userPool.addClient('PDF-Accessability-User-Pool-Client', {
      userPoolClientName: 'PDF-Accessability-User-Pool-Client',
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PHONE,
          cognito.OAuthScope.PROFILE
        ],
        callbackUrls: [`${appUrl}/callback`,"http://localhost:3000/callback"],
        logoutUrls: [`${appUrl}/home`, "http://localhost:3000/home"],
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ]
    });

    

    // (Optional) If CfnManagedLoginBranding is not critical, remove it or put it in a separate stack
    const managed_login = new cognito.CfnManagedLoginBranding(this, 'MyManagedLoginBranding', {
      userPoolId: userPool.userPoolId,
      clientId: userPoolClient.userPoolClientId,
      returnMergedResources: true,
      useCognitoProvidedValues: true,
      
    });

    // ------------- Identity Pool + IAM Roles for S3 Access --------------------
    const identityPool = new cognito.CfnIdentityPool(this, 'PDFIdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: { 'cognito-identity.amazonaws.com:aud': identityPool.ref },
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    authenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:GetObject',
        ],
        resources: [
          bucket.bucketArn + '/*',
        ],
      }),
    );

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authenticatedRole.roleArn,
      },
    });

    // ------------------- Lambda Function for Post Confirmation -------------------
    const updateAttributesFn = new lambda.Function(this, 'UpdateAttributesFn', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/updateAttributes/'),
      timeout: cdk.Duration.seconds(30),
      role: postConfirmationLambdaRole,
      environment: {
        USER_POOL_ID: userPool.userPoolId, // used in index.py
      },
    });


    const updateAttributesApi = new apigateway.RestApi(this, 'UpdateAttributesApi', {
      restApiName: 'UpdateAttributesApi',
      description: 'API to update Cognito user attributes (org, first_sign_in).',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },

    });

    // 3) Create a Cognito Authorizer (User Pool Authorizer) referencing our user pool
    const userPoolAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', {
      cognitoUserPools: [userPool], // array of user pools
    });

    // 4) Add Resource & Method
    const updateResource = updateAttributesApi.root.addResource('update-attributes');

    // We attach the Cognito authorizer and set the authorizationType to COGNITO
    updateResource.addMethod('POST', new apigateway.LambdaIntegration(updateAttributesFn), {
      authorizer: userPoolAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // const hostedUiDomain = `https://pdf-ui-auth.auth.${this.region}.amazoncognito.com/login/continue?client_id=${userPoolClient.userPoolClientId}&redirect_uri=https%3A%2F%2Fmain.${amplifyApp.appId}.amplifyapp.com&response_type=code&scope=email+openid+phone+profile`
    const Authority = `cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`;

    // ------------------ Pass environment variables to Amplify ------------------
    mainBranch.addEnvironment('REACT_APP_BUCKET_NAME', bucket.bucketName);
    mainBranch.addEnvironment('REACT_APP_BUCKET_REGION', this.region);
    mainBranch.addEnvironment('REACT_APP_AWS_REGION', this.region);
    
    mainBranch.addEnvironment('REACT_APP_USER_POOL_ID', userPool.userPoolId);
    mainBranch.addEnvironment('REACT_APP_AUTHORITY', Authority);

    mainBranch.addEnvironment('REACT_APP_USER_POOL_CLIENT_ID', userPoolClient.userPoolClientId);
    mainBranch.addEnvironment('REACT_APP_IDENTITY_POOL_ID', identityPool.ref);
    mainBranch.addEnvironment('REACT_APP_HOSTED_UI_URL', appUrl);
    mainBranch.addEnvironment('REACT_APP_DOMAIN_PREFIX', domainPrefix);

    mainBranch.addEnvironment('REACT_APP_UPDATE_ATTRIBUTES_API', updateAttributesApi.urlForPath('/update-attributes'));

    // Grant Amplify permission to read the secret
    githubToken_secret_manager.grantRead(amplifyApp);

    // --------------------------- Outputs ------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'UserPoolDomain', { value: domainPrefix });
    new cdk.CfnOutput(this, 'IdentityPoolId', { value: identityPool.ref });
    new cdk.CfnOutput(this, 'AuthenticatedRole', { value: authenticatedRole.roleArn });
    // new cdk.CfnOutput(this, 'BucketName', { value: userPoolHostedUiDomain });
    new cdk.CfnOutput(this, 'AmplifyAppURL', {
      value: appUrl,
      description: 'Amplify Application URL',
    });
    new cdk.CfnOutput(this, 'UpdateAttributesApiUrl', {
      value: updateAttributesApi.urlForPath('/update-attributes'),
      description: 'POST requests to this URL to update attributes.',
    });


  }
}
