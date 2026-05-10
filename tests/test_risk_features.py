import math
import unittest

from risk_features import ENGINEERED_FEATURES, compute_engineered_features


class RiskFeatureTests(unittest.TestCase):
    def test_compute_engineered_features_returns_expected_columns_and_values(self):
        values = {
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
        }

        features = compute_engineered_features(values)

        self.assertEqual(list(features.columns), ENGINEERED_FEATURES)
        self.assertEqual(len(features), 1)
        self.assertAlmostEqual(
            features.loc[0, "congestion_stress"],
            (1.0**2 + 1.0**2) / (1 + 6 + 1e-6),
        )
        self.assertAlmostEqual(
            features.loc[0, "clearance_friction"],
            math.sqrt(2.0 * (1 + 1.0)),
        )


if __name__ == "__main__":
    unittest.main()
