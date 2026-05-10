import argparse
import sys
from pathlib import Path

import joblib
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBClassifier

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from risk_features import ENGINEERED_FEATURES, compute_engineered_features


RISK_MAP = {
    "Low Risk": 0,
    "Moderate Risk": 1,
    "High Risk": 2,
}


RAW_FEATURE_COLUMNS = [
    "driver_behavior_score",
    "traffic_congestion_level",
    "port_congestion_level",
    "hour",
    "eta_variation_hours",
    "delay_probability",
    "disruption_likelihood_score",
    "historical_demand",
    "warehouse_inventory_level",
    "order_fulfillment_status",
    "loading_unloading_time",
    "customs_clearance_time",
    "fatigue_monitoring_score",
    "fuel_consumption_rate",
]


def prepare_training_data(data_path):
    df = pd.read_csv(data_path)

    if "hour" not in df.columns:
        if "timestamp" not in df.columns:
            raise ValueError("Dataset must contain either `hour` or `timestamp`.")
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df["hour"] = df["timestamp"].dt.hour

    if "risk_classification_encoded" not in df.columns:
        if "risk_classification" not in df.columns:
            raise ValueError(
                "Dataset must contain `risk_classification_encoded` or `risk_classification`."
            )
        df["risk_classification_encoded"] = df["risk_classification"].map(RISK_MAP)

    missing_columns = [
        column
        for column in RAW_FEATURE_COLUMNS + ["risk_classification_encoded"]
        if column not in df.columns
    ]
    if missing_columns:
        raise ValueError(f"Dataset is missing columns: {missing_columns}")

    engineered = pd.concat(
        [
            compute_engineered_features(row.to_dict())
            for _, row in df[RAW_FEATURE_COLUMNS].iterrows()
        ],
        ignore_index=True,
    )
    target = df["risk_classification_encoded"].astype(int)
    return engineered, target


def train_and_export(data_path, model_path, scaler_path):
    X_raw, y = prepare_training_data(data_path)

    scaler = MinMaxScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X_raw),
        columns=ENGINEERED_FEATURES,
    )

    X_resampled, y_resampled = SMOTE(random_state=42, k_neighbors=5).fit_resample(
        X_scaled, y
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X_resampled,
        y_resampled,
        test_size=0.5,
        random_state=42,
        stratify=y_resampled,
    )

    model = XGBClassifier(
        n_estimators=800,
        learning_rate=0.05,
        max_depth=12,
        random_state=42,
        eval_metric="mlogloss",
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, predictions))
    print(classification_report(y_test, predictions))

    joblib.dump(model, model_path, compress=3)
    joblib.dump(scaler, scaler_path, compress=3)
    print(f"Saved model to {model_path}")
    print(f"Saved scaler to {scaler_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Train the XGBoost shipment risk model and export demo artifacts."
    )
    parser.add_argument("--data", required=True, help="Path to the raw logistics CSV.")
    parser.add_argument("--model", default="xgb_model.pkl")
    parser.add_argument("--scaler", default="scaler.pkl")
    args = parser.parse_args()

    train_and_export(Path(args.data), Path(args.model), Path(args.scaler))


if __name__ == "__main__":
    main()
