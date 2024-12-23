import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';


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

    // Grant Amplify permission to read the secret
    githubToken_secret_manager.grantRead(amplifyApp);

  }
}