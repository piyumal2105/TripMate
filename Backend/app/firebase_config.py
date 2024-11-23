import os
import firebase_admin
from firebase_admin import credentials

# Path to the Firebase credentials file
cred_path = os.getenv("FIREBASE_CREDENTIALS")

if not cred_path or not os.path.exists(cred_path):
    raise ValueError("Firebase credentials file path is invalid or missing.")

# Initialize Firebase Admin SDK
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# Confirm successful initialization
print("Firebase initialized successfully!")
