import tkinter as tk
from tkinter import ttk
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier


# Load Trained Model + Scaler

model = joblib.load("xgb_model.pkl")
scaler = joblib.load("scaler.pkl")   # make sure you saved this during training

# Compute Engineered Features

def compute_engineered_features(vals):
    return pd.DataFrame([{
        "fuel_efficiency_index": vals["fuel_consumption_rate"] / (1 + np.exp(vals["driver_behavior_score"])),
        "congestion_stress": (vals["traffic_congestion_level"]**2 + vals["port_congestion_level"]**2) / (1 + vals["hour"] + 1e-6),
        "logistics_resilience": np.exp(-(vals["eta_variation_hours"]**2 + vals["delay_probability"] + vals["disruption_likelihood_score"])),
        "inventory_pressure": np.log1p((vals["historical_demand"] + 1) / (vals["warehouse_inventory_level"] + 1)),
        "loading_saturation": np.tanh(vals["order_fulfillment_status"] / (vals["loading_unloading_time"] + 0.1)),
        "clearance_friction": np.sqrt(vals["customs_clearance_time"] * (1 + vals["port_congestion_level"])),
        "human_performance_risk": vals["driver_behavior_score"] * np.exp(1 - vals["fatigue_monitoring_score"])
    }])


# Prediction Function

def predict():
    vals = {name: sliders[name].get() for name in sliders}
    features = compute_engineered_features(vals)

    #Use the global MinMaxScaler trained on dataset
    features_norm = scaler.transform(features)

    prediction = model.predict(features_norm)[0]
    risk_map = {0: "Low Risk 🟢", 1: "Moderate Risk 🟡", 2: "High Risk 🔴"}

    # Update risk label
    result_label.config(text=f"Predicted Shipment Risk: {risk_map.get(prediction, prediction)}")

    # Update engineered feature labels
    for i, col in enumerate(features.columns):
        feat_labels[col].config(text=f"{col}: {features.iloc[0, i]:.3f}")

    proba = model.predict_proba(features_norm)[0]
    print("Probabilities:", proba)  # [Low, Moderate, High]



# Preset Buttons for Sample Values

def set_sample(risk_level):
    samples = {
        "low": {
            "driver_behavior_score": 0.2,
            "traffic_congestion_level": 1,
            "port_congestion_level": 1,
            "hour": 6,
            "eta_variation_hours": 0.1,
            "delay_probability": 0.1,
            "disruption_likelihood_score": 0.1,
            "historical_demand": 400,
            "warehouse_inventory_level": 800,
            "order_fulfillment_status": 0.9,
            "loading_unloading_time": 1.5,
            "customs_clearance_time": 2,
            "fatigue_monitoring_score": 0.9,
            "fuel_consumption_rate": 8,
        },
       "moderate": {
    "driver_behavior_score": 0.2,
    "traffic_congestion_level": 1,
    "port_congestion_level": 1,
    "hour": 18,
    "eta_variation_hours": 0.5,
    "delay_probability": 0.2,
    "disruption_likelihood_score": 0.2,
    "historical_demand": 500,
    "warehouse_inventory_level": 900,
    "order_fulfillment_status": 0.3,
    "loading_unloading_time": 1,
    "customs_clearance_time": 2,
    "fatigue_monitoring_score": 0.2,
    "fuel_consumption_rate": 5
}
,

        "high": {
            "driver_behavior_score": 0.9,
            "traffic_congestion_level": 9,
            "port_congestion_level": 9,
            "hour": 20,
            "eta_variation_hours": 2.5,
            "delay_probability": 0.8,
            "disruption_likelihood_score": 0.9,
            "historical_demand": 8000,
            "warehouse_inventory_level": 200,
            "order_fulfillment_status": 0.3,
            "loading_unloading_time": 4.5,
            "customs_clearance_time": 9,
            "fatigue_monitoring_score": 0.2,
            "fuel_consumption_rate": 18,
        },
    }

    for name, val in samples[risk_level].items():
        sliders[name].set(val)
    predict()  # auto-run prediction after setting values


# Tkinter GUI Setup

root = tk.Tk()
root.title("Shipment Risk Predictor")

# Define sliders (secondary variables)
sliders = {}

vars_config = {
    "driver_behavior_score": (0, 1, 0.5),
    "traffic_congestion_level": (0, 10, 5),
    "port_congestion_level": (0, 10, 5),
    "hour": (0, 23, 8),
    "eta_variation_hours": (-3, 3, 0),
    "delay_probability": (0, 1, 0.3),
    "disruption_likelihood_score": (0, 1, 0.5),
    "historical_demand": (0, 10000, 500),
    "warehouse_inventory_level": (0, 1000, 500),
    "order_fulfillment_status": (0, 1, 0.8),
    "loading_unloading_time": (0.1, 5, 2),
    "customs_clearance_time": (1, 10, 3),
    "fatigue_monitoring_score": (0, 1, 0.5),
    "fuel_consumption_rate": (1, 20, 10),
}

# Create sliders dynamically
for i, (name, (min_val, max_val, default)) in enumerate(vars_config.items()):
    tk.Label(root, text=name).grid(row=i, column=0, sticky="w", padx=10, pady=2)
    sliders[name] = tk.Scale(root, from_=min_val, to=max_val, resolution=0.01,
                             orient=tk.HORIZONTAL, length=250)
    sliders[name].set(default)
    sliders[name].grid(row=i, column=1, padx=10, pady=2)

# Predict button
predict_btn = ttk.Button(root, text="Predict Risk", command=predict)
predict_btn.grid(row=len(vars_config), column=0, columnspan=2, pady=10)

# Preset buttons
preset_frame = tk.Frame(root)
preset_frame.grid(row=len(vars_config)+1, column=0, columnspan=2, pady=10)

tk.Button(preset_frame, text="Sample Low Risk", command=lambda: set_sample("low")).pack(side="left", padx=5)
tk.Button(preset_frame, text="Sample Moderate Risk", command=lambda: set_sample("moderate")).pack(side="left", padx=5)
tk.Button(preset_frame, text="Sample High Risk", command=lambda: set_sample("high")).pack(side="left", padx=5)

# Result label
result_label = tk.Label(root, text="Adjust sliders or pick a sample → Predict", font=("Arial", 14))
result_label.grid(row=len(vars_config)+2, column=0, columnspan=2, pady=20)

# ==========================# Engineered Features Display

feat_labels = {}
feat_names = [
    "fuel_efficiency_index", "congestion_stress", "logistics_resilience",
    "inventory_pressure", "loading_saturation", "clearance_friction",
    "human_performance_risk"
]

for i, feat in enumerate(feat_names):
    feat_labels[feat] = tk.Label(root, text=f"{feat}: -", font=("Arial", 10))
    feat_labels[feat].grid(row=len(vars_config)+3+i, column=0, columnspan=2, sticky="w", padx=10)

# Run app
root.mainloop()
