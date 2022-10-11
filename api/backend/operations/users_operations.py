from google.oauth2 import id_token
from google.auth.transport import requests

client_id = "732264051436-0jgjer21ntnoi5ovilmgtqpghaj286sv.apps.googleusercontent.com"

def get_userinfo_for_credential(credential):
    idinfo = id_token.verify_oauth2_token(credential, requests.Request(), client_id)
    return idinfo