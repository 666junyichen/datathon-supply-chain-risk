import { config, validate, labels, featureInfo, features } from './domain.mjs';

const playbooks = [
  { id: 'route', code: '01', zh: '重排路线与港口', en: 'Replan route & gateway', ownerZh: '运输调度 / 承运商', ownerEn: 'Transport planner / carrier',
    trigger: v => Math.max(v.traffic_congestion_level, v.port_congestion_level) >= 6,
    signalZh: v => `道路 ${v.traffic_congestion_level.toFixed(1)} / 港口 ${v.port_congestion_level.toFixed(1)}`,
    signalEn: v => `Road ${v.traffic_congestion_level.toFixed(1)} / port ${v.port_congestion_level.toFixed(1)}`,
    textZh: '查询替代路线、预约错峰提货；港口拥堵高时评估替代口岸，并核实船期、截关时间与末端运力。',
    textEn: 'Check alternate routes and off-peak pickup slots. For a congested port, assess another gateway against sailing schedules, cutoff times and last-mile capacity.',
    tradeZh: '绕行可能增加里程、过路费和运输时间；改港可能增加陆运距离。先取得报价与可用时段。',
    tradeEn: 'Detours can add distance, tolls and time; a gateway change may extend inland transport. Confirm quotes and available slots first.',
    assumptionZh: '仅假设道路和港口拥堵指数各下降 2，最低为 0；不自动下调延误概率。',
    assumptionEn: 'Assumes road and port indices each fall by 2, floored at 0. Does not automatically lower delay probability.',
    change: v => ({ traffic_congestion_level: Math.max(0, v.traffic_congestion_level - 2), port_congestion_level: Math.max(0, v.port_congestion_level - 2) }),
    kpiZh: '运输准时率 / 单票运输成本', kpiEn: 'On-time transport / cost per shipment' },
  { id: 'customs', code: '02', zh: '提前准备清关', en: 'Prepare customs earlier', ownerZh: '报关团队 / 货代', ownerEn: 'Customs team / forwarder',
    trigger: v => v.customs_clearance_time >= 5 || v.port_congestion_level >= 6,
    signalZh: v => `清关 ${v.customs_clearance_time.toFixed(1)} 小时`, signalEn: v => `${v.customs_clearance_time.toFixed(1)} h customs`,
    textZh: '提前核对商业发票、装箱单、商品编码和原产地资料；协调预申报及预约查验，减少文件返工。',
    textEn: 'Validate invoice, packing list, tariff codes and origin documentation early. Coordinate pre-lodgement and inspections to reduce document rework.',
    tradeZh: '增加准备与代理成本；海关查验、监管要求及港口等待仍可能存在。',
    tradeEn: 'Adds preparation and brokerage effort. Inspections, regulatory requirements and port queues can still cause delays.',
    assumptionZh: '仅假设清关时间减少 2 小时，最低为原 GUI 下限 1 小时。',
    assumptionEn: 'Assumes customs time falls by 2 h, floored at the original GUI minimum of 1 h.',
    change: v => ({ customs_clearance_time: Math.max(1, v.customs_clearance_time - 2) }),
    kpiZh: '清关周期 / 文件一次通过率', kpiEn: 'Clearance cycle / first-pass document rate' },
  { id: 'inventory', code: '03', zh: '调拨库存与订单分配', en: 'Rebalance stock & orders', ownerZh: '库存计划 / 销售运营', ownerEn: 'Inventory planner / sales operations',
    trigger: v => v.historical_demand > v.warehouse_inventory_level,
    signalZh: v => `需求 ${v.historical_demand.toLocaleString()} / 库存 ${v.warehouse_inventory_level.toLocaleString()}`,
    signalEn: v => `Demand ${v.historical_demand.toLocaleString()} / stock ${v.warehouse_inventory_level.toLocaleString()}`,
    textZh: '按交付承诺与订单价值分配有限库存，查询其他仓库的可调拨量；对持续缺口评估补货与分批交付。',
    textEn: 'Allocate scarce stock by delivery commitment and order value. Check transferable stock at other warehouses; assess replenishment and split deliveries for persistent gaps.',
    tradeZh: '调拨增加运费与资金占用；不宜无限加库存。需求周期未知，不能据此计算安全库存或库存天数。',
    tradeEn: 'Transfers add freight and working capital. Do not add stock indefinitely. Unknown demand periods prevent defensible safety-stock or cover-day calculations.',
    assumptionZh: '假设调入 200 个同口径单位，库存最高为原 GUI 上限 1,000；需求保持原值。',
    assumptionEn: 'Assumes 200 comparable units are transferred, capped at the original GUI maximum of 1,000. Demand is unchanged.',
    change: v => ({ warehouse_inventory_level: Math.min(1000, v.warehouse_inventory_level + 200) }),
    kpiZh: '缺货订单 / 持有成本 / 调拨时效', kpiEn: 'Unfilled orders / holding cost / transfer time' },
  { id: 'people', code: '04', zh: '核实疲劳与驾驶状态', en: 'Verify fatigue & driver status', ownerZh: '车队主管 / 安全团队', ownerEn: 'Fleet supervisor / safety team',
    trigger: v => v.fatigue_monitoring_score <= .35 || v.driver_behavior_score >= .65,
    signalZh: v => `驾驶 ${v.driver_behavior_score.toFixed(2)} / 疲劳 ${v.fatigue_monitoring_score.toFixed(2)}`,
    signalEn: v => `Behavior ${v.driver_behavior_score.toFixed(2)} / fatigue ${v.fatigue_monitoring_score.toFixed(2)}`,
    textZh: '先核实监测分数方向与实际驾驶状态；出现疲劳或不安全行为时安排休息、换班与复核，安全措施优先。',
    textEn: 'First verify score direction and actual driver condition. Where fatigue or unsafe behavior is observed, arrange rest, a relief driver and review; safety comes first.',
    tradeZh: '换班增加人工与等待成本；不能仅凭模型或未经解释的分数判断驾驶适任性。',
    tradeEn: 'Relief shifts add labor and waiting costs. A model or an unexplained score cannot establish fitness to drive.',
    assumptionZh: '按原公式方向模拟驾驶分数下降 0.2、疲劳监测分数上升 0.2；仅作为情景目标。',
    assumptionEn: 'Using the original formula direction, assumes behavior score falls by 0.2 and fatigue score rises by 0.2; scenario targets only.',
    change: v => ({ driver_behavior_score: Math.max(0, v.driver_behavior_score - .2), fatigue_monitoring_score: Math.min(1, v.fatigue_monitoring_score + .2) }),
    kpiZh: '安全事件 / 休息合规 / 人工成本', kpiEn: 'Safety incidents / rest compliance / labor cost' },
  { id: 'loading', code: '05', zh: '协调月台与装卸排班', en: 'Coordinate docks & handling', ownerZh: '仓库主管 / 现场运营', ownerEn: 'Warehouse manager / site operations',
    trigger: v => v.loading_unloading_time >= 3 || v.order_fulfillment_status < .5,
    signalZh: v => `装卸 ${v.loading_unloading_time.toFixed(1)} 小时 / 履约编码 ${v.order_fulfillment_status.toFixed(2)}`,
    signalEn: v => `${v.loading_unloading_time.toFixed(1)} h handling / status ${v.order_fulfillment_status.toFixed(2)}`,
    textZh: '同步车辆到达与月台预约，提前拣货、配置装卸班组；核实低履约编码代表的具体异常后分配处理责任。',
    textEn: 'Align truck arrival with dock bookings, pre-pick goods and staff handling teams. Validate what a low status code represents before assigning exception ownership.',
    tradeZh: '可能需要加班或额外设备；减少装卸时间的目标应基于现场瓶颈，不牺牲安全。',
    tradeEn: 'May require overtime or equipment. Time targets should address actual bottlenecks without compromising safety.',
    assumptionZh: '仅假设装卸时间减少 1 小时，最低 0.1 小时；不自动提高履约状态。',
    assumptionEn: 'Assumes handling time falls by 1 h, floored at 0.1 h. Does not automatically improve the status code.',
    change: v => ({ loading_unloading_time: Math.max(.1, v.loading_unloading_time - 1) }),
    kpiZh: '月台周转 / 等候时间 / 人均处理量', kpiEn: 'Dock turnover / queue time / throughput per worker' },
  { id: 'fuel', code: '06', zh: '检查怠速与车辆效率', en: 'Review idling & vehicle efficiency', ownerZh: '车队运维 / 运输采购', ownerEn: 'Fleet maintenance / transport procurement',
    trigger: v => v.fuel_consumption_rate >= 14,
    signalZh: v => `油耗指标 ${v.fuel_consumption_rate.toFixed(1)}`, signalEn: v => `Fuel metric ${v.fuel_consumption_rate.toFixed(1)}`,
    textZh: '核实油耗单位及车辆类型；检查怠速、车辆保养与装载配置，结合路线成本选择可执行的改善措施。',
    textEn: 'Verify fuel units and vehicle type. Check idling, maintenance and loading configuration, then select feasible improvements against route cost.',
    tradeZh: '维护可能增加停运时间；原燃油指数与驾驶分数存在数学联动，不能把指数下降等同于真实节油。',
    tradeEn: 'Maintenance may add downtime. The original fuel index depends mathematically on behavior score; a lower index is not proof of fuel savings.',
    assumptionZh: '仅假设油耗指标下降 2，最低 1；不计算未经验证的碳减排。',
    assumptionEn: 'Assumes the fuel metric falls by 2, floored at 1. No unverified emissions savings are calculated.',
    change: v => ({ fuel_consumption_rate: Math.max(1, v.fuel_consumption_rate - 2) }),
    kpiZh: '已核实油耗 / 停运时间 / 维护成本', kpiEn: 'Verified fuel use / downtime / maintenance cost' },
];

