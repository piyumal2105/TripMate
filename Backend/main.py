from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load dataset
df = pd.read_csv("data/sri_lanka_places.csv")
df.dropna(inplace=True)

# Print column names to verify dataset structure
print("DataFrame columns:", list(df.columns))
print("Sample data:", df.iloc[0].to_dict())

# Request model for receiving travel categories
class TravelCategoryRequest(BaseModel):
    categories: list

# Function to filter data by categories
def filter_data_by_categories(df, selected_categories):
    return df[df["category"].isin(selected_categories)]

# Function to compute similarity
def compute_tfidf_matrix(df_subset):
    vectorizer = TfidfVectorizer(stop_words="english")
    return vectorizer.fit_transform(df_subset["category"] + " " + df_subset["description"])

# Function to recommend places
def recommend_places(df_subset, similarity_matrix, selected_categories, top_n=5):
    category_groups = df_subset.groupby("category")
    top_places = []
    places_per_category = max(1, top_n // len(selected_categories))
    remaining_places = top_n

    df_subset = df_subset.sample(frac=1, random_state=random.randint(1, 1000)).reset_index(drop=True)

    for category in selected_categories:
        if category in category_groups.groups:
            cat_indices = np.where(df_subset.index.isin(category_groups.groups[category]))[0]
            avg_sim_scores = similarity_matrix[cat_indices].mean(axis=0)
            ranked_indices = avg_sim_scores.argsort()[::-1]
            top_cat_indices = np.random.choice(ranked_indices[:places_per_category * 2], places_per_category, replace=False)
            top_places.extend(df_subset.iloc[top_cat_indices].to_dict(orient="records"))
            remaining_places -= places_per_category

    if remaining_places > 0:
        avg_sim_scores = similarity_matrix.mean(axis=0)
        ranked_indices = avg_sim_scores.argsort()[::-1]
        extra_indices = np.random.choice(ranked_indices[:remaining_places * 2], remaining_places, replace=False)
        top_places.extend(df_subset.iloc[extra_indices].to_dict(orient="records"))

    # Ensure latitude and longitude are included in each place
    for place in top_places:
        if 'latitude' not in place or place['latitude'] is None:
            place['latitude'] = 0.0
        if 'longitude' not in place or place['longitude'] is None:
            place['longitude'] = 0.0
            
    return top_places

# API endpoint to receive categories and return recommended places
@app.post("/predict/")
def predict_places(request: TravelCategoryRequest):
    selected_categories = request.categories

    # Filter places
    filtered_df = filter_data_by_categories(df, selected_categories)

    if filtered_df.empty:
        raise HTTPException(status_code=404, detail="No places found for selected categories")

    # Compute similarity
    tfidf_matrix = compute_tfidf_matrix(filtered_df)
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Get recommended places
    recommended_places = recommend_places(filtered_df, cosine_sim, selected_categories, top_n=5)
    
    # Debug output
    if recommended_places:
        print("Sample recommended place:", recommended_places[0])

    return {"recommended_places": recommended_places}
