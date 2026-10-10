# Project Memory — Environmental Impact Analyzer

## Current product state

The application uses 302 published process-factor records from Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0 (CC BY-SA 4.0), across 11 source categories and 12 selectable factor groups. It preserves each row's 16 EF 3.1 indicators and provides attributed CSV export.

The expanded v2 worksheet is browser-local: up to 25 declared inputs, user-confirmed text-match suggestions, selected output/feed mappings, dimension-checked unit conversions, source-reported input-feed scaling, and process mass diagnostics. The browser can subtotal only the selected process rows by indicator and calculate an EF 3.1 single score for that selected set. These features do not establish a complete product footprint, complete BOM, stage coverage, or non-overlapping boundaries.

The optional flat-BOM mass arithmetic now runs only after the user confirms every declared line is a product component for the same functional unit. Adding or removing an input resets that confirmation. Unconvertible lines remain explicit. The check does not infer composition or hierarchy, validate a complete BOM, or calculate impacts for a mass difference or waste treatment.

## Standing product, privacy, licensing, and release constraints

- Keep the product-input area visually clean. Implementation and privacy explanations belong in the separate Method, source and reuse dialog or project documentation, not below/around the input fields.
- Product-input labels, amounts, units, associations, suggestion choices, finished-product mass, and derived mapped quantities stay in browser memory and out of API requests unless the user clearly authorizes a reviewed data-flow change. Manual process estimates may send only factor IDs and explicitly entered source-reference quantities. The app has no accounts, persistent assessment history, analytics, or request-body logging.
- Keep process indicators distinct and transparent. Missing/unmapped inputs are not zero. Totals/scores include selected rows only, do not establish coverage, and must not be presented as a complete product footprint or environmental claim.
- Use only sources with documented lawful reuse. The user's expanded v2 authorization does not grant an ecoinvent license or authorize proprietary inventory reconstruction. Do not acquire, query, redistribute, or fabricate/reconstruct ecoinvent without lawful access and terms permitting the intended processing and redistribution. No new process-factor source has cleared the audit.
- Carbonfact's published impact-score files may include ecoinvent 3.12 background contributions. The full background inventories are not bundled, queried, or reconstructed. Original project code/docs use MIT; Carbonfact data and derived results retain CC BY-SA 4.0 with attribution.
- A prerelease is authorized, but no PR/merge or Production launch is authorized. The user selected Vercel Container Runtime Beta only for a no-SLA early beta, with no custom domain. Do not call it SLA-backed/production-grade or advertise an alias until verified serving.
- The user reports authenticated Preview checks passed, but has not supplied the URL. The candidate `environmentalimpactanalyzer.vercel.app` last returned 404 externally. Keep authenticated Preview verification distinct from public Production availability.
- Public legal material uses the profile-derived name Kyama Anjan Kumar, the user's contact page (not direct email), and India—not a city/state—for law/venue. Confirm legal identity/suitability before public Production. The linked portfolio contact page exposes a public phone number as well as contact options.
- Always work on branch `arena/01a0fee8-environmental-impact-analyzer`; do not switch branches. No PR, merge, or Production deployment was performed for the current changes.

## EF 3.1 score-source verification

Primary JRC sources were checked directly on 2026-10-10. The global normalisation factors in `apps/web/src/ef31-score.ts` match the `NFs EF3.1` sheet of the official [JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx) at its reported precision. The weight values match the JRC [2018 EF weighting report](https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf), recommended final weighting factors including robustness, scaled to 100% for the all-category set. The 16 percentages sum to 100%. The report also publishes an alternate set excluding three toxicity-related categories; the code intentionally uses its all-category set for the 16-indicator score and the choice is disclosed in the Method dialog and `data-sources.md`. The official JRC [2023 Member States Consumption Footprint Tool guide](https://eplca.jrc.ec.europa.eu/uploads/JRC132621_MS_guide.pdf) corroborates the EF 3.1 normalisation factors / Sala et al. (2018) weighting-factor pairing for an aggregate of 16 impact categories. A regression test pins every normalisation factor and weight. See `v2-source-audit.md` and `data-sources.md`.

## Workspace files

- `apps/web/src/ef31-score.ts` / `ef31-score.test.ts`: EF 3.1 normalisation and all-category weighting metadata, score calculation, source-unit aliases, and exact factor/weight regression checks.
- `apps/web/src/product-bom.ts` / `product-bom.test.ts`: flat-BOM arithmetic, explicit component-scope confirmation, and input-use review.
- `apps/web/src/App.tsx` / `accessibility.test.tsx`: local input workflow, confirmation reset on input changes, summary UI, privacy/method disclosure, and accessible interaction tests.
- `apps/web/src/product-summary.ts` / tests and `apps/web/src/export.ts` / tests: selected-row subtotals, normalisation units and score provenance, BOM confirmation/status, and attributed CSV.
- `architecture.md`, `design.md`, `prd.md`, `task.md`, `roadmap.md`, `README.md`, `data-sources.md`, `v2-discovery.md`, `v2-source-audit.md`, `PRIVACY.md`, `TERMS.md`, `CONTRIBUTING.md`, and `services/api/data/carbonfact-v1.1.0/SOURCE.md`: current product, method, privacy, licensing, source, scope, and release disclosures. `apps/web/public/legal/` is generated from the canonical documents during build.
- `services/api/app/`: stateless FastAPI catalog and process calculator. `docker-compose.yml` and `Dockerfile.vercel` describe container packaging.

## Verification (2026-10-10)

- API Ruff lint and format: pass (`All checks passed`; 6 files already formatted).
- API mypy: pass (5 source files, no issues).
- API pytest: **11 passed**.
- Frontend Vitest/axe: **40 passed across 8 files**.
- `npm run build --prefix apps/web`: pass, including TypeScript `--noEmit` and Vite production build (920 modules).
- Same-origin static/API smoke test using the built frontend served by Uvicorn on `0.0.0.0:8000`: `/`, `/healthz`, `/api/v1/factors?limit=1`, `/api/docs`, and all six generated privacy/terms/license/source pages returned HTTP 200. Health reported 302 factors; the catalog returned one requested record from 302 total. A same-origin POST smoke test returned one process with all 16 indicators.
- Docker, Docker Compose CLI, Podman, Nerdctl, and Buildah are unavailable in the current sandbox, so container build/smoke could not be rerun here. A previous user-supplied run in `roadmap.md` showed a healthy Compose container; that does not verify the current expanded build.
- No Vercel deployment, Preview verification, PR, merge, or Production launch was performed.

## Local verification commands

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm test --prefix apps/web
npm run build --prefix apps/web
```
