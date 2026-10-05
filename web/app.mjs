import { config, presets, labels, featureInfo, features, predict, loadModel } from './domain.mjs';
import { recommendations, applyAction, inventoryMetrics, costAnalysis, defaultAssumptions, report } from './advice.mjs';

const $ = id => document.getElementById(id);
const colors = ['#53e4b0', '#f3c66b', '#ff847d'];
let lang = 'zh', values = { ...presets.high }, model = null, result = null, baseline = null;
let selectedPreset = 'high', loading = true, error = false, assumptions = { ...defaultAssumptions };
let reportUrl = null;
const invalidInputs = new Set(), invalidCosts = new Set(), actionHistory = [];
const copy = {
  zh: {
    reportTitle: '情景报告预览', closeReport: '关闭 ✕', reportNote: '点击下载保存 Markdown 文件，或选中以下文本复制。', downloadReport: '下载 Markdown 报告 ↓',
    navSimulator: '情景模拟', navActions: '物流建议', navBusiness: '商业分析', navMethod: '模型说明',
    heroTitle: '看见风险。<br><span>让物流决策更进一步。</span>', heroText: '从预测一个风险等级，到理解每一次操作的业务取舍。调整运输、库存与人员参数，探索更稳健的供应链情景。',
    synthetic: '合成数据研究演示', private: '浏览器本地预测', diagram: '示意流程 · 非实时追踪', inputsCount: '物流输入', featuresCount: '衍生特征', treesCount: '模型决策树', loading: '正在加载原模型 · 约 9.9 MB',
    simTitle: '每一个参数，都是一个决策起点。', export: '↓ 导出情景报告', shipmentInputs: '物流情景输入', reset: '重置', presetNote: '沿用原 GUI 预设；名称不保证模型输出等级。', presetLow: '低风险预设', presetModerate: '中风险预设', presetHigh: '高风险预设', auto: '调节后自动计算 · 所有输入保留在浏览器',
    modelOutput: '原模型预测', currentRisk: '当前预测类别', probabilityLabel: '模型类别概率', probabilityNote: '未经业务校准，不等于实际延误或事故概率。', inventoryRatio: '库存 / 历史需求', ratioNote: '同口径比例，非库存天数', resilience: '物流韧性指数', resilienceNote: '原公式：越接近 1 越稳定', priorityActions: '待评估优先措施', priorityNote: '独立运营规则，非特征重要性', comparison: '基准与当前情景', restore: '恢复基准', saveBaseline: '保存当前为基准', comparisonEmpty: '先保存一个基准，再调整参数或模拟措施，查看前后变化。', causality: '情景变化展示模型响应，不能证明某项措施造成真实风险下降。', nextStep: '把预测变成行动清单', viewActions: '查看对应物流建议 ↓',
    actionsTitle: '不止知道风险，更知道下一步。', actionsIntro: '建议随输入变化，优先展示触发的运营信号。每项模拟只修改列出的目标参数，实际可行性由运营团队核实。', rulesTag: '透明规则 · 可解释建议', businessTitle: '风险下降，还要算清业务账。', businessIntro: '用可修改的成本假设评估措施门槛。以下全部是示例 CNY 金额，不是比赛已实现的收益。', costInputs: '商业假设', editable: '示例 · 可修改', costInputsNote: '缺货损失发生比例是“中断发生时”的条件假设，不是模型输出。确保违约损失、等待成本和损失毛利没有重复计算。', conditionalLoss: '假设中断发生时', lossLabel: '单次中断条件损失', lossFormula: '违约损失 + 延误小时 × 每小时成本<br>+ 货值 × 毛利率 × 条件缺货比例', breakEvenLabel: '措施盈亏平衡所需真实中断概率降幅', businessBoundary: '原模型的高风险类别概率不能代入 ROI。只有真实运营数据验证了概率降幅，才能判断措施是否经济可行；安全措施仍应优先满足安全要求。',
    methodTitle: '让结果可追溯，让边界说清楚。', methodIntro: '保留原特征公式、MinMaxScaler 和 XGBoost 树结构；未重新训练，也没有使用规则伪装模型预测。', source: '项目源码 ↗', limitsTitle: '使用边界', evidenceTitle: '物流建议的参考依据', sourcesNote: '参考一般运营原则；页面阈值与模拟目标为演示规则，未经过业务验证。地区监管要求需另行核实。', wco: '预先提交资料与货物放行', fmcsa: '疲劳识别与休息原则（美国）', ascm: '供应链韧性与库存缓冲', footer: 'Datathon 研究 → 交互决策展示 · Junyi Chen', backTop: '回到顶部 ↑',
  },
  en: {
    reportTitle: 'Scenario report preview', closeReport: 'Close ✕', reportNote: 'Download the Markdown file, or select and copy the text below.', downloadReport: 'Download Markdown report ↓',
    navSimulator: 'Simulator', navActions: 'Operations', navBusiness: 'Business case', navMethod: 'Method',
    heroTitle: 'See the risk.<br><span>Make the next move count.</span>', heroText: 'Go beyond a risk label. Adjust transport, inventory and human factors to explore supply-chain scenarios—and the business trade-offs behind every action.',
    synthetic: 'Synthetic-data research demo', private: 'Predictions run locally', diagram: 'Illustrative flow · not live tracking', inputsCount: 'logistics inputs', featuresCount: 'engineered features', treesCount: 'decision trees', loading: 'Loading original model · ~9.9 MB', simTitle: 'Every input is a starting point.', export: '↓ Export scenario report', shipmentInputs: 'Shipment inputs', reset: 'Reset', presetNote: 'Original GUI presets; names do not guarantee model output.', presetLow: 'Low preset', presetModerate: 'Moderate preset', presetHigh: 'High preset', auto: 'Automatically recalculates · inputs stay in your browser',
    modelOutput: 'Original model prediction', currentRisk: 'Predicted class', probabilityLabel: 'Model class probabilities', probabilityNote: 'Uncalibrated; not actual delay or incident probabilities.', inventoryRatio: 'Stock / historical demand', ratioNote: 'Comparable-unit ratio, not cover days', resilience: 'Logistics resilience index', resilienceNote: 'Original formula: closer to 1 is more stable', priorityActions: 'Priority actions to assess', priorityNote: 'Operational rules, not feature importance', comparison: 'Baseline vs current scenario', restore: 'Restore baseline', saveBaseline: 'Save current as baseline', comparisonEmpty: 'Save a baseline, then change inputs or simulate an action to see the difference.', causality: 'Scenario changes show model responses, not causal evidence of real risk reduction.', nextStep: 'Turn predictions into an action list', viewActions: 'Explore operational advice ↓',
    actionsTitle: 'Understand the risk. Explore the response.', actionsIntro: 'Advice follows your inputs, with triggered operational signals first. Each simulation changes only its listed targets; operators must validate feasibility.', rulesTag: 'Transparent rules · explained advice', businessTitle: 'A lower risk needs a sound business case.', businessIntro: 'Use editable assumptions to assess the intervention threshold. All amounts below are illustrative CNY, not realized competition savings.', costInputs: 'Commercial assumptions', editable: 'Illustrative · editable', costInputsNote: 'The stockout-loss fraction is conditional on disruption, not a model output. Avoid double-counting penalties, waiting costs and lost margin.', conditionalLoss: 'ASSUMING A DISRUPTION OCCURS', lossLabel: 'Conditional loss per disruption', lossFormula: 'Penalty + delay hours × hourly cost<br>+ shipment value × margin × conditional stockout fraction', breakEvenLabel: 'Actual disruption probability reduction needed to break even', businessBoundary: 'High-risk class probability cannot substitute for actual event probability in ROI. Validate reductions with real operational data before judging economics. Safety requirements still take priority.',
    methodTitle: 'Trace the result. Understand the limits.', methodIntro: 'Original feature formulas, MinMaxScaler and XGBoost trees are preserved. No retraining and no rules disguised as model predictions.', source: 'Project source ↗', limitsTitle: 'Use boundaries', evidenceTitle: 'References behind the advice', sourcesNote: 'General operational principles only. Thresholds and simulation targets are unvalidated demo rules. Check applicable local regulations separately.', wco: 'Pre-arrival documentation & release', fmcsa: 'Fatigue awareness & rest (United States)', ascm: 'Resilience & inventory buffers', footer: 'Datathon research → interactive decisions · Junyi Chen', backTop: 'Back to top ↑',
  },
};
const t = (zh, en) => lang === 'zh' ? zh : en;
const percent = p => `${(p * 100).toFixed(1)}%`;
const number = n => n.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 });

