from firebase_admin import auth

def test_firebase():
    try:
        # List all users (optional)
        users = auth.list_users()
        print(f"Firebase setup is working. Found {len(list(users.users))} users.")
    except Exception as e:
        print(f"Firebase setup failed: {e}")

test_firebase()
