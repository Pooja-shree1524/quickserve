"""
QuickServe AI Prediction Module - Request/Response Schemas
"""

from pydantic import BaseModel, Field


class WaitingTimeRequest(BaseModel):
    current_orders: int = Field(..., ge=0, description="Number of orders currently ahead in the queue")
    number_of_items: int = Field(..., ge=1, description="Number of items in this order")
    preparation_time: float = Field(..., ge=0, description="Estimated base preparation time (minutes) for the items")
    kitchen_load: float = Field(..., ge=0, le=100, description="Current kitchen load percentage (0-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "current_orders": 12,
                "number_of_items": 3,
                "preparation_time": 10,
                "kitchen_load": 65,
            }
        }


class WaitingTimeResponse(BaseModel):
    estimated_waiting_time_minutes: float
    message: str


class CrowdRequest(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    time: str = Field(..., description="Time in HH:MM (24hr) format")
    previous_orders: int = Field(..., ge=0, description="Number of orders placed in the same slot previously")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2026-08-10",
                "time": "13:00",
                "previous_orders": 45,
            }
        }


class CrowdResponse(BaseModel):
    crowd_level: str
    confidence: float
    probabilities: dict


class RecommendationResponse(BaseModel):
    popular_foods: list
    trending_foods: list
    frequently_ordered: list
