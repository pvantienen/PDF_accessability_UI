import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as aws_amplify from "@aws-cdk/aws-amplify-alpha";

interface AmplifyHostingStackProps extends cdk.StackProps {
  appEnv?: Record<string, string>;
}

export class AmplifyHostingStack extends cdk.Stack {
  public readonly websiteUrl: string;
  public readonly appId: string;

  constructor(scope: Construct, id: string, props: AmplifyHostingStackProps) {
    super(scope, id, props);

    // Create Amplify app for manual deployment of pre-built files only
    const amplifyApp = new aws_amplify.App(
      this,
      "pdf-accessibility-frontend-amplify-app-manual-deploy-v2",
      {
        description:
          "PDF Accessibility Frontend - Manual Deployment (Pre-built Files Only)",
        // No sourceCodeProvider and no buildSpec for manual deployment
      }
    );

    // branch is required so we use main here
    const branch = amplifyApp.addBranch("manual-deploy", {
      branchName: "main",
      environmentVariables: props.appEnv ?? {},
      autoBuild: false, 
    });

    this.websiteUrl = `https://${branch.branchName}.${amplifyApp.defaultDomain}`;
    this.appId = amplifyApp.appId;

    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: this.appId,
      description:
        "Amplify App ID for manual deployment (pre-built files only)",
    });

    new cdk.CfnOutput(this, "AmplifyWebsiteUrl", {
      value: this.websiteUrl,
      description: "Amplify default domain for the app",
    });
  }
}
