# Solution for Cognito Authentication Flow

The configuration has been updated to support the following flow:

1. Users will be directed to the Cognito hosted UI for login at:
```
https://pdf-ui-auth.auth.[region].amazoncognito.com/oauth2/authorize?client_id=[clientId]&redirect_uri=[appUrl]&response_type=code&scope=email+openid+phone+profile
```

2. After successful login, they will be redirected to the Amplify app URL:
```
https://main.[appId].amplifyapp.com
```

3. For sign out, they will be redirected back to the Cognito hosted UI.

The circular dependency has been resolved by:
- Using the Amplify app's known URL format instead of referencing its domain property
- Constructing the hosted UI domain independently
- Keeping the callback and logout URLs simple while letting Cognito handle the proper query parameters

The environment variables in the Amplify app will allow the frontend to construct the proper URLs for authentication flows.