import json
import boto3
import time
from botocore.exceptions import ClientError

# Initialize Cognito Identity Provider client
cognito_client = boto3.client('cognito-idp')

# ======== Hardcoded Configuration ========

USER_POOL_ID = 'USERPOOLID'  # Replace with your Cognito User Pool ID
GROUP_NAME = 'GROUPNAME'  # The name of the Cognito group to target

# Set to True to update all users in the group; False to update a specific user
UPDATE_ALL = True  # True | False
USER_SUB = 'USER_SUB'  # Required if UPDATE_ALL is False | Can be found in the Cognito User Pool for a specific user

# Define custom attribute limits for the group
# Comment out or remove any attributes you don't want to update
GROUP_LIMITS = {
    "custom:max_files_allowed": "10000",
    "custom:max_pages_allowed": "2500",
    "custom:max_size_allowed_MB": "1000",
    # "custom:total_files_uploaded": "0", # Uncomment to reset the counter for total_files_uploaded
}

# Maximum number of retries for throttling
MAX_RETRIES = 5
# Base delay in seconds for exponential backoff
BASE_DELAY = 1

def handler(event, context):
    """
    AWS Lambda function to update custom attributes of Cognito users based on group membership.

    Parameters:
        event (dict): Event data passed by the invoker (e.g., Lambda console).
        context (object): Runtime information of the Lambda function.

    Returns:
        dict: Response object with statusCode and body.
    """
    try:
        # Validate parameters
        if not isinstance(UPDATE_ALL, bool):
            return format_response(400, "Parameter 'update_all' must be a boolean.")

        if not UPDATE_ALL and not USER_SUB:
            return format_response(400, "Parameter 'user_sub' is required when 'update_all' is False.")

        # Determine the list of users to update
        if UPDATE_ALL:
            users_to_update = get_all_users_in_group_with_retry(GROUP_NAME)
            if users_to_update is None:
                return format_response(500, "Failed to retrieve users from the group.")
            if not users_to_update:
                return format_response(200, f"No users found in group '{GROUP_NAME}' to update.")
            print(f"Found {len(users_to_update)} users in group '{GROUP_NAME}' for update.")
        else:
            # Update a specific user
            user = get_user_by_sub_with_retry(USER_SUB)
            if user is None:
                return format_response(404, f"User with sub '{USER_SUB}' not found.")
            user_groups = get_user_groups_with_retry(USER_SUB)
            if user_groups is None:
                return format_response(500, "Failed to retrieve user groups.")
            if GROUP_NAME not in user_groups:
                return format_response(400, f"User with sub '{USER_SUB}' is not a member of group '{GROUP_NAME}'.")
            users_to_update = [USER_SUB]
            print(f"User '{USER_SUB}' confirmed in group '{GROUP_NAME}' for update.")

        # Update custom attributes for each user
        updated_users = []
        failed_updates = []

        for sub in users_to_update:
            success = update_user_attributes_with_retry(sub, GROUP_LIMITS)
            if success:
                updated_users.append(sub)
                print(f"Successfully updated user '{sub}'.")
            else:
                failed_updates.append(sub)
                print(f"Failed to update user '{sub}'.")

        # Prepare the response
        response_message = {
            "message": "User attribute updates completed.",
            "total_users_processed": len(users_to_update),
            "successful_updates": len(updated_users),
            "failed_updates": failed_updates
        }

        return format_response(200, response_message)

    except json.JSONDecodeError:
        return format_response(400, "Invalid JSON in request body.")
    except Exception as e:
        print(f"Unhandled exception: {str(e)}")
        return format_response(500, "Internal server error.")

def format_response(status_code, body):
    """
    Formats the response for API Gateway or Lambda console.

    Parameters:
        status_code (int): HTTP status code.
        body (str or dict): Response message or data.

    Returns:
        dict: Formatted response.
    """
    if isinstance(body, dict):
        body = json.dumps(body)
    return {
        "statusCode": status_code,
        "body": body
    }

def get_user_sub(user):
    """
    Extracts the 'sub' attribute from a Cognito user object.

    Parameters:
        user (dict): A user object returned by Cognito.

    Returns:
        str or None: The 'sub' value if found, else None.
    """
    attributes = user.get('Attributes', [])
    for attribute in attributes:
        if attribute['Name'] == 'sub':
            return attribute['Value']
    return None

