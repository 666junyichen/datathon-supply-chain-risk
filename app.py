from pathlib import Path

import joblib
import pandas as pd
import streamlit as st

from risk_features import (
    RAW_INPUT_DEFAULTS,
    RISK_LABELS,
    SAMPLE_INPUTS,
    compute_engineered_features,
)


MODEL_PATH = Path("xgb_model.pkl")
SCALER_PATH = Path("scaler.pkl")


@st.cache_resource
def load_artifacts():
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, scaler


def build_sidebar_inputs():
    preset = st.sidebar.selectbox(
        "Sample scenario",
        ["Custom"] + list(SAMPLE_INPUTS.keys()),
    )
    defaults = (
        RAW_INPUT_DEFAULTS
        if preset == "Custom"
        else {**RAW_INPUT_DEFAULTS, **SAMPLE_INPUTS[preset]}
    )

    st.sidebar.header("Shipment Inputs")
    return {
        "driver_behavior_score": st.sidebar.slider(
            "Driver behavior score", 0.0, 1.0, defaults["driver_behavior_score"], 0.01
        ),
        "traffic_congestion_level": st.sidebar.slider(
            "Traffic congestion level",
            0.0,
            10.0,
            defaults["traffic_congestion_level"],
            0.01,
        ),
        "port_congestion_level": st.sidebar.slider(
            "Port congestion level", 0.0, 10.0, defaults["port_congestion_level"], 0.01
        ),
        "hour": st.sidebar.slider("Hour of day", 0, 23, int(defaults["hour"])),
        "eta_variation_hours": st.sidebar.slider(
            "ETA variation hours", -3.0, 3.0, defaults["eta_variation_hours"], 0.01
        ),
        "delay_probability": st.sidebar.slider(
            "Delay probability", 0.0, 1.0, defaults["delay_probability"], 0.01
        ),
        "disruption_likelihood_score": st.sidebar.slider(
            "Disruption likelihood score",
            0.0,
            1.0,
            defaults["disruption_likelihood_score"],
            0.01,
        ),
        "historical_demand": st.sidebar.slider(
            "Historical demand", 0.0, 10000.0, defaults["historical_demand"], 1.0
        ),
        "warehouse_inventory_level": st.sidebar.slider(
            "Warehouse inventory level",
            0.0,
            1000.0,
            defaults["warehouse_inventory_level"],
            1.0,
        ),
        "order_fulfillment_status": st.sidebar.slider(
            "Order fulfillment status",
            0.0,
            1.0,
            defaults["order_fulfillment_status"],
            0.01,
        ),
        "loading_unloading_time": st.sidebar.slider(
            "Loading / unloading time",
            0.1,
            5.0,
            defaults["loading_unloading_time"],
            0.01,
        ),
        "customs_clearance_time": st.sidebar.slider(
            "Customs clearance time",
            1.0,
            10.0,
            defaults["customs_clearance_time"],
            0.01,
        ),
        "fatigue_monitoring_score": st.sidebar.slider(
            "Fatigue monitoring score",
            0.0,
            1.0,
            defaults["fatigue_monitoring_score"],
            0.01,
        ),
        "fuel_consumption_rate": st.sidebar.slider(
            "Fuel consumption rate",
            1.0,
            20.0,
            defaults["fuel_consumption_rate"],
            0.01,
        ),
    }


st.set_page_config(page_title="Shipment Risk Predictor", layout="wide")
st.title("Shipment Risk Predictor")
st.caption("Supply chain risk classification demo using engineered logistics features.")

values = build_sidebar_inputs()
features = compute_engineered_features(values)

missing_artifacts = [
    str(path) for path in [MODEL_PATH, SCALER_PATH] if not path.exists()
]

if missing_artifacts:
    st.warning(
        "Model artifacts are missing. Generate them first with "
        "`python scripts/export_model_artifacts.py --data path/to/dataset.csv`."
    )
    st.write("Missing files:", ", ".join(missing_artifacts))
else:
    model, scaler = load_artifacts()
    features_scaled = scaler.transform(features)
    prediction = int(model.predict(features_scaled)[0])
    probabilities = model.predict_proba(features_scaled)[0]

    st.subheader(f"Predicted Shipment Risk: {RISK_LABELS.get(prediction, prediction)}")
    st.bar_chart(
        pd.DataFrame(
            {"Probability": probabilities},
            index=["Low Risk", "Moderate Risk", "High Risk"],
        )
    )

st.subheader("Engineered Features")
st.dataframe(features, width="stretch")
