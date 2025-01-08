import json
import boto3

def handler(event, context):
    print('Post Confirmation Trigger Event:', json.dumps(event, indent=2))

    # Only run if this is a ConfirmSignUp flow (not ConfirmForgotPassword, etc.)
    if event.get('triggerSource') == 'PostConfirmation_ConfirmSignUp':
        # Update the user's "first_sign_in" custom attribute to 'true'
        try:
            cognito_idp = boto3.client('cognito-idp')
            cognito_idp.admin_update_user_attributes(
                UserPoolId=event['userPoolId'],
                Username=event['userName'],
                UserAttributes=[
                    {
                        'Name': 'custom:first_sign_in',
                        'Value': 'true'
                    }
                    ,
                    {
                        'Name': 'custom:total_files_uploaded',
                        'Value': '0'
                    }
                ]
            )
            print('Successfully updated custom:first_sign_in to true and total_files_uploaded to 0.')
        except Exception as error:
            print(f'Failed to update user attribute: {error}')

    return event
