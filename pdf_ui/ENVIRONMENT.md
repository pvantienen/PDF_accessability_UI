# Environment configuration

This app uses Create React App. Environment variables must be prefixed with `REACT_APP_` and are read at build time.

Required variables:

- REACT_APP_MAINTENANCE_MODE: "true" | "false"
- REACT_APP_AUTHORITY: OIDC issuer / Cognito domain URL
- REACT_APP_AWS_REGION: e.g., us-east-1
- REACT_APP_BUCKET_NAME: S3 bucket name
- REACT_APP_BUCKET_REGION: e.g., us-east-1
- REACT_APP_DOMAIN_PREFIX: Cognito domain prefix (if applicable)
- REACT_APP_HOSTED_UI_URL: Cognito Hosted UI base URL
- REACT_APP_IDENTITY_POOL_ID: Cognito Identity Pool ID
- REACT_APP_UPDATE_FIRST_SIGN_IN: API URL for first sign-in update
- REACT_APP_UPLOAD_QUOTA_API: API URL for quota check/increment
- REACT_APP_USER_POOL_CLIENT_ID: Cognito App Client ID
- REACT_APP_USER_POOL_ID: Cognito User Pool ID

Local development

1. Create a `.env` file in `pdf_ui/` with the keys above.
2. Install deps and run:
   - `npm install`
   - `npm start`

Render deployment (Blueprint)

- The root `render.yaml` defines a Web Service for `pdf_ui`.
- Key settings:
  - Root Directory: `pdf_ui`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm run start:render`
  - Health check: `/`
  - Node version: 18 (via `NODE_VERSION` env var)
- Set environment variables in `render.yaml` under `services[0].envVars` or via the Render dashboard before deploying.
- Since env vars are read at build time, any change requires a rebuild/redeploy.
