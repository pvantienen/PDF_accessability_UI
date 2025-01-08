import json
import os
import boto3

cognito_client = boto3.client('cognito-idp')

def handler(event, context):
    try:
        # Parse the request body
        body = json.loads(event.get("body") or "{}")
        user_sub = body.get("sub")
        organization = body.get("organization")

        # Validate inputs
        if not user_sub or not organization:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",  # CORS header
                    "Access-Control-Allow-Methods": "POST,OPTIONS",  # CORS header
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",  # CORS header
                },
                "body": json.dumps({"message": "Missing required fields: sub and organization"}),
            }

        # Update Cognito user attributes
        user_pool_id = os.environ.get("USER_POOL_ID")
        response = cognito_client.admin_update_user_attributes(
            UserPoolId=user_pool_id,
            Username=user_sub,
            UserAttributes=[
                {"Name": "custom:organization", "Value": organization},
                {"Name": "custom:first_sign_in", "Value": "false"}
            ]
        )

        # Return a success response
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # CORS header
                "Access-Control-Allow-Methods": "POST,OPTIONS",  # CORS header
                "Access-Control-Allow-Headers": "Content-Type,Authorization",  # CORS header
            },
            "body": json.dumps({"message": "User attributes updated successfully"}),
        }

    except Exception as e:
        print("Error updating user attributes:", str(e))
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # CORS header
                "Access-Control-Allow-Methods": "POST,OPTIONS",  # CORS header
                "Access-Control-Allow-Headers": "Content-Type,Authorization",  # CORS header
            },
            "body": json.dumps({"error": str(e)}),
        }
