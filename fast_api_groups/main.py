from fastapi import FastAPI
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd

app = FastAPI()

# Initialize Firebase
cred = credentials.Certificate("/Users/chamodeshan/Documents/TripMate/fast_api_groups/travel-planner-89979-firebase-adminsdk-7fqnk-2df4301185.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load places data
file_path = "/Users/chamodeshan/Documents/TripMate/fast_api_groups/Srilankan_Places_New.csv"
places_df = pd.read_csv(file_path)

@app.get("/recommend/")
def recommend(uuid: str):
    # Fetch user preferences
    users_ref = db.collection('userPreferences')
    users_data = [{'uuid': doc.id, **doc.to_dict()} for doc in users_ref.stream()]

    # Find the user with the input UUID
    selected_user = next((user for user in users_data if user["uuid"] == uuid), None)
    
    if not selected_user:
        return {"message": "UUID not found!"}

    # Check if "Group" is in travelPreferences
    if "Group" not in selected_user.get("travelPreferences", []):
        return {"message": "You have not selected group travel in your Preferences"}

    user_categories = selected_user["travelCategories"]
    category_count = len(user_categories)

    # Find matching users (who share at least 3 categories)
    matching_users = [
        user for user in users_data
        if user["uuid"] != uuid and len(set(user["travelCategories"]) & set(user_categories)) >= min(3, category_count)
    ]

    # Find places related to the matched categories
    matched_places = places_df[places_df["Category"].isin(user_categories)].to_dict(orient="records")

    return {
        "matchingUsers": [user["uuid"] for user in matching_users],
        "recommendedPlaces": matched_places
    }
