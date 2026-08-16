import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
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
        "Ridge Regression": Ridge(alpha=1.0),
        "Decision Tree": DecisionTreeRegressor(max_depth=8, random_state=42),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=10, random_state=42, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=150, max_depth=5, learning_rate=0.08, random_state=42
        ),
    }

    results = []
    trained_models = {}

    print(f"{'Model':<22} | {'MAE (min)':<10} | {'RMSE (min)':<10} | {'R2 Score':<10}")
    print("-" * 60)

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        mae, rmse, r2 = evaluate(model, X_test, y_test)
        results.append((name, mae, rmse, r2))
        trained_models[name] = model
        print(f"{name:<22} | {mae:<10.4f} | {rmse:<10.4f} | {r2:<10.4f}")

    # Pick best model by lowest RMSE / highest R2
    best_name = min(results, key=lambda r: r[2])[0]
    best_model = trained_models[best_name]
    best_result = next(r for r in results if r[0] == best_name)

    print("-" * 60)
    print(f"Selected Best Model: {best_name}")
    print(f"  - MAE:  {best_result[1]:.4f} minutes")
    print(f"  - RMSE: {best_result[2]:.4f} minutes")
    print(f"  - R2:   {best_result[3]:.4f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(
        {
            "model": best_model,
            "features": FEATURES,
            "model_name": best_name,
            "mae": best_result[1],
            "rmse": best_result[2],
            "r2": best_result[3],
        },
        MODEL_PATH,
    )
    print(f"Model saved successfully to {MODEL_PATH}")


if __name__ == "__main__":
    main()