function translate() {
  const pendingInputs = [...invalidInputs].map(key => [key, $(`number-${key}`).value]);
  const pendingCosts = [...invalidCosts].map(key => [key, $(`cost-${key}`).value]);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('Supply Chain Risk Lab · 物流风险决策台', 'Supply Chain Risk Lab · Scenario decisions');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = copy[lang][el.dataset.i18n]; });
  $('language').textContent = lang === 'zh' ? 'EN ↗' : '中文 ↗';
  $('language').setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
  renderInputs(); renderCostInputs();
  for (const [key, raw] of pendingInputs) { invalidInputs.add(key); $(`number-${key}`).value = raw; $(`number-${key}`).setAttribute('aria-invalid', 'true'); }
  for (const [key, raw] of pendingCosts) { invalidCosts.add(key); $(`cost-${key}`).value = raw; $(`cost-${key}`).setAttribute('aria-invalid', 'true'); }
  renderResults(); renderCosts(); renderLimits(); renderModelStatus();
}

function renderInputs() {
  const oldOpen = [...$('inputs').querySelectorAll('details[open]')].map(d => d.dataset.group);
  const initial = !$('inputs').children.length;
  const groups = [['transport', '01 / 运输与清关', '01 / Transport & customs'], ['inventory', '02 / 库存与履约', '02 / Inventory & fulfillment'], ['people', '03 / 人员与燃油', '03 / People & fuel']];
  $('inputs').innerHTML = groups.map(([group, zh, en]) => `<details class="input-group" data-group="${group}" ${initial || oldOpen.includes(group) ? 'open' : ''}><summary>${t(zh, en)}</summary><div>${config.filter(c => c.group === group).map(c => `<div class="field"><div class="field-head"><label for="slider-${c.key}">${c[lang]}<span class="field-help" tabindex="0" title="${lang === 'zh' ? c.helpZh : c.helpEn}" aria-label="${lang === 'zh' ? c.helpZh : c.helpEn}">?</span></label><input class="field-number" id="number-${c.key}" type="number" min="${c.min}" max="${c.max}" step="${c.key === 'hour' ? 1 : .01}" value="${values[c.key]}" data-number="${c.key}" aria-label="${c[lang]} ${t('数值', 'value')}"></div><input type="range" id="slider-${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${values[c.key]}" data-slider="${c.key}" style="--position:${(values[c.key] - c.min) / (c.max - c.min) * 100}%"><div class="field-limits"><span>${c.min}</span><span>${c.max}</span></div></div>`).join('')}</div></details>`).join('');
  document.querySelectorAll('[data-preset]').forEach(b => { b.classList.toggle('selected', b.dataset.preset === selectedPreset); b.setAttribute('aria-pressed', String(b.dataset.preset === selectedPreset)); });
  invalidInputs.clear();
}

