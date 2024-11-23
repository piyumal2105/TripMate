import requests
from fastapi import HTTPException

FIREBASE_WEB_API_KEY = "AIzaSyAHw8IrluaFtemB9a8KKWHl1TWQRW9cuxg"

def register_user(fullname: str, email: str, password: str):
    try:
        # Register the user using Firebase Admin SDK
        from firebase_admin import auth
        user = auth.create_user(display_name=fullname, email=email, password=password)
        return {"email": user.email, "message": "User successfully registered"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def login_user(email: str, password: str):
    try:
        # Firebase REST API URL for sign-in
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"
        payload = {"email": email, "password": password, "returnSecureToken": True}

        # Make a POST request to the REST API
        response = requests.post(url, json=payload)
        response_data = response.json()

        if response.status_code != 200:
            raise HTTPException(
                status_code=400, detail=response_data.get("error", {}).get("message", "Login failed")
            )

        return {
            "email": response_data["email"],
            "idToken": response_data["idToken"],  # Use this token for authenticated requests
            "refreshToken": response_data["refreshToken"],
            "message": "Login successful",
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# from fastapi import HTTPException
# from firebase_admin import auth

# def register_user(fullname:str, email: str, password: str):
#     try:
#         user = auth.create_user(fullname=fullname, email=email, password=password)
#         return {"email": user.email, "message": "User successfully registered"}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))

# def login_user(email: str, password: str):
#     try:
#         # Simulating Firebase login (Firebase Admin doesn't support login directly)
#         user = auth.get_user_by_email(email)
#         if not user:
#             raise HTTPException(status_code=400, detail="Invalid credentials")
#         return {"email": email, "message": "Login successful"}
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))
