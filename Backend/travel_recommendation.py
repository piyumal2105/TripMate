from phi.agent import Agent
from phi.tools.duckduckgo import DuckDuckGo
from pydantic import BaseModel
from typing import List, Optional

class Place(BaseModel):
    name: str
    hours: int
    minutes: int

class TravelRecommendationAgent:
    def __init__(self):
        self.current_location = None
        self.next_location = None

    def set_locations(self, current_location: str, next_location: str):
        self.current_location = current_location
        self.next_location = next_location

    def recommend_place(self):
        """Recommends a place based on current and next location in one function."""
        if not self.current_location or not self.next_location:
            return {"message": "Locations not set."}
        
        agent = Agent(
            model=None,
            tools=[DuckDuckGo()],
            show_tool_calls=True,
            markdown=True,
            description="Search for places and their coordinates on the internet.",
            response_model=Place,  
        )

        prompt = f"Given the current location '{self.current_location}' and the next destination '{self.next_location}', recommend a suitable place to visit near the next destination. The recommended place should be similar in type to '{self.next_location}', and you should also suggest an ideal visit time based on the type of place. If there are no similar places, suggest a general place near '{self.next_location}'. Give and average time to spent there hours and minutes seperately."
        
        response = agent.run(prompt)
        
        if not response:
            return {"message": "Could not fetch a recommendation."}
        
        print(response.content)
        
        return response.content.dict()

