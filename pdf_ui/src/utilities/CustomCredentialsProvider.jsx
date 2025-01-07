import { CognitoIdentity } from '@aws-sdk/client-cognito-identity';
import { IndentityPoolId,region } from './constants';

const cognitoidentity = new CognitoIdentity({
  // region: 'us-east-1',
  region: region,
});

class CustomCredentialsProvider {
  constructor() {
    this.federatedLogin = undefined;
  }

  loadFederatedLogin(login) {
    this.federatedLogin = login;
  }

  async getCredentialsAndIdentityId(getCredentialsOptions) {
    try {
      const getIdResult = await cognitoidentity.getId({
        // IdentityPoolId: 'us-east-1:cd7c74c3-2277-4791-98b4-5cce14e03081',
        IdentityPoolId: IndentityPoolId,
        Logins: { [this.federatedLogin.domain]: this.federatedLogin.token },
      });

      const cognitoCredentialsResult = await cognitoidentity.getCredentialsForIdentity({
        IdentityId: getIdResult.IdentityId,
        Logins: { [this.federatedLogin.domain]: this.federatedLogin.token },
      });

      const credentials = {
        credentials: {
          accessKeyId: cognitoCredentialsResult.Credentials?.AccessKeyId,
          secretAccessKey: cognitoCredentialsResult.Credentials?.SecretKey,
          sessionToken: cognitoCredentialsResult.Credentials?.SessionToken,
          expiration: cognitoCredentialsResult.Credentials?.Expiration,
        },
        identityId: getIdResult.IdentityId,
      };
      return credentials;
    } catch (e) {
      console.log('Error getting credentials: ', e);
    }
  }

  clearCredentialsAndIdentityId() {
    // Implement clearing logic here if needed
  }
}

// // Create an instance of your custom provider
// const customCredentialsProvider = new CustomCredentialsProvider();

// // Configure Amplify with the custom provider
// console.log(customCredentialsProvider)
// Amplify.configure({
//   Auth: {
//     credentialsProvider: customCredentialsProvider
//   },
// });

export default CustomCredentialsProvider;
