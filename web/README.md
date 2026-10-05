# Supply Chain Risk Lab

中文默认、英文切换的交互物流风险决策网页。沿用已有 `xgb_model.pkl` 与 `scaler.pkl`，浏览器加载压缩模型后本地预测，无服务端预测接口。包含原 GUI 参数和预设、基准对比、六类规则建议、措施情景模拟、示例商业门槛计算及 Markdown 报告导出。

## Run locally

From the repository root:

```sh
python -m http.server 3018 --bind 127.0.0.1 --directory web
```

Open http://127.0.0.1:3018. Use a current browser with `DecompressionStream` support. Opening `index.html` directly as a file does not work because model loading uses fetch. Initial model download is approximately 9.9 MiB; inference thereafter is local. Fonts come from Google Fonts with local fallbacks. No shipment inputs are transmitted.

## Re-export the original model

From the repository root, with Python requirements installed:

```sh
python scripts/export_browser_model.py
node --test web/tests/domain.test.mjs
python -m unittest discover -s tests
```

Export requires numeric `gbtree` / `multi:softprob`, the original seven feature names in order, classes 0/1/2, and an unclipped MinMaxScaler. It rejects unsupported model types and categorical splits. The browser follows float32 input and accumulator behavior and checks the decompressed SHA-256 when Web Crypto is available. Metadata stores the source model hash.

`tests/browser-reference.json` contains 127 deterministic Python scenarios (original three presets, 96 seeded random inputs and 28 boundaries). Browser feature values, labels and class probabilities are checked against these references; probability tolerance is 2e-6.

## Deploy

Vercel project: **datathon-supply-chain-risk-lab**. Production: https://datathon-supply-chain-risk-lab.vercel.app.

For Git integration, set Root Directory = `web`, Framework Preset = Other, Build Command = empty, Install Command = empty, Output Directory = `.`. Include `model/metadata.json` and `model/model.bin.gz`. The repository-root `.vercelignore` limits CLI uploads to the website; raw notebook, pickle, training data and reference fixtures are excluded.

```sh
npx vercel link --yes --project datathon-supply-chain-risk-lab
npx vercel deploy --prod --yes
```

Run these commands from the **repository root**, because the linked project now uses `web` as Root Directory. The website has no build-time dependencies.

This is a synthetic-data portfolio demo. Preset names do not guarantee the predicted class. Saved-model outputs are preserved, including non-monotonic responses. Advice thresholds and action targets are illustrative operational rules; class probabilities are uncalibrated and cannot be used as actual disruption probabilities in ROI. Commercial assumptions do not change automatically when a model parameter changes. See `../docs/business-logistics-analysis.md` for the full business reasoning.
