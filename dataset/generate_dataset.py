"""
QuickServe - Synthetic Dataset Generator
==========================================
Generates two datasets used by the AI Prediction Module:

1. orders_dataset.csv   -> used to train the Waiting Time Prediction model
2. crowd_dataset.csv    -> used to train the Peak Hour Crowd Prediction model

In a real deployment these CSVs would be replaced by historical order data
exported from the Customer/Admin modules' database. The generation logic
here encodes realistic, explainable relationships so the trained models
behave sensibly (more orders/items/load -> longer wait; lunch & dinner
hours -> higher crowd, etc.) while still including noise so the models
have something genuine to learn.
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# 1. Waiting Time dataset
#    Features: current_orders, number_of_items, preparation_time, kitchen_load
#    Target:   waiting_time (minutes)
# ---------------------------------------------------------------------------
N1 = 4000

current_orders = np.random.randint(0, 40, N1)              # orders ahead in queue
number_of_items = np.random.randint(1, 8, N1)               # items in this order
preparation_time = np.random.randint(3, 25, N1)              # base prep time (minutes) for the items
kitchen_load = np.random.randint(0, 101, N1)                  # kitchen load percentage (0-100)

noise = np.random.normal(0, 2.0, N1)

waiting_time = (
    0.35 * current_orders
    + 1.1 * number_of_items
    + 0.55 * preparation_time
    + 0.12 * kitchen_load
    + 2.0
    + noise
)
waiting_time = np.clip(waiting_time, 2, 60).round(1)

orders_df = pd.DataFrame({
    "current_orders": current_orders,
    "number_of_items": number_of_items,
    "preparation_time": preparation_time,
    "kitchen_load": kitchen_load,
    "waiting_time": waiting_time,
})

orders_path = os.path.join(OUTPUT_DIR, "orders_dataset.csv")
orders_df.to_csv(orders_path, index=False)
print(f"Saved {len(orders_df)} rows -> {orders_path}")

# ---------------------------------------------------------------------------
# 2. Crowd Prediction dataset
#    Features: day_of_week, hour, previous_orders
#    Target:   crowd_level (Low / Medium / High)
# ---------------------------------------------------------------------------
N2 = 5000

day_of_week = np.random.randint(0, 7, N2)      # 0=Monday ... 6=Sunday
hour = np.random.randint(8, 22, N2)             # canteen operating hours 8am-10pm
previous_orders = np.random.randint(0, 80, N2)  # orders placed in the previous similar slot

def compute_crowd_score(dow, hr, prev_orders):
    score = 0
    # Lunch (12-14) and dinner (18-20) rush
    if hr in (12, 13, 19):
        score += 3
    elif hr in (14, 18, 20):
        score += 2
    elif hr in (9, 10, 16, 17):
        score += 1

    # Weekdays (college/office canteen) busier than weekends
    if dow in (0, 1, 2, 3, 4):
        score += 1

    # Historical order volume signal
    score += prev_orders / 25.0

    return score

scores = np.array([
    compute_crowd_score(d, h, p) + np.random.normal(0, 0.6)
    for d, h, p in zip(day_of_week, hour, previous_orders)
])

crowd_level = pd.cut(
    scores,
    bins=[-np.inf, 2.2, 4.2, np.inf],
    labels=["Low", "Medium", "High"],
)

crowd_df = pd.DataFrame({
    "day_of_week": day_of_week,
    "hour": hour,
    "previous_orders": previous_orders,
    "crowd_level": crowd_level.astype(str),
})

crowd_path = os.path.join(OUTPUT_DIR, "crowd_dataset.csv")
crowd_df.to_csv(crowd_path, index=False)
print(f"Saved {len(crowd_df)} rows -> {crowd_path}")
print(crowd_df["crowd_level"].value_counts())

# ---------------------------------------------------------------------------
# 3. Food order log (for the optional Recommendation feature)
#    Simple log of food_item + order timestamp used to compute
#    popular / trending / frequently-ordered foods.
# ---------------------------------------------------------------------------
foods = [
    "Veg Biryani", "Chicken Biryani", "Masala Dosa", "Idli Sambar", "Paneer Roll",
    "Chicken Roll", "Veg Fried Rice", "Noodles", "Samosa", "Sandwich",
    "Cold Coffee", "Tea", "Filter Coffee", "Veg Thali", "Egg Puff",
]
# assign each food a rough popularity weight so the log isn't uniform random
weights = np.random.dirichlet(np.ones(len(foods)) * 0.6)

N3 = 6000
order_food = np.random.choice(foods, size=N3, p=weights)
# timestamps over the last 14 days, more recent days weighted for "trending"
day_offset = np.random.exponential(scale=4, size=N3).astype(int)
day_offset = np.clip(day_offset, 0, 13)
order_date = pd.Timestamp.now().normalize() - pd.to_timedelta(day_offset, unit="D")

food_log_df = pd.DataFrame({
    "food_item": order_food,
    "order_date": order_date,
})
food_log_path = os.path.join(OUTPUT_DIR, "food_orders_log.csv")
food_log_df.to_csv(food_log_path, index=False)
print(f"Saved {len(food_log_df)} rows -> {food_log_path}")
