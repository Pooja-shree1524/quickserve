"""
QuickServe - Waiting Time Prediction: Model Training
=====================================================
Trains three candidate regression models (as listed in the tech spec):
    - Linear Regression
    - Decision Tree Regressor
    - Random Forest Regressor

Evaluates each on a held-out test split using MAE / RMSE / R2, prints a
comparison table, and saves the best-performing model to
`models/waiting_time_model.pkl` using joblib so the prediction API can load
it directly.
"""

import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "orders_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "waiting_time_model.pkl")

FEATURES = ["current_orders", "number_of_items", "preparation_time", "kitchen_load"]
TARGET = "waiting_time"


def load_data():
    df = pd.read_csv(DATA_PATH)
    X = df[FEATURES]
    y = df[TARGET]
    return train_test_split(X, y, test_size=0.2, random_state=42)


def evaluate(model, X_test, y_test):
    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)
    return mae, rmse, r2


def main():
    X_train, X_test, y_train, y_test = load_data()

    candidates = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=8, random_state=42),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=10, random_state=42, n_jobs=-1
        ),
    }

    results = []
    trained_models = {}

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        mae, rmse, r2 = evaluate(model, X_test, y_test)
        results.append((name, mae, rmse, r2))
        trained_models[name] = model
        print(f"{name:18s} | MAE: {mae:6.3f} | RMSE: {rmse:6.3f} | R2: {r2:6.4f}")

    # Pick best model by lowest RMSE
    best_name = min(results, key=lambda r: r[2])[0]
    best_model = trained_models[best_name]
    print(f"\nBest model: {best_name} -> saving to {MODEL_PATH}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(
        {"model": best_model, "features": FEATURES, "model_name": best_name},
        MODEL_PATH,
    )
    print("Saved successfully.")


if __name__ == "__main__":
    main()