def get_all_users_in_group_with_retry(group_name):
    """
    Retrieves all users in a specified Cognito user group with exponential backoff on throttling.

    Parameters:
        group_name (str): The name of the Cognito user group.

    Returns:
        list: A list of user 'sub' identifiers or None if failed.
    """
    users = []
    next_token = None
    retries = 0

    while True:
        try:
            params = {
                'UserPoolId': USER_POOL_ID,
                'GroupName': group_name,
                'Limit': 60  # Maximum allowed by Cognito per request
            }
            if next_token:
                params['NextToken'] = next_token

            response = cognito_client.list_users_in_group(**params)
            batch_users = [get_user_sub(user) for user in response.get('Users', [])]
            # Filter out any None values in case 'sub' wasn't found
            batch_users = [sub for sub in batch_users if sub]
            users.extend(batch_users)

            next_token = response.get('NextToken')
            if not next_token:
                break

        except ClientError as e:
            if e.response['Error']['Code'] in ['TooManyRequestsException', 'ThrottlingException']:
                if retries < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** retries)
                    print(f"Throttled. Retrying in {delay} seconds...")
                    time.sleep(delay)
                    retries += 1
                    continue
                else:
                    print("Max retries reached. Exiting.")
                    return None
            else:
                print(f"ClientError: {e}")
                return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    return users

def get_user_by_sub_with_retry(user_sub):
    """
    Retrieves a Cognito user by their 'sub' identifier with exponential backoff on throttling.

    Parameters:
        user_sub (str): The unique identifier of the user.

    Returns:
        dict or None: The user object if found, else None.
    """
    retries = 0

    while True:
        try:
            response = cognito_client.admin_get_user(
                UserPoolId=USER_POOL_ID,
                Username=user_sub
            )
            return response
        except cognito_client.exceptions.UserNotFoundException:
            print(f"User with sub '{user_sub}' not found.")
            return None
        except ClientError as e:
            if e.response['Error']['Code'] in ['TooManyRequestsException', 'ThrottlingException']:
                if retries < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** retries)
                    print(f"Throttled. Retrying in {delay} seconds...")
                    time.sleep(delay)
                    retries += 1
                    continue
                else:
                    print("Max retries reached. Exiting.")
                    return None
            else:
                print(f"ClientError: {e}")
                return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

def get_user_groups_with_retry(user_sub):
    """
    Retrieves all groups a user belongs to with exponential backoff on throttling.

    Parameters:
        user_sub (str): The unique identifier of the user.

    Returns:
        list or None: A list of group names or None if failed.
    """
    retries = 0

    while True:
        try:
            response = cognito_client.admin_list_groups_for_user(
                UserPoolId=USER_POOL_ID,
                Username=user_sub
            )
            groups = [group['GroupName'] for group in response.get('Groups', [])]
            return groups
        except ClientError as e:
            if e.response['Error']['Code'] in ['TooManyRequestsException', 'ThrottlingException']:
                if retries < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** retries)
                    print(f"Throttled. Retrying in {delay} seconds...")
                    time.sleep(delay)
                    retries += 1
                    continue
                else:
                    print("Max retries reached. Exiting.")
                    return None
            else:
                print(f"ClientError: {e}")
                return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

def update_user_attributes_with_retry(user_sub, attributes):
    """
    Updates custom attributes for a specified Cognito user with exponential backoff on throttling.

    Parameters:
        user_sub (str): The unique identifier of the user.
        attributes (dict): A dictionary of custom attributes to update.

    Returns:
        bool: True if update succeeded, False otherwise.
    """
    retries = 0

    user_attributes = [{'Name': key, 'Value': value} for key, value in attributes.items()]

    while True:
        try:
            cognito_client.admin_update_user_attributes(
                UserPoolId=USER_POOL_ID,
                Username=user_sub,
                UserAttributes=user_attributes
            )
            return True
        except ClientError as e:
            if e.response['Error']['Code'] in ['TooManyRequestsException', 'ThrottlingException']:
                if retries < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** retries)
                    print(f"Throttled. Retrying in {delay} seconds...")
                    time.sleep(delay)
                    retries += 1
                    continue
                else:
                    print(f"Max retries reached while updating user '{user_sub}'.")
                    return False
            else:
                print(f"ClientError while updating user '{user_sub}': {e}")
                return False
        except Exception as e:
            print(f"Unexpected error while updating user '{user_sub}': {e}")
            return False
