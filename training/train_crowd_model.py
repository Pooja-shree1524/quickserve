"""
QuickServe - Peak Hour Crowd Prediction: Model Training
=========================================================
Trains classification models (Decision Tree, Random Forest) to predict
crowd_level (Low / Medium / High) from day_of_week, hour, and
previous_orders. Saves the best model + label encoder to
`models/crowd_model.pkl`.
"""

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "crowd_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "crowd_model.pkl")

FEATURES = ["day_of_week", "hour", "previous_orders"]
TARGET = "crowd_level"


def load_data():
    df = pd.read_csv(DATA_PATH)
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(df[TARGET])
    X = df[FEATURES]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    return X_train, X_test, y_train, y_test, encoder


def main():
    X_train, X_test, y_train, y_test, encoder = load_data()

    candidates = {
        "Decision Tree": DecisionTreeClassifier(max_depth=6, random_state=42),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42, n_jobs=-1
        ),
    }

    results = []
    trained_models = {}

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average="weighted")
        results.append((name, acc, f1))
        trained_models[name] = model
        print(f"{name:18s} | Accuracy: {acc:6.4f} | F1: {f1:6.4f}")
        print(classification_report(y_test, preds, target_names=encoder.classes_))

    best_name = max(results, key=lambda r: r[2])[0]
    best_model = trained_models[best_name]
    print(f"\nBest model: {best_name} -> saving to {MODEL_PATH}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(
        {"model": best_model, "features": FEATURES, "encoder": encoder, "model_name": best_name},
        MODEL_PATH,
    )
    print("Saved successfully.")


if __name__ == "__main__":
    main()
