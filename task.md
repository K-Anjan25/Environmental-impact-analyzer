# Implementation and Release Record — Environmental Impact Analyzer

## Delivered scope

The current application keeps the Carbonfact v1.1.0 process rows and their 16 separate indicators, and adds a browser-local product-input mapping worksheet, flat-BOM mass diagnostic, selected-row indicator subtotals, and the EF 3.1 single score. Product inputs and the optional finished-product mass remain local; mapped conversions, factor scaling, and mass arithmetic run in the browser. This is an expanded v2 increment, not a complete or validated product footprint.

## Completed implementation

- [x] Selected a supportable process-only scope rather than holding calculations behind external approvals or claiming a full LCA.
- [x] Pinned and bundled the v1.1.0 source score files, family documentation, and CC BY-SA 4.0 license text.
- [x] Loaded 302 real factor rows from 11 documented source categories; source count discrepancy and non-woven exclusion are recorded in the source notice.
- [x] Normalized CSV header variants and reference-unit metadata; rejected missing columns, nonfinite values, and malformed required rows at load time.
- [x] Implemented factor family/search API, quantity validation, Decimal scaling, and separate 16-indicator results for each process row.
- [x] Added source geography, DQR fields, source input requirements, source release/file identity, attribution, ShareAlike/result license, and background-inventory disclosure.
- [x] Added EF 3.1 selected-row aggregation and weighted single score using JRC global normalisation factors and the all-category final EF weights (including robustness, scaled to 100%), with normalisation units, category contributions, and separate JRC workbook/report citations in the UI and CSV. The 16 weights sum to 100%; category-specific unit aliases are explicit and tested.
- [x] Added an accessible, responsive React estimator and same-screen result attribution.
- [x] Added a CSV export with separate process-indicator rows, selected-row totals, EF 3.1 score, method/source provenance, units, data-quality fields, attribution, and input mapping status.
- [x] Expanded the browser-only product-input worksheet with user-confirmed word-match factor suggestions, output/feed quantity modes, guarded dimension-aware unit conversion, source input-required scaling, and source-based mass-difference diagnostics. Added an explicitly user-confirmed flat-BOM mass comparison against user-entered finished-product mass; editing the declared inputs resets the scope confirmation. Unconvertible lines, repeated mappings, and input rows marked not calculated/not zero remain explicit. None of these diagnostics validates product composition or coverage.
- [x] Simplified the input area by removing explanatory implementation copy beneath and around its fields; detailed method/privacy boundaries remain in the separate disclosure dialog.
- [x] Started the v2 open-data/licensing screen, including direct USDA LCA Commons field-crop records. The version-2 crop archive remains a candidate pending provider-graph/method review; the separate ecoinvent-linked crosswalk is excluded. No new factor data was integrated; see [v2-source-audit.md](v2-source-audit.md).
- [x] Kept the API stateless with no accounts, database, analytics, saved assessments, or request-body logging. Product-input notes, mappings, finished-product mass, and derived quantities exist only in browser page memory and are not sent to the API.
- [x] Added a non-root multi-stage production Docker image that serves the web build and API from one origin, with health check and access logging disabled.
- [x] Removed inactive-source/activation-gate UX and legacy no-score routes from the active API/UI.
- [x] Added API arithmetic/schema/catalog tests, front-end API/export tests, and axe accessibility checks.
- [x] Added a root MIT license for original application code/project documentation, preserving the separate Carbonfact CC BY-SA 4.0 data terms.
- [x] Added contribution guidance and draft privacy/terms documents; populated the operator name, linked contact page, and proposed India-law/India-venue details at the operator's direction, with identity confirmation, contact monitoring, and legal review still required before Production.
- [x] Added same-origin footer links to generated Privacy, Terms, Software License, and Data Source pages; generation runs from the canonical repository documents during Vite development/build.
- [x] Removed the requested hero scope slogans and illustration captions from the dashboard without changing calculation behavior or product boundaries.
- [x] Began the next usability increment with an explicit source-geography filter that preserves source labels/codes/counts and keeps unstated geography un-inferred.

## Release verification

