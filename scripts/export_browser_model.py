"""Export the fitted numeric XGBoost model, never retrain or approximate it."""
from pathlib import Path
import gzip
import hashlib
import json
import struct
import sys

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from risk_features import ENGINEERED_FEATURES, SAMPLE_INPUTS, compute_engineered_features

RANGES = {
    'driver_behavior_score': (0, 1), 'traffic_congestion_level': (0, 10),
    'port_congestion_level': (0, 10), 'hour': (0, 23),
    'eta_variation_hours': (-3, 3), 'delay_probability': (0, 1),
    'disruption_likelihood_score': (0, 1), 'historical_demand': (0, 10000),
    'warehouse_inventory_level': (0, 1000), 'order_fulfillment_status': (0, 1),
    'loading_unloading_time': (0.1, 5), 'customs_clearance_time': (1, 10),
    'fatigue_monitoring_score': (0, 1), 'fuel_consumption_rate': (1, 20),
}

def main():
    model = joblib.load(ROOT / 'xgb_model.pkl')
    scaler = joblib.load(ROOT / 'scaler.pkl')
    document = json.loads(model.get_booster().save_raw(raw_format='json'))
    learner = document['learner']
    assert learner['objective']['name'] == 'multi:softprob'
    assert learner['gradient_booster']['name'] == 'gbtree'
    assert list(scaler.feature_names_in_) == ENGINEERED_FEATURES
    assert list(model.classes_) == [0, 1, 2]
    assert not scaler.clip
    ensemble = learner['gradient_booster']['model']
    roots, data, offset = [], bytearray(), 0
    for tree, class_id in zip(ensemble['trees'], ensemble['tree_info']):
        assert not any(tree['split_type']), 'Categorical trees require a different evaluator'
        roots.append([offset, class_id])
        for left, right, value, feature, default in zip(
            tree['left_children'], tree['right_children'], tree['split_conditions'],
            tree['split_indices'], tree['default_left']
        ):
            data.extend(struct.pack('<iifBBxx', left, right, value, feature, default))
        offset += len(tree['left_children'])
    raw_base = learner['learner_model_param']['base_score']
    base = json.loads(raw_base)
    if not isinstance(base, list):
        base = [float(base)] * 3
    directory = ROOT / 'web' / 'model'
    directory.mkdir(parents=True, exist_ok=True)
    with open(directory / 'model.bin.gz', 'wb') as f:
        f.write(gzip.compress(bytes(data), compresslevel=9, mtime=0))
    metadata = {
        'format': 'xgb-numeric-le16-v1', 'nodeCount': offset, 'byteLength': len(data),
        'roots': roots, 'baseMargin': base, 'features': ENGINEERED_FEATURES,
        'scale': scaler.scale_.tolist(), 'min': scaler.min_.tolist(),
        'dataMin': scaler.data_min_.tolist(), 'dataMax': scaler.data_max_.tolist(),
        'classes': ['Low Risk', 'Moderate Risk', 'High Risk'],
        'modelSha256': hashlib.sha256((ROOT / 'xgb_model.pkl').read_bytes()).hexdigest(),
        'binarySha256': hashlib.sha256(data).hexdigest(),
        'source': 'Existing xgb_model.pkl + scaler.pkl; no retraining',
    }
    (directory / 'metadata.json').write_text(json.dumps(metadata, separators=(',', ':')), encoding='utf-8')
    cases = [(key, value.copy()) for key, value in SAMPLE_INPUTS.items()]
    rng = np.random.default_rng(20261005)
    for i in range(96):
        values = {k: float(rng.uniform(*r)) for k, r in RANGES.items()}
        values['hour'] = int(rng.integers(0, 24))
        cases.append((f'random-{i}', values))
    for key, limits in RANGES.items():
        for value in limits:
            values = SAMPLE_INPUTS['Low Risk'].copy()
            values[key] = value
            cases.append((f'boundary-{key}-{value}', values))
    fixtures = []
    for name, values in cases:
        features = compute_engineered_features(values)
        probabilities = model.predict_proba(scaler.transform(features))[0]
        fixtures.append({'name': name, 'values': values, 'features': features.values[0].tolist(),
                         'probabilities': probabilities.tolist(), 'label': int(np.argmax(probabilities))})
    (ROOT / 'tests' / 'browser-reference.json').write_text(json.dumps(fixtures), encoding='utf-8')
    print(f'Exported {len(roots)} trees, {offset} nodes, {len(fixtures)} reference scenarios')
    print(f'Compressed artifact: {(directory / "model.bin.gz").stat().st_size / 1048576:.2f} MiB')
    for c in fixtures[:3]:
        print(c['name'], c['label'], c['probabilities'])

if __name__ == '__main__':
    main()