function renderModelStatus() {
  const el = $('model-status');
  el.className = `model-status ${loading ? 'loading' : error ? 'failed' : ''}`;
  el.innerHTML = `<i class="dot"></i><span>${loading ? copy[lang].loading : error ? t('模型加载失败 · 可重试', 'Model unavailable · retry below') : t('原模型已就绪 · 本地推理', 'Original model ready · local inference')}</span>`;
}

function renderResults() {
  const f = features(values), inventory = inventoryMetrics(values), advice = recommendations(values);
  result = model && !invalidInputs.size ? predict(values, model) : null;
  $('risk-label').textContent = result ? labels[lang][result.label] : t('待计算', 'Pending');
  $('risk-support').textContent = result ? `${percent(result.probabilities[result.label])} ${t('类别支持度', 'class support')}` : '—';
  $('risk-ring').style.setProperty('--risk-color', result ? colors[result.label] : '#94a7b8');
  const p = result?.probabilities || [0, 0, 0];
  $('risk-ring').style.background = result ? `conic-gradient(${colors[0]} 0 ${p[0] * 360}deg,${colors[1]} ${p[0] * 360}deg ${(p[0] + p[1]) * 360}deg,${colors[2]} ${(p[0] + p[1]) * 360}deg 360deg)` : '#25394b';
  $('probability-bars').innerHTML = labels[lang].map((label, i) => `<div class="prob-row"><div class="prob-label"><span>${label}</span><b>${result ? percent(p[i]) : '—'}</b></div><div class="prob-track"><div class="prob-fill" style="width:${p[i] * 100}%;background:${colors[i]}"></div></div></div>`).join('');
  $('prediction-message').innerHTML = invalidInputs.size ? t('输入无效，请修正红框数值后继续。', 'Invalid input. Correct the highlighted values to continue.') : error ? `${t('原模型无法加载，未生成预测。建议仍可查看。', 'Original model unavailable; no prediction generated. Operational advice remains accessible.')} <button class="text-button" id="retry">${t('重新加载', 'Retry')}</button>` : loading ? t('首次下载约 9.9 MB；加载完成后，参数调整无需再次下载模型。', 'Initial download is ~9.9 MB. Later input changes do not download the model again.') : selectedPreset === 'moderate' ? t('提示：原“中风险预设”在当前保存模型中预测为低风险；页面显示真实模型输出。', 'Note: the original moderate preset predicts low risk with the saved model. The real output is shown.') : t('采用原 XGBoost + scaler；运营建议由单独规则生成。', 'Original XGBoost + scaler; operational advice comes from separate rules.');
  $('range-warning').hidden = !result?.outOfRange?.length;
  $('range-warning').textContent = result?.outOfRange?.length ? `${t('以下特征超出 scaler 训练范围，属于外推情景，结果需谨慎解读：', 'These features exceed the scaler training range; this is extrapolation: ')}${result.outOfRange.map(key => featureInfo.find(c => c[0] === key)[lang === 'zh' ? 1 : 2]).join(' / ')}` : '';
  $('inventory-ratio').textContent = inventory.ratio === null ? t('无需求', 'No demand') : percent(inventory.ratio);
  $('resilience').textContent = f[2] > 0 && f[2] < .001 ? f[2].toExponential(2) : f[2].toFixed(3);
  $('priority-count').textContent = `${advice.filter(a => a.active).length} / 6`;
  const active = advice.filter(a => a.active);
  $('decision-text').textContent = active.length ? `${t('当前优先评估：', 'Prioritize assessing: ')}${active.slice(0, 3).map(a => a[lang]).join(' · ')}${t('。查看措施的负责人、代价与模拟假设。', '. Review owners, trade-offs and simulation assumptions.')}` : t('当前未触发优先规则。保持常规监控，核实数据口径，并按客户承诺评估异常。', 'No priority rules triggered. Maintain monitoring, validate data definitions and assess exceptions against customer commitments.');
  $('download').disabled = !result || !!invalidCosts.size;
  $('save-baseline').disabled = !result;
  $('restore').disabled = !baseline;
  renderComparison(); renderActions(advice); renderFeatures(f);
}