The release is verified by the repository checks:

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm test --prefix apps/web
npm run build --prefix apps/web
```

The local container acceptance command is:

```bash
docker compose up --build
```

`docker-compose.yml` builds and health-checks the same-origin web/API image. The user's Compose output confirmed a successful build, healthy status, and completed FastAPI startup. A browser/API/CSV smoke test in that container remains to be confirmed.

Vercel is the selected deployment platform. Root `vercel.json` pins the Container framework preset. The operator supplied a successful build/deployment log for commit `3bb77c0`; app-code commit `0775d5d` has successful CI and Vercel deployment. The new v2 app-code commit `2bf2130` has successful CI and Vercel deployment. A documentation-only follow-up, `9711cdd`, was still deploying at last check. The log confirms Vercel built from repository-root paths, set `PORT=8000` in the container image, and deployed the Beta Container Runtime in `iad1` with a 300-second timeout. The operator reports the authenticated Preview checks passed for health, docs, catalog, calculation, CSV download, and all six policy pages on `ccb75f9`; both the geography filter and v2 input organizer still need a quick authenticated Preview check. External probes are redirected to SSO. Vercel's OCI build ignores Docker `HEALTHCHECK`, so `Dockerfile.vercel` no longer relies on it while CI still HTTP-smoke-tests `/healthz`. The operator selected a no-SLA early beta and no custom domain. The candidate default alias `environmentalimpactanalyzer.vercel.app` still returns 404 externally; record the exact working Preview alias and attach/confirm the stable Production alias in Vercel. `PRIVACY.md` and `TERMS.md` now use the operator's public name, linked contact page, and India-law/India-venue clause per direction; confirm identity, monitor the contact channel, review legal suitability and live Vercel logging/retention, and record the effective date before public Production. `main` remains the Production Branch; no PR/merge or Production deployment has been made. Compose validates images only. See [roadmap.md](roadmap.md) for release gates and rollback steps.

## Expanded v2 scope and unresolved completeness gates

The user's expanded request supersedes the earlier prohibition on input mapping, unit conversion, material-flow diagnostics, selected-row totals, and a combined score. The code now includes:

- user-confirmed name-overlap factor suggestions (not validated equivalencies);
- browser-local conversion of selected common units, source-reported process-feed-to-output scaling, process mass-difference diagnostics, and an explicitly user-confirmed flat-BOM mass comparison that reports unconverted lines without treating them as zero;
- separate per-process indicators plus a selected-row indicator subtotal and EF 3.1 JRC-normalised/weighted single score (normalisation workbook plus weighting report);
- CSV provenance for both the source factors and the EF 3.1 score method.

These features do **not** establish a complete or validated BOM/product footprint. The user can enter finished-product mass for an arithmetic comparison only after confirming all declared lines are components for one functional unit; input changes reset confirmation. There is no hierarchical BOM, product-composition validation, complete mass-balance model, verified life-cycle stage coverage, new upstream factor source, or waste-treatment/end-of-life inventory. Text suggestions still require user confirmation. Selected rows may overlap; the UI cannot certify completeness. Product-input values and mapped quantities remain browser-local; no user inputs are sent to the API.

No ecoinvent license evidence or authorized dataset is present. Acquisition, reconstruction, querying, or redistribution of ecoinvent remains blocked until the exact lawful terms permit the intended processing and redistribution; do not bypass the license or fabricate a background inventory. Carbonfact's existing published factor values remain the only integrated process data and may reflect its ecoinvent-based background model. No new factor data was integrated in this increment.

The USDA version-2 field-crop archive and other candidates remain un-cleared for integration; see [v2-source-audit.md](v2-source-audit.md). The local web/API checks cover conversion, process feed, mass diagnostics, totals, score, privacy, export, and accessibility. A complete product footprint still requires a defined functional unit/boundary, hierarchical BOM validation, suitable licensed factors for missing stages and waste treatment, dependency/license review, non-overlap and coverage rules, and independent authenticated Preview verification. No PR, merge, or Production deployment is authorized by this task. See [roadmap.md](roadmap.md) and [v2-discovery.md](v2-discovery.md).
