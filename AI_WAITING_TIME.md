# QuickServe — AI Waiting Time & Estimated Collection Time Documentation

## 1. Dataset Overview
- **Dataset Name**: `orders_dataset.csv`
- **Location**: `dataset/orders_dataset.csv`
- **Total Records**: 4,000 historical order entries
- **Missing / Null Values**: 0
- **Duplicate Records**: 0

---

## 2. Features & Target Variable

### Input Features:
1. **`current_orders`** (`int64`): Total number of active orders ahead in the queue.
2. **`number_of_items`** (`int64`): Total count of distinct food items in the placed order.
3. **`preparation_time`** (`int64`): Base cumulative cooking/prep time for the items (minutes).
4. **`kitchen_load`** (`int64`): Real-time percentage load of the kitchen capacity (0% – 100%).

### Target Variable:
- **`waiting_time`** (`float64`): Total elapsed waiting and preparation time in minutes.

---

## 3. Data Preprocessing & Validation
- **Feature Selection**: Extracted continuous numerical vector `[current_orders, number_of_items, preparation_time, kitchen_load]`.
- **Lower Bound Enforcement**: `prediction = max(1.0, round(y_pred, 1))` to ensure no negative or zero waiting times.

---

## 4. Train / Test Methodology & Evaluation Results
- **Split Ratio**: 80% Training (N=3,200), 20% Held-Out Testing (N=800)
- **Random State**: Fixed `random_state=42` for strict reproducibility

### Model Comparison Table:
| Machine Learning Model | MAE (Mean Absolute Error) | RMSE (Root Mean Squared Error) | R² Score (Accuracy) | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | **1.5671 min** | **1.9664 min** | **0.9220 (92.20%)** | 🏆 **Selected** |
| **Ridge Regression (alpha=1.0)** | 1.5671 min | 1.9664 min | 0.9220 (92.20%) | Evaluated |
| **Gradient Boosting Regressor** | 1.6873 min | 2.0980 min | 0.9112 (91.12%) | Evaluated |
| **Random Forest Regressor** | 1.7287 min | 2.1731 min | 0.9047 (90.47%) | Evaluated |
| **Decision Tree Regressor** | 2.3030 min | 2.8639 min | 0.8346 (83.46%) | Evaluated |

---

## 5. Model Selection & Serialization
- **Selected Model**: `Linear Regression` (R² = 0.9220, MAE = 1.57 min)
- **Saved Model File**: `models/waiting_time_model.pkl` (Joblib bundle containing `{ "model": best_model, "features": FEATURES, "model_name": "Linear Regression" }`)

---

## 6. How FastAPI Loads & Serves the Model
At startup (`prediction_api/main.py`), FastAPI loads the serialized bundle into memory:
```python
waiting_time_bundle = joblib.load("models/waiting_time_model.pkl")
model = waiting_time_bundle["model"]
features = waiting_time_bundle["features"]
```

---

## 7. API Specification

### Endpoint:
`POST http://localhost:8001/predictWaitingTime` (and alias `/predict/waiting-time`)

### Request Body:
```json
{
  "current_orders": 8,
  "number_of_items": 2,
  "preparation_time": 12.0,
  "kitchen_load": 50.0
}
```

### Response Body:
```json
{
  "estimated_waiting_time_minutes": 13.0,
  "predicted_waiting_time": 13.0,
  "unit": "minutes",
  "message": "Estimated Waiting Time: 13.0 minutes"
}
```

---

## 8. Dynamic Estimated Collection Time Formula
`Estimated Collection Time = Order Placement Time + AI Predicted Waiting Time`

Example:
- Order Placement Time: `2:30 PM`
- Predicted Wait: `18 minutes`
- Estimated Collection: `2:48 PM`

---

## 9. How to Retrain the Model
To re-run training and evaluate models on any updated dataset:
```powershell
py training/train_waiting_time_model.py
```
This automatically updates `models/waiting_time_model.pkl`.
