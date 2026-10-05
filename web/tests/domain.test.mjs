import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

test('preserves original GUI 0.01 precision for numeric sliders', async () => {
  const { config } = await import('../domain.mjs');
  for (const c of config) assert.equal(c.step, c.key === 'hour' ? 1 : .01, c.key);
});

test('browser features and probabilities match original Python model', async () => {
  const { features, predict, decodeModel } = await import('../domain.mjs');
  const meta = JSON.parse(readFileSync(new URL('../model/metadata.json', import.meta.url)));
  const bytes = gunzipSync(readFileSync(new URL('../model/model.bin.gz', import.meta.url)));
  const model = decodeModel(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), meta);
  const cases = JSON.parse(readFileSync(new URL('../../tests/browser-reference.json', import.meta.url)));
  for (const c of cases) {
    const f = features(c.values);
    f.forEach((v, i) => assert.ok(Math.abs(v - c.features[i]) < 1e-10, `${c.name}: feature ${i}`));
    const p = predict(c.values, model);
    assert.equal(p.label, c.label, c.name);
    p.probabilities.forEach((v, i) => assert.ok(Math.abs(v - c.probabilities[i]) < 2e-6, `${c.name}: probability ${i}: ${v} != ${c.probabilities[i]}`));
  }
});

test('rejects malformed values and corrupted model instead of inventing a prediction', async () => {
  const { validate, presets, decodeModel } = await import('../domain.mjs');
  assert.throws(() => validate({ ...presets.low, hour: NaN }));
  assert.throws(() => validate({ ...presets.low, delay_probability: 1.1 }));
  assert.throws(() => validate({ ...presets.low, hour: 6.5 }));
  assert.throws(() => validate({ ...presets.low, port_congestion_level: undefined }));
  assert.throws(() => decodeModel(new ArrayBuffer(4), { nodeCount: 100 }));
});

test('actions stay bounded and report zero inventory without false cover days', async () => {
  const { presets, validate } = await import('../domain.mjs');
  const { recommendations, applyAction, inventoryMetrics } = await import('../advice.mjs');
  const v = { ...presets.high, warehouse_inventory_level: 0 };
  assert.equal(inventoryMetrics(v).ratio, 0);
  for (const action of recommendations(v)) validate(applyAction(v, action.id));
  assert.ok(recommendations(v).some(x => x.id === 'inventory'));
  const adjusted = applyAction(v, 'customs');
  assert.ok(adjusted.customs_clearance_time < v.customs_clearance_time);
  assert.equal(adjusted.delay_probability, v.delay_probability, 'do not fabricate a causally linked delay reduction');
});

test('commercial break-even uses explicit currency assumptions, not model probability', async () => {
  const { costAnalysis } = await import('../advice.mjs');
  const c = costAnalysis({ shipmentValue: 100000, marginPct: 20, penalty: 4000, hours: 3, hourlyCost: 200, actionCost: 500, stockoutProbability: 0.25 });
  assert.equal(c.disruptionLoss, 9600);
  assert.ok(Math.abs(c.breakEvenReduction - 500 / 9600) < 1e-12);
  assert.equal(costAnalysis({ shipmentValue: 0, marginPct: 0, penalty: 0, hours: 0, hourlyCost: 0, actionCost: 500, stockoutProbability: 0 }).breakEvenReduction, null);
  assert.throws(() => costAnalysis({ shipmentValue: -1 }));
});

test('bilingual report includes raw inputs, prediction, baseline and assumptions', async () => {
  const { report } = await import('../advice.mjs');
  const { presets } = await import('../domain.mjs');
  const result = { label: 2, probabilities: [0.1, 0.2, 0.7] };
  for (const lang of ['zh', 'en']) {
    const r = report({ lang, values: presets.high, result, baseline: { values: presets.low, result: { label: 0, probabilities: [0.8, 0.1, 0.1] } }, assumptions: { shipmentValue: 100000, marginPct: 20, penalty: 4000, hours: 3, hourlyCost: 200, actionCost: 500, stockoutProbability: 0.25 } });
    assert.match(r, /traffic_congestion_level/);
    assert.match(r, /70\.0%/);
    assert.match(r, /100000/);
    assert.match(r, lang === 'zh' ? /合成数据/ : /synthetic/i);
    assert.match(r, lang === 'zh' ? /基准/ : /Baseline/);
  }
});
