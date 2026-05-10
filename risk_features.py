import numpy as np
import pandas as pd


ENGINEERED_FEATURES = [
    "fuel_efficiency_index",
    "congestion_stress",
    "logistics_resilience",
    "inventory_pressure",
    "loading_saturation",
    "clearance_friction",
    "human_performance_risk",
]


RISK_LABELS = {
    0: "Low Risk",
    1: "Moderate Risk",
    2: "High Risk",
}


RAW_INPUT_DEFAULTS = {
    "driver_behavior_score": 0.5,
    "traffic_congestion_level": 5.0,
    "port_congestion_level": 5.0,
    "hour": 8,
    "eta_variation_hours": 0.0,
    "delay_probability": 0.3,
    "disruption_likelihood_score": 0.5,
    "historical_demand": 500.0,
    "warehouse_inventory_level": 500.0,
    "order_fulfillment_status": 0.8,
    "loading_unloading_time": 2.0,
    "customs_clearance_time": 3.0,
    "fatigue_monitoring_score": 0.5,
    "fuel_consumption_rate": 10.0,
}


SAMPLE_INPUTS = {
    "Low Risk": {
        "driver_behavior_score": 0.2,
        "traffic_congestion_level": 1.0,
        "port_congestion_level": 1.0,
        "hour": 6,
        "eta_variation_hours": 0.1,
        "delay_probability": 0.1,
        "disruption_likelihood_score": 0.1,
        "historical_demand": 400.0,
        "warehouse_inventory_level": 800.0,
        "order_fulfillment_status": 0.9,
        "loading_unloading_time": 1.5,
        "customs_clearance_time": 2.0,
        "fatigue_monitoring_score": 0.9,
        "fuel_consumption_rate": 8.0,
    },
    "Moderate Risk": {
        "driver_behavior_score": 0.2,
        "traffic_congestion_level": 1.0,
        "port_congestion_level": 1.0,
        "hour": 18,
        "eta_variation_hours": 0.5,
        "delay_probability": 0.2,
        "disruption_likelihood_score": 0.2,
        "historical_demand": 500.0,
        "warehouse_inventory_level": 900.0,
        "order_fulfillment_status": 0.3,
        "loading_unloading_time": 1.0,
        "customs_clearance_time": 2.0,
        "fatigue_monitoring_score": 0.2,
        "fuel_consumption_rate": 5.0,
    },
    "High Risk": {
        "driver_behavior_score": 0.9,
        "traffic_congestion_level": 9.0,
        "port_congestion_level": 9.0,
        "hour": 20,
        "eta_variation_hours": 2.5,
        "delay_probability": 0.8,
        "disruption_likelihood_score": 0.9,
        "historical_demand": 8000.0,
        "warehouse_inventory_level": 200.0,
        "order_fulfillment_status": 0.3,
        "loading_unloading_time": 4.5,
        "customs_clearance_time": 9.0,
        "fatigue_monitoring_score": 0.2,
        "fuel_consumption_rate": 18.0,
    },
}


def compute_engineered_features(values):
    return pd.DataFrame(
        [
            {
                "fuel_efficiency_index": values["fuel_consumption_rate"]
                / (1 + np.exp(values["driver_behavior_score"])),
                "congestion_stress": (
                    values["traffic_congestion_level"] ** 2
                    + values["port_congestion_level"] ** 2
                )
                / (1 + values["hour"] + 1e-6),
                "logistics_resilience": np.exp(
                    -(
                        values["eta_variation_hours"] ** 2
                        + values["delay_probability"]
                        + values["disruption_likelihood_score"]
                    )
                ),
                "inventory_pressure": np.log1p(
                    (values["historical_demand"] + 1)
                    / (values["warehouse_inventory_level"] + 1)
                ),
                "loading_saturation": np.tanh(
                    values["order_fulfillment_status"]
                    / (values["loading_unloading_time"] + 0.1)
                ),
                "clearance_friction": np.sqrt(
                    values["customs_clearance_time"]
                    * (1 + values["port_congestion_level"])
                ),
                "human_performance_risk": values["driver_behavior_score"]
                * np.exp(1 - values["fatigue_monitoring_score"]),
            }
        ],
        columns=ENGINEERED_FEATURES,
    )
