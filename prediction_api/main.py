"""
QuickServe - AI Prediction Module: Prediction API
====================================================
Exposes:
    POST /predictWaitingTime  -> estimated wait time (minutes)
    POST /predictCrowd        -> Low / Medium / High crowd forecast
    GET  /recommendation      -> popular / trending / frequently ordered foods

Run locally:
    uvicorn prediction_api.main:app --reload --port 8000

Then test with Postman or curl, e.g.:
    curl -X POST http://127.0.0.1:8000/predictWaitingTime \
         -H "Content-Type: application/json" \
         -d '{"current_orders":12,"number_of_items":3,"preparation_time":10,"kitchen_load":65}'
"""

import os
from datetime import datetime

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from prediction_api.schemas import (
    WaitingTimeRequest,
    WaitingTimeResponse,
    CrowdRequest,
    CrowdResponse,
    RecommendationResponse,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

app = FastAPI(
    title="QuickServe AI Prediction Module",
    description="AI microservice for waiting-time prediction, peak-hour crowd forecasting, "
                "and food recommendations for the QuickServe smart canteen system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load trained models at startup
# ---------------------------------------------------------------------------
waiting_time_bundle = None
crowd_bundle = None
food_log_df = None


@app.on_event("startup")
def load_artifacts():
    global waiting_time_bundle, crowd_bundle, food_log_df

    wt_path = os.path.join(MODELS_DIR, "waiting_time_model.pkl")
    crowd_path = os.path.join(MODELS_DIR, "crowd_model.pkl")

    if not os.path.exists(wt_path) or not os.path.exists(crowd_path):
        raise RuntimeError(
            "Trained models not found. Run training/train_waiting_time_model.py "
            "and training/train_crowd_model.py first."
        )

    waiting_time_bundle = joblib.load(wt_path)
    crowd_bundle = joblib.load(crowd_path)

    food_log_path = os.path.join(DATASET_DIR, "food_orders_log.csv")
    if os.path.exists(food_log_path):
        food_log_df = pd.read_csv(food_log_path, parse_dates=["order_date"])

    print(f"Loaded waiting-time model: {waiting_time_bundle['model_name']}")
    print(f"Loaded crowd model: {crowd_bundle['model_name']}")


@app.get("/")
def root():
    return {
        "service": "QuickServe AI Prediction Module",
        "status": "running",
        "endpoints": ["/predictWaitingTime", "/predictCrowd", "/recommendation", "/docs"],
    }


# ---------------------------------------------------------------------------
# Feature 1: Waiting Time Prediction
# ---------------------------------------------------------------------------
@app.post("/predictWaitingTime", response_model=WaitingTimeResponse)
@app.post("/predict/waiting-time", response_model=WaitingTimeResponse)
def predict_waiting_time(request: WaitingTimeRequest):
    if waiting_time_bundle is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    model = waiting_time_bundle["model"]
    features = waiting_time_bundle["features"]

    X = pd.DataFrame([{
        "current_orders": request.current_orders,
        "number_of_items": request.number_of_items,
        "preparation_time": request.preparation_time,
        "kitchen_load": request.kitchen_load,
    }])[features]

    prediction = model.predict(X)[0]
    prediction = max(1.0, round(float(prediction), 1))

    return WaitingTimeResponse(
        estimated_waiting_time_minutes=prediction,
        predicted_waiting_time=prediction,
        unit="minutes",
        message=f"Estimated Waiting Time: {prediction} minutes",
    )


# ---------------------------------------------------------------------------
# Feature 2: Peak Hour Crowd Prediction
# ---------------------------------------------------------------------------
@app.post("/predictCrowd", response_model=CrowdResponse)
def predict_crowd(request: CrowdRequest):
    if crowd_bundle is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    try:
        dt = datetime.strptime(request.date, "%Y-%m-%d")
        t = datetime.strptime(request.time, "%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date/time format. Use date=YYYY-MM-DD and time=HH:MM.",
        )

    day_of_week = dt.weekday()  # 0=Monday ... 6=Sunday
    hour = t.hour

    model = crowd_bundle["model"]
    encoder = crowd_bundle["encoder"]
    features = crowd_bundle["features"]

    X = pd.DataFrame([{
        "day_of_week": day_of_week,
        "hour": hour,
        "previous_orders": request.previous_orders,
    }])[features]

    pred_encoded = model.predict(X)[0]
    pred_label = encoder.inverse_transform([pred_encoded])[0]

    probs = model.predict_proba(X)[0]
    prob_dict = {cls: round(float(p), 3) for cls, p in zip(encoder.classes_, probs)}
    confidence = round(float(max(probs)), 3)

    return CrowdResponse(
        crowd_level=pred_label,
        confidence=confidence,
        probabilities=prob_dict,
    )


# ---------------------------------------------------------------------------
# Feature 3: Recommendation (Optional)
# ---------------------------------------------------------------------------
@app.get("/recommendation", response_model=RecommendationResponse)
def recommendation(top_n: int = 5):
    if food_log_df is None or food_log_df.empty:
        raise HTTPException(status_code=503, detail="Food order log not available.")

    # Popular foods: highest overall order count across the full log
    popular = (
        food_log_df["food_item"].value_counts().head(top_n).index.tolist()
    )

    # Trending foods: highest order count in the last 3 days
    recent_cutoff = food_log_df["order_date"].max() - pd.Timedelta(days=3)
    recent_df = food_log_df[food_log_df["order_date"] >= recent_cutoff]
    trending = (
        recent_df["food_item"].value_counts().head(top_n).index.tolist()
    )

    # Frequently ordered: same as popular here since we don't have per-user
    # login data in this module; in production this would be filtered by
    # the logged-in customer's own order history from the Customer Module.
    frequently_ordered = popular[:top_n]

    return RecommendationResponse(
        popular_foods=popular,
        trending_foods=trending,
        frequently_ordered=frequently_ordered,
    )
