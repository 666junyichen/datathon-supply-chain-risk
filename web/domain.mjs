export const config = [
  ['driver_behavior_score', '驾驶行为风险分数', 'Driver behavior score', 0, 1, .01, 'people', '分数越高，原公式中的人员风险越高。字段方向仍需业务核实。', 'Higher values increase the original human-risk feature; field direction needs validation.'],
  ['traffic_congestion_level', '道路拥堵', 'Road congestion', 0, 10, .1, 'transport', '场景拥堵指数，0–10。', 'Scenario congestion index, 0–10.'],
  ['port_congestion_level', '港口拥堵', 'Port congestion', 0, 10, .1, 'transport', '场景拥堵指数，0–10。', 'Scenario congestion index, 0–10.'],
  ['hour', '运输时段', 'Hour of day', 0, 23, 1, 'transport', '原公式使用小时作为分母；晚出发不代表现实中一定更安全。', 'The original formula uses hour as a divisor; departing later is not necessarily safer.'],
  ['eta_variation_hours', 'ETA 偏差', 'ETA variation', -3, 3, .01, 'transport', '单位：小时。原公式取平方，提前和延后被对称处理。', 'Hours. The squared original feature treats early and late arrival symmetrically.'],
  ['delay_probability', '延误概率输入', 'Delay probability input', 0, 1, .01, 'transport', '外部输入的假设或评估值，与模型类别概率不同。', 'An external assumption or estimate, distinct from model class probability.'],
  ['disruption_likelihood_score', '中断可能性分数', 'Disruption likelihood', 0, 1, .01, 'transport', '风险信号输入；不要把它当作可直接执行的控制按钮。', 'A risk signal, not a directly controllable operational lever.'],
  ['historical_demand', '历史需求量', 'Historical demand', 0, 10000, 1, 'inventory', '原数据没有明确统计周期；只计算同口径供需比，不计算库存天数。', 'The observation period is unspecified; compare like-for-like units, not days of supply.'],
  ['warehouse_inventory_level', '仓库库存量', 'Warehouse inventory', 0, 1000, 1, 'inventory', '与历史需求使用同口径单位，模型保留原 GUI 上限。', 'Same units as historical demand; retains the original GUI maximum.'],
  ['order_fulfillment_status', '订单履约状态', 'Order fulfillment status', 0, 1, .01, 'inventory', '沿用原 GUI 数值编码；未核实前不作为真实履约率。', 'Original numeric encoding; do not interpret it as measured fulfillment rate without validation.'],
  ['loading_unloading_time', '装卸时间', 'Loading / unloading time', .1, 5, .1, 'inventory', '单位：小时，模拟预约月台及排班后的目标时间。', 'Hours; a scenario target for dock scheduling and coordination.'],
  ['customs_clearance_time', '清关时间', 'Customs clearance time', 1, 10, .1, 'transport', '单位：小时，实际可行性受文件、查验和口岸条件影响。', 'Hours; feasibility depends on documentation, inspections and border conditions.'],
  ['fatigue_monitoring_score', '疲劳监测分数', 'Fatigue monitoring score', 0, 1, .01, 'people', '原公式中分数越高，人员风险越低；需核实是否代表清醒程度。', 'Higher means lower human risk in the original formula; confirm whether it measures alertness.'],
  ['fuel_consumption_rate', '燃油消耗指标', 'Fuel consumption metric', 1, 20, .1, 'people', '原数据未明确油耗单位；不直接换算燃油费用或碳排放。', 'Fuel units are unspecified; no direct conversion to fuel cost or emissions.'],
].map(([key, zh, en, min, max, step, group, helpZh, helpEn]) => ({ key, zh, en, min, max, step: key === 'hour' ? 1 : .01, group, helpZh, helpEn }));

