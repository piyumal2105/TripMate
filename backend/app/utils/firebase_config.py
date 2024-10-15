import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase app with credentials
def initialize_firebase():
    cred = credentials.Certificate("app/utils/firebase_key.json") 
    firebase_admin.initialize_app(cred)

def get_firebase_auth():
    return auth