function renderComparison() {
  if (!baseline) {
    $('comparison-content').innerHTML = `<div class="comparison-empty"><span class="compare-icon">⇄</span><p>${copy[lang].comparisonEmpty}</p></div>`;
    return;
  }
  const delta = result ? (result.probabilities[2] - baseline.result.probabilities[2]) * 100 : null;
  const changed = config.filter(c => values[c.key] !== baseline.values[c.key]);
  $('comparison-content').innerHTML = `<div class="compare-summary"><div><small>${t('已保存基准', 'Saved baseline')}</small><strong style="color:${colors[baseline.result.label]}">${labels[lang][baseline.result.label]}</strong><span class="mono">${t('高风险类别', 'High-risk class')} ${percent(baseline.result.probabilities[2])}</span></div><span class="compare-arrow">→</span><div><small>${t('当前情景', 'Current scenario')}</small><strong style="color:${result ? colors[result.label] : colors[0]}">${result ? labels[lang][result.label] : '—'}</strong><span class="mono">${t('高风险类别', 'High-risk class')} ${result ? percent(result.probabilities[2]) : '—'}</span></div></div><div class="delta">${t('高风险类别概率变化', 'High-risk class probability change')} <b>${delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${t('个百分点', 'pp')}`}</b></div>${delta > 0 && actionHistory.length ? `<p class="small" style="color:var(--amber)">${t('模型并非单调或因果模型：模拟改善后类别概率仍可能上升。请结合真实物流 KPI 核实措施效果。', 'This model is neither monotonic nor causal: an operational improvement can raise class probability. Validate effectiveness with real logistics KPIs.')}</p>` : ''}<div class="changed-inputs">${changed.length ? changed.map(c => `<span>${c[lang]} ${number(baseline.values[c.key])} → ${number(values[c.key])}</span>`).join('') : `<span>${t('参数未变化', 'No input changes')}</span>`}</div>`;
}

function renderActions(advice) {
  $('action-cards').innerHTML = advice.map(a => `<article class="panel action-card ${a.active ? 'active' : ''}"><div class="action-top"><span class="action-code">${a.code} / PLAYBOOK</span><span class="priority-tag">${a.active ? t('优先评估', 'Assess first') : t('常规关注', 'Monitor')}</span></div><h3>${a[lang]}</h3><div class="owner">${t(a.ownerZh, a.ownerEn)}</div><div class="signal-text">${lang === 'zh' ? a.signalZh(values) : a.signalEn(values)}</div><p class="action-description">${t(a.textZh, a.textEn)}</p><div class="tradeoff"><b>${t('代价与适用条件', 'Trade-offs & conditions')}</b>${t(a.tradeZh, a.tradeEn)}</div><div class="assumption">${t(a.assumptionZh, a.assumptionEn)}</div><div class="kpi">KPI / ${t(a.kpiZh, a.kpiEn)}</div><button class="button secondary" data-action="${a.id}" ${!result ? 'disabled' : ''}>${t('模拟这项措施', 'Simulate this action')} ↗</button></article>`).join('');
}
function renderFeatures(f) {
  $('feature-cards').innerHTML = featureInfo.map((c, i) => `<article class="feature-card"><div class="feature-title"><h3>${c[lang === 'zh' ? 1 : 2]}</h3><strong>${f[i] < .001 && f[i] !== 0 ? f[i].toExponential(2) : f[i].toFixed(3)}</strong></div><code>${c[0]}</code><code>${c[3]}</code><p>${c[lang === 'zh' ? 4 : 5]}</p></article>`).join('');
}
const commercialConfig = [
  ['shipmentValue', '单票货值 / CNY', 'Shipment value / CNY', 0, 100000000, 1000],
  ['marginPct', '毛利率 / %', 'Gross margin / %', 0, 100, 1],
  ['penalty', '单次违约损失 / CNY', 'Penalty per disruption / CNY', 0, 100000000, 100],
  ['hours', '中断时额外等待 / 小时', 'Extra wait if disrupted / h', 0, 10000, .1],
  ['hourlyCost', '额外等待成本 / CNY 每小时', 'Extra waiting cost / CNY per h', 0, 100000000, 10],
  ['actionCost', '措施执行成本 / CNY', 'Action cost / CNY', 0, 100000000, 100],
  ['stockoutProbability', '中断时缺货损失发生比例 / 0–1', 'Conditional stockout-loss fraction / 0–1', 0, 1, .01],
];
function renderCostInputs() {
  $('cost-inputs').innerHTML = commercialConfig.map(([key, zh, en, min, max, step]) => `<div class="cost-field"><label for="cost-${key}">${t(zh, en)}</label><input type="number" id="cost-${key}" data-cost="${key}" value="${assumptions[key]}" min="${min}" max="${max}" step="${step}"></div>`).join('');
  invalidCosts.clear();
}
function renderCosts() {
  $('download').disabled = !result || !!invalidCosts.size;
  if (invalidCosts.size) {
    $('disruption-loss').textContent = '—'; $('break-even').textContent = '—';
    $('cost-message').textContent = t('请修正红框中的成本假设；无效输入不会生成商业结论。', 'Correct the highlighted cost assumptions; invalid inputs produce no commercial conclusion.'); return;
  }
  const c = costAnalysis(assumptions);
  $('disruption-loss').textContent = number(c.disruptionLoss);
  $('break-even').textContent = c.breakEvenReduction === null ? 'N/A' : `${(c.breakEvenReduction * 100).toFixed(2)} ${t('百分点', 'pp')}`;
  $('cost-message').textContent = c.breakEvenReduction === null ? t('假设损失为 0，无法计算概率降幅门槛。', 'Assumed loss is zero; the probability-reduction threshold is undefined.') : c.breakEvenReduction > 1 ? t('所需降幅超过 100 个百分点：在这些假设下，单票成本无法仅靠避免中断收回。', 'Required reduction exceeds 100 pp: preventing disruption alone cannot recover this per-shipment action cost under these assumptions.') : t('门槛 = 措施成本 ÷ 单次中断条件损失。这是评估条件，不是已实现 ROI。', 'Threshold = action cost ÷ conditional disruption loss. This is a decision condition, not realized ROI.');
}
function renderLimits() {
  const list = lang === 'zh' ? [
    '训练数据为合成数据；本页面用于教学、作品展示和情景探索，未验证真实运营效果。',
    '预测类别概率未校准，不能解释为实际延误、事故概率或直接用于 ROI。',
    '原预设名称不保证输出类别：当前保存模型的“中风险预设”会预测低风险。',
    'ETA 平方对提前和延后对称；拥堵公式使用小时作分母，不能据此断言晚出发更安全。',
    '需求周期、燃油单位、履约状态编码及疲劳分数方向需要核实，不计算库存天数或碳减排。',
    '措施目标与触发阈值为透明演示假设；需检查预算、运力、监管及安全条件。',
    '超出 scaler 训练范围时保留原模型行为并提示外推，不静默截断数值。',
  ] : [
    'Training data is synthetic. This demo supports learning, portfolios and scenario exploration; real operational effectiveness is unvalidated.',
    'Uncalibrated class probabilities are not actual delay or incident probabilities and cannot directly drive ROI.',
    'Preset names do not guarantee output labels: the saved model predicts low risk for the original moderate preset.',
    'Squared ETA treats early and late arrival symmetrically; the hour divisor does not establish that later departure is safer.',
    'Demand period, fuel units, fulfillment encoding and fatigue-score direction need validation; no cover days or emissions savings are inferred.',
    'Action targets and trigger thresholds are transparent demo assumptions; assess budget, capacity, regulation and safety.',
    'Features outside the scaler training range are flagged as extrapolation; original model behavior is retained without silent clipping.',
  ];
  $('limitations').innerHTML = list.map(v => `<li>${v}</li>`).join('');
}

$('inputs').addEventListener('input', event => {
  const e = event.target, key = e.dataset.slider || e.dataset.number;
  if (!key) return;
  const c = config.find(c => c.key === key), v = e.value === '' ? NaN : Number(e.value);
  const valid = Number.isFinite(v) && v >= c.min && v <= c.max && (key !== 'hour' || Number.isInteger(v));
  e.setAttribute('aria-invalid', String(!valid));
  if (!valid) { invalidInputs.add(key); renderResults(); return; }
  invalidInputs.delete(key); values[key] = v; selectedPreset = null;
  const slider = $(`slider-${key}`), input = $(`number-${key}`);
  slider.value = v; input.value = v; input.setAttribute('aria-invalid', 'false');
  slider.style.setProperty('--position', `${(v - c.min) / (c.max - c.min) * 100}%`);
  document.querySelectorAll('[data-preset]').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
  renderResults();
});
$('presets').addEventListener('click', event => {
  const key = event.target.dataset.preset; if (!key) return;
  actionHistory.length = 0;
  values = { ...presets[key] }; selectedPreset = key; $('action-status').textContent = '';
  renderInputs(); renderResults();
});
$('reset').addEventListener('click', () => {
  values = { ...presets.high }; selectedPreset = 'high'; baseline = null; actionHistory.length = 0;
  $('action-status').textContent = ''; renderInputs(); renderResults();
});
$('save-baseline').addEventListener('click', () => {
  if (!result) return;
  baseline = { values: { ...values }, result: structuredClone(result) };
  actionHistory.length = 0; renderResults();
});
$('restore').addEventListener('click', () => {
  if (!baseline) return;
  values = { ...baseline.values }; selectedPreset = null; actionHistory.length = 0;
  $('action-status').textContent = ''; renderInputs(); renderResults();
});
$('action-cards').addEventListener('click', event => {
  const key = event.target.dataset.action; if (!key || !result) return;
  const a = recommendations(values).find(a => a.id === key), before = { ...values };
  if (!baseline) baseline = { values: { ...values }, result: structuredClone(result) };
  values = applyAction(values, key); selectedPreset = null;
  const changes = config.filter(c => before[c.key] !== values[c.key]);
  if (changes.length) actionHistory.push({ id: key, changes: changes.map(c => ({ key: c.key, before: before[c.key], after: values[c.key] })) });
  renderInputs(); renderResults();
  $('action-status').textContent = changes.length ? `${t('已模拟', 'Simulated')}: ${a[lang]} · ${changes.map(c => `${c[lang]} ${number(before[c.key])} → ${number(values[c.key])}`).join(' / ')}${t('。查看上方基准对比；目标值是情景假设。', '. See baseline comparison above; targets are scenario assumptions.')}` : t('该措施已达到当前参数范围的边界，没有继续修改参数。', 'This action has reached the input-range boundary; no further parameters changed.');
});
$('cost-inputs').addEventListener('input', event => {
  const key = event.target.dataset.cost; if (!key) return;
  const c = commercialConfig.find(c => c[0] === key), v = event.target.value === '' ? NaN : Number(event.target.value);
  const valid = Number.isFinite(v) && v >= c[3] && v <= c[4];
  event.target.setAttribute('aria-invalid', String(!valid));
  if (valid) { assumptions[key] = v; invalidCosts.delete(key); } else invalidCosts.add(key);
  renderCosts();
});
$('language').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; $('action-status').textContent = ''; translate(); });
$('download').addEventListener('click', () => {
  if (!result || invalidCosts.size || invalidInputs.size) return;
  const history = actionHistory.length ? `\n## ${t('措施模拟记录', 'Action simulation history')}\n${actionHistory.map(a => `- ${a.id}: ${a.changes.map(c => `${c.key} ${c.before} → ${c.after}`).join(', ')}`).join('\n')}\n` : '';
  const range = result.outOfRange.length ? `\n${t('超出训练范围的特征', 'Features outside training range')}: ${result.outOfRange.join(', ')}\n` : '';
  const text = report({ lang, values, result, baseline, assumptions }) + history + range;
  if (reportUrl) URL.revokeObjectURL(reportUrl);
  reportUrl = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/markdown;charset=utf-8' }));
  $('report-text').value = text;
  $('report-download').href = reportUrl;
  $('report-download').download = `risk-lab-${lang}-${new Date().toISOString().slice(0, 10)}.md`;
  $('report-modal').showModal();
  $('action-status').textContent = t('情景报告已生成，可预览与下载。', 'Scenario report generated; ready to preview and download.');
});
$('close-report').addEventListener('click', () => $('report-modal').close());
$('report-modal').addEventListener('close', () => { if (reportUrl) URL.revokeObjectURL(reportUrl); reportUrl = null; });
$('prediction-message').addEventListener('click', event => { if (event.target.id === 'retry') initializeModel(); });
async function initializeModel() {
  loading = true; error = false; renderModelStatus(); renderResults();
  try { model = await loadModel(); }
  catch (e) { model = null; error = true; console.error('Model loading failed:', e.message); }
  finally { loading = false; renderModelStatus(); renderResults(); }
}
translate();
initializeModel();
