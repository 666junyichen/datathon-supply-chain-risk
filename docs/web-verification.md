# Web verification — 2026-10-05

Production: https://datathon-supply-chain-risk-lab.vercel.app

Deployment: `dpl_Eo2Erjd9DKizwdwUkEzFbLtZRatP`, Vercel state `READY`, production alias assigned. Git deployment Root Directory is `web`, framework Other, build/install commands empty, output `.`. CLI deploys from the repository root with training artifacts excluded by `.vercelignore`.

## Automated checks

- `node --check web/app.mjs`: passes.
- `node --test web/tests/domain.test.mjs`: 6 tests pass.
- The parity test checks 127 deterministic Python reference scenarios: 3 original presets, 96 seeded random cases, 28 single-variable boundaries. All classes agree; every probability difference is below 2e-6 and engineered-feature difference below 1e-10.
- Tests also cover original 0.01 GUI precision, invalid values, damaged binary, zero inventory, bounded actions, unchanged delay probability during customs simulation, commercial zero-loss / invalid assumptions, bilingual report contents and baseline inclusion.
- `python -m unittest discover -s tests`: original feature test passes.
- Changed/staged files pass `git diff --cached --check`. An existing unstaged README edit is preserved separately.

## Browser checks

- Original model downloads and runs in the browser. High preset returns high risk, approximately 87.4% high-class support.
- Saving the baseline and applying the route action changes road and port values from 9 to 7, and displays the original non-monotonic probability response.
- Moderate preset correctly shows low risk and explains the preset/output mismatch.
- English switch translates results, advice and commercial assumptions while preserving the baseline.
- Changing example action cost from 500 to 1,000 CNY changes break-even from 5.21 to 10.42 percentage points.
- Entering 1.1 for delay probability blocks predictions and report generation. Keyboard arrow control updates the slider in 0.01 increments.
- Entering customs time 2.55 keeps the numeric field and slider synchronized at 2.55.
- Narrow layout inspected: document scroll width equals client width, with stacked controls/results and readable cards.
- Report dialog contains raw inputs, prediction, assumptions, synthetic-data notice and a downloadable Markdown link. Browser automation download-event capture timed out; preview content and the generated download link were verified instead.
- Independent read-only review found stale action history after preset replacement. Reproduced in the browser and fixed by clearing the history on preset load. Regression check: applying customs then selecting low preset no longer exports the old 9 → 7 customs action, and raw customs input is 2.
- Browser console check reported no application errors.

## Operational limits

Initial model asset is about 9.9 MiB compressed. A current browser with native gzip decompression is required. Synthetic-data predictions are not causal intervention estimates or calibrated incident probabilities. Recommendations and numerical action targets are transparent demo rules. Example cost inputs are independent assumptions, not measured competition savings.
