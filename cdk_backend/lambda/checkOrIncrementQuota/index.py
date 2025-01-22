import json
import os
import boto3

# Initialize Cognito client
cognito_client = boto3.client('cognito-idp')

def handler(event, context):
    """
    AWS Lambda handler to either:
    - Return the user's current total_files_uploaded and max limits (mode='check')
    - Or increment the user's total_files_uploaded by 1 if under their max limit (mode='increment')

    Expects a POST request with a JSON body containing:
    {
      "sub": "<User's unique Cognito identifier>",
      "mode": "check" or "increment"
    }

    Returns:
      {
        "currentUsage": <int>,        # Always returned for mode='check'
        "maxFilesAllowed": <int>,     # Always returned for mode='check'
        "maxPagesAllowed": <int>,     # Always returned for mode='check'
        "maxSizeAllowedMB": <int>,    # Always returned for mode='check'
        "newCount": <int>             # Returned for mode='increment'
      }
      or an error message, e.g., 403 if limit reached.
    """
    try:
        print("Received event:", json.dumps(event))

        # Ensure the HTTP method is POST
        if event.get("httpMethod") != "POST":
            print("Invalid HTTP method:", event.get("httpMethod"))
            return {
                "statusCode": 405,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Method Not Allowed. Use POST."}),
            }

        # Handle CORS preflight request
        if event.get("resource") == "/upload-quota" and event.get("httpMethod") == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": "",
            }

        # Parse the request body
        try:
            body = json.loads(event.get("body", "{}"))
            print("Parsed body:", body)
        except json.JSONDecodeError:
            print("Invalid JSON in request body.")
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Invalid JSON in request body."}),
            }

        # Extract required fields
        user_sub = body.get("sub")
        mode = body.get("mode")

        if not user_sub:
            print("Missing required field: sub")
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Missing required field: sub"}),
            }
        if not mode or mode not in ["check", "increment"]:
            print("Missing or invalid mode. Must be 'check' or 'increment'.")
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Missing or invalid mode. Use 'check' or 'increment'."}),
            }

        # Retrieve User Pool ID from environment variables
        user_pool_id = os.environ.get("USER_POOL_ID")
        if not user_pool_id:
            print("Environment variable USER_POOL_ID is not set.")
            return {
                "statusCode": 500,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Server configuration error."}),
            }

        print("User Pool ID:", user_pool_id)

        # 1) Fetch existing user to read current attributes
        try:
            response = cognito_client.admin_get_user(
                UserPoolId=user_pool_id,
                Username=user_sub
            )
        except cognito_client.exceptions.UserNotFoundException:
            print("User not found in Cognito:", user_sub)
            return {
                "statusCode": 404,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "User not found in Cognito."}),
            }
        except Exception as e:
            print("Error fetching user from Cognito:", str(e))
            return {
                "statusCode": 500,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({"message": "Failed to retrieve user from Cognito."}),
            }

        # 2) Parse the current attributes
        user_attributes = {attr["Name"]: attr["Value"] for attr in response.get("UserAttributes", [])}
        current_count_str = user_attributes.get("custom:total_files_uploaded", "0")
        max_files_allowed_str = user_attributes.get("custom:max_files_allowed", "3")
        max_pages_allowed_str = user_attributes.get("custom:max_pages_allowed", "10")
        max_size_allowed_mb_str = user_attributes.get("custom:max_size_allowed_MB", "25")

        try:
            current_count = int(current_count_str)
        except ValueError:
            current_count = 0

        try:
            max_files_allowed = int(max_files_allowed_str)
        except ValueError:
            max_files_allowed = 3  # Default value

        try:
            max_pages_allowed = int(max_pages_allowed_str)
        except ValueError:
            max_pages_allowed = 10  # Default value

        try:
            max_size_allowed_mb = int(max_size_allowed_mb_str)
        except ValueError:
            max_size_allowed_mb = 25  # Default value

        print(f"Mode: {mode}, Current Usage: {current_count}, Max Files: {max_files_allowed}, Max Pages: {max_pages_allowed}, Max Size: {max_size_allowed_mb} MB")

        # If mode == check, return current usage and limits
        if mode == "check":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({
                    "currentUsage": current_count,
                    "maxFilesAllowed": max_files_allowed,
                    "maxPagesAllowed": max_pages_allowed,
                    "maxSizeAllowedMB": max_size_allowed_mb
                }),
            }

        # If mode == increment, enforce the limits
        if mode == "increment":
            # 3) Check if user is already at or above limit
            if current_count >= max_files_allowed:
                print(f"User has already reached the {max_files_allowed} PDF upload limit.")
                return {
                    "statusCode": 403,
                    "headers": {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    },
                    "body": json.dumps({
                        "message": f"You have already reached the limit of {max_files_allowed} PDF uploads."
                    }),
                }

            # 4) If they have not reached the limit, increment usage
            new_count = current_count + 1

            try:
                cognito_client.admin_update_user_attributes(
                    UserPoolId=user_pool_id,
                    Username=user_sub,
                    UserAttributes=[
                        {
                            "Name": "custom:total_files_uploaded",
                            "Value": str(new_count)
                        }
                    ]
                )
                print(f"Successfully updated 'custom:total_files_uploaded' to {new_count} for user {user_sub}.")
            except Exception as e:
                print("Error updating user attribute in Cognito:", str(e))
                return {
                    "statusCode": 500,
                    "headers": {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "POST,OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type,Authorization",
                    },
                    "body": json.dumps({"message": "Failed to update user attribute."}),
                }

            # 5) Return success with the new usage count and limits
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                "body": json.dumps({
                    "message": f"Upload allowed. New count = {new_count}.",
                    "newCount": new_count,
                    "currentUsage": new_count,
                    "maxFilesAllowed": max_files_allowed,
                    "maxPagesAllowed": max_pages_allowed,
                    "maxSizeAllowedMB": max_size_allowed_mb
                }),
            }

    except Exception as e:
        # Catch any unexpected errors
        print("Unhandled exception:", str(e))
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
            },
            "body": json.dumps({"message": "Internal server error."}),
        }
