from flask import Flask, request, jsonify
from travel_recommendation import TravelRecommendationAgent

app = Flask(__name__)

@app.route('/recommend_place', methods=['POST'])
def recommend_place():
    """Set locations and get travel recommendation."""
    data = request.get_json()

    current_location = data.get('current_location')
    next_location = data.get('next_location')

    if not current_location or not next_location:
        return jsonify({"message": "Both current_location and next_location are required."}), 400
    
    agent = TravelRecommendationAgent()

    agent.set_locations(current_location, next_location)

    recommendation = agent.recommend_place()

    if "message" in recommendation:
        return jsonify(recommendation), 404 
    else:
        return jsonify(recommendation), 200  


if __name__ == '__main__':
    app.run(debug=True)