export function inventoryMetrics(v) {
  validate(v);
  return { ratio: v.historical_demand === 0 ? null : v.warehouse_inventory_level / v.historical_demand, gap: Math.max(0, v.historical_demand - v.warehouse_inventory_level) };
}
export function recommendations(v) {
  validate(v);
  return playbooks.map(p => ({ ...p, active: p.trigger(v) })).sort((a, b) => Number(b.active) - Number(a.active));
}
export function applyAction(v, id) {
  validate(v);
  const p = playbooks.find(x => x.id === id);
  if (!p) throw new Error('Unknown action');
  const changes = p.change(v);
  for (const k of Object.keys(changes)) changes[k] = Math.round(changes[k] * 100) / 100;
  return validate({ ...v, ...changes });
}
export const defaultAssumptions = { shipmentValue: 100000, marginPct: 20, penalty: 4000, hours: 3, hourlyCost: 200, actionCost: 500, stockoutProbability: .25 };
export function costAnalysis(a) {
  for (const key of Object.keys(defaultAssumptions)) {
    if (!Number.isFinite(a[key]) || a[key] < 0) throw new Error(`Invalid commercial assumption: ${key}`);
  }
  if (a.marginPct > 100 || a.stockoutProbability > 1) throw new Error('Invalid percentage');
  // Conditional loss if a disruption occurs; independent commercial assumptions.
  const disruptionLoss = a.penalty + a.hours * a.hourlyCost + a.shipmentValue * a.marginPct / 100 * a.stockoutProbability;
  return { disruptionLoss, breakEvenReduction: disruptionLoss > 0 ? a.actionCost / disruptionLoss : null };
}
export function report({ lang, values, result, baseline, assumptions }) {
  const zh = lang === 'zh', costs = costAnalysis(assumptions);
  const rows = config.map(c => `| ${c.key} | ${values[c.key]} |`).join('\n');
  const metrics = features(values).map((v, i) => `| ${featureInfo[i][0]} | ${v.toPrecision(8)} |`).join('\n');
  const advice = recommendations(values).filter(p => p.active).map(p => `### ${zh ? p.zh : p.en}\n${zh ? p.textZh : p.textEn}\n\n${zh ? '责任人' : 'Owner'}: ${zh ? p.ownerZh : p.ownerEn}\n\n${zh ? '代价与条件' : 'Trade-off'}: ${zh ? p.tradeZh : p.tradeEn}\n\n${zh ? '模拟假设' : 'Simulation assumption'}: ${zh ? p.assumptionZh : p.assumptionEn}`).join('\n\n');
  const probabilities = result ? result.probabilities.map((p, i) => `${labels[lang][i]}: ${(p * 100).toFixed(1)}%`).join(' / ') : (zh ? '模型不可用；未生成预测。' : 'Model unavailable; no prediction generated.');
  const compare = baseline ? `${labels[lang][baseline.result.label]} → ${result ? labels[lang][result.label] : '—'}\n\n${config.filter(c => baseline.values[c.key] !== values[c.key]).map(c => `- ${c.key}: ${baseline.values[c.key]} → ${values[c.key]}`).join('\n') || (zh ? '参数未变化。' : 'No input changes.')}` : (zh ? '未保存基准。' : 'No baseline saved.');
  return `# ${zh ? '物流风险情景报告' : 'Supply-chain risk scenario report'}\n\n${new Date().toISOString()}\n\n${zh ? '基于合成数据的 Datathon 原模型演示；建议来自独立规则，预测不是因果结论，也不是实际事故概率。' : 'Datathon demo using the original model trained on synthetic data. Advice is rule-based; predictions are not causal effects or real-world incident probabilities.'}\n\n## ${zh ? '模型结果' : 'Model output'}\n${probabilities}\n\n## ${zh ? '基准对比' : 'Baseline comparison'}\n${compare}\n\n## ${zh ? '原始参数' : 'Raw inputs'}\n| Parameter | Value |\n|---|---:|\n${rows}\n\n## ${zh ? '衍生特征' : 'Engineered features'}\n| Feature | Value |\n|---|---:|\n${metrics}\n\n## ${zh ? '优先评估的物流措施' : 'Operational actions to assess'}\n${advice || (zh ? '当前未触发优先规则，保持常规监控。' : 'No priority rules triggered; maintain routine monitoring.')}\n\n## ${zh ? '商业假设（示例 CNY，可修改）' : 'Commercial assumptions (illustrative CNY, editable)'}\n${Object.entries(assumptions).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n${zh ? '单次中断条件损失' : 'Conditional disruption loss'}: ${costs.disruptionLoss.toFixed(2)} CNY\n\n${zh ? '公式：违约损失 + 延误小时 × 每小时成本 + 货值 × 毛利率 × 中断时缺货损失发生比例。' : 'Formula: penalty + delay hours × hourly cost + shipment value × margin × conditional stockout-loss fraction.'}\n\n${zh ? '盈亏平衡所需真实中断概率降幅' : 'Break-even required reduction in actual disruption probability'}: ${costs.breakEvenReduction === null ? 'N/A' : (costs.breakEvenReduction * 100).toFixed(2) + (zh ? ' 个百分点' : ' percentage points')}\n\n${zh ? '该概率降幅需要现实数据验证；模型的高风险类别概率不能代入 ROI。安全措施不应仅以 ROI 判断。需求周期、油耗单位及部分分数方向未明确，不能推导库存天数或碳排放。' : 'This reduction requires real operational evidence; high-risk class probability cannot substitute for actual event probability in ROI. Safety actions should not be decided solely by ROI. Unspecified demand periods, fuel units and score directions prevent defensible cover-day or emissions estimates.'}\n\nSource: https://github.com/666junyichen/datathon-supply-chain-risk\n`;
}