export const presets = {
  low: { driver_behavior_score: .2, traffic_congestion_level: 1, port_congestion_level: 1, hour: 6, eta_variation_hours: .1, delay_probability: .1, disruption_likelihood_score: .1, historical_demand: 400, warehouse_inventory_level: 800, order_fulfillment_status: .9, loading_unloading_time: 1.5, customs_clearance_time: 2, fatigue_monitoring_score: .9, fuel_consumption_rate: 8 },
  moderate: { driver_behavior_score: .2, traffic_congestion_level: 1, port_congestion_level: 1, hour: 18, eta_variation_hours: .5, delay_probability: .2, disruption_likelihood_score: .2, historical_demand: 500, warehouse_inventory_level: 900, order_fulfillment_status: .3, loading_unloading_time: 1, customs_clearance_time: 2, fatigue_monitoring_score: .2, fuel_consumption_rate: 5 },
  high: { driver_behavior_score: .9, traffic_congestion_level: 9, port_congestion_level: 9, hour: 20, eta_variation_hours: 2.5, delay_probability: .8, disruption_likelihood_score: .9, historical_demand: 8000, warehouse_inventory_level: 200, order_fulfillment_status: .3, loading_unloading_time: 4.5, customs_clearance_time: 9, fatigue_monitoring_score: .2, fuel_consumption_rate: 18 },
};
export const labels = { zh: ['低风险', '中风险', '高风险'], en: ['Low risk', 'Moderate risk', 'High risk'] };
export const featureInfo = [
  ['fuel_efficiency_index', '燃油效率指数', 'Fuel efficiency index', 'fuel / (1 + exp(driver))', '原公式指数，不是实际燃油效率。', 'An engineered index, not measured fuel efficiency.'],
  ['congestion_stress', '拥堵压力', 'Congestion stress', '(road² + port²) / (1 + hour + 10⁻⁶)', '同时考虑道路与港口；小时分母存在业务局限。', 'Road and port signals combined; the hour divisor has business limitations.'],
  ['logistics_resilience', '物流韧性', 'Logistics resilience', 'exp(−(ETA² + delay + disruption))', '越接近 1，原公式中的稳定性越高。', 'Closer to 1 means more stability in the original formula.'],
  ['inventory_pressure', '库存压力', 'Inventory pressure', 'ln(1 + (demand + 1) / (stock + 1))', '供需口径一致时才有意义。', 'Meaningful only for comparable demand and stock units.'],
  ['loading_saturation', '装卸饱和指标', 'Loading saturation', 'tanh(fulfillment / (loading + 0.1))', '原始编码和时间共同构成的指数。', 'An index combining the original status encoding and handling time.'],
  ['clearance_friction', '清关摩擦', 'Clearance friction', '√(customs × (1 + port))', '港口拥堵会放大清关等待信号。', 'Port congestion amplifies the customs-wait signal.'],
  ['human_performance_risk', '人员表现风险', 'Human performance risk', 'driver × exp(1 − fatigue)', '方向沿用原公式，需要核实字段语义。', 'Direction follows the original formula; validate the field semantics.'],
];

export function validate(v) {
  for (const c of config) {
    if (typeof v[c.key] !== 'number' || !Number.isFinite(v[c.key]) || v[c.key] < c.min || v[c.key] > c.max || (c.key === 'hour' && !Number.isInteger(v[c.key]))) throw new Error(`Invalid ${c.key}`);
  }
  return v;
}
export function features(v) {
  validate(v);
  return [
    v.fuel_consumption_rate / (1 + Math.exp(v.driver_behavior_score)),
    (v.traffic_congestion_level ** 2 + v.port_congestion_level ** 2) / (1 + v.hour + 1e-6),
    Math.exp(-(v.eta_variation_hours ** 2 + v.delay_probability + v.disruption_likelihood_score)),
    Math.log1p((v.historical_demand + 1) / (v.warehouse_inventory_level + 1)),
    Math.tanh(v.order_fulfillment_status / (v.loading_unloading_time + .1)),
    Math.sqrt(v.customs_clearance_time * (1 + v.port_congestion_level)),
    v.driver_behavior_score * Math.exp(1 - v.fatigue_monitoring_score),
  ];
}
export function decodeModel(buffer, meta) {
  if (meta.format !== 'xgb-numeric-le16-v1' || buffer.byteLength !== meta.byteLength || buffer.byteLength !== meta.nodeCount * 16 || meta.features.length !== 7 || meta.baseMargin.length !== 3 || !meta.roots.length) throw new Error('Invalid model artifact');
  return { meta, ints: new Int32Array(buffer), floats: new Float32Array(buffer), bytes: new Uint8Array(buffer) };
}
export function predict(v, model) {
  if (!model) throw new Error('Model unavailable');
  const f = features(v), { meta, ints, floats, bytes } = model;
  const x = f.map((value, i) => Math.fround(value * meta.scale[i] + meta.min[i]));
  const margins = meta.baseMargin.map(Math.fround);
  for (const [root, classId] of meta.roots) {
    let n = root;
    while (ints[n * 4] !== -1) {
      const value = x[bytes[n * 16 + 12]];
      const left = Number.isNaN(value) ? bytes[n * 16 + 13] : value < floats[n * 4 + 2];
      n = root + ints[n * 4 + (left ? 0 : 1)];
    }
    margins[classId] = Math.fround(margins[classId] + floats[n * 4 + 2]);
  }
  const max = Math.max(...margins), exp = margins.map(v => Math.exp(v - max)), total = exp.reduce((a, b) => a + b, 0);
  const probabilities = exp.map(v => v / total);
  return { label: probabilities.indexOf(Math.max(...probabilities)), probabilities, features: f, outOfRange: meta.features.filter((_, i) => f[i] < meta.dataMin[i] || f[i] > meta.dataMax[i]) };
}

export async function loadModel() {
  const [metadataResponse, binaryResponse] = await Promise.all([fetch('./model/metadata.json'), fetch('./model/model.bin.gz')]);
  if (!metadataResponse.ok || !binaryResponse.ok) throw new Error('Model download failed');
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser does not support model decompression');
  const meta = await metadataResponse.json();
  const stream = binaryResponse.body.pipeThrough(new DecompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    if (hash !== meta.binarySha256) throw new Error('Model integrity check failed');
  }
  return decodeModel(buffer, meta);
}
