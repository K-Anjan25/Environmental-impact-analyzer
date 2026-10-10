# Implementation and Release Record — Environmental Impact Analyzer

## Delivered scope

The v1 product is an open-data process estimator. It uses Carbonfact's pinned v1.1.0 published score rows and returns process-level results by separate indicator. It does not calculate a complete product footprint, combine process rows, or create a combined score.

## Completed implementation

- [x] Selected a supportable process-only scope rather than holding calculations behind external approvals or claiming a full LCA.
- [x] Pinned and bundled the v1.1.0 source score files, family documentation, and CC BY-SA 4.0 license text.
- [x] Loaded 302 real factor rows from 11 documented source categories; source count discrepancy and non-woven exclusion are recorded in the source notice.
- [x] Normalized CSV header variants and reference-unit metadata; rejected missing columns, nonfinite values, and malformed required rows at load time.
- [x] Implemented factor family/search API, quantity validation, Decimal scaling, and separate 16-indicator results for each process row.
- [x] Added source geography, DQR fields, Input required (kg) display, source release/file identity, attribution, ShareAlike/result license, and background-inventory disclosure.
- [x] Added an accessible, responsive React estimator and same-screen result attribution.
- [x] Added a CSV export with one row per process and indicator, source identity, units, data-quality fields, license, attribution, and no aggregate row.
- [x] Kept the tool stateless; no accounts, database, analytics, product-history, or request-body logging are used.
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

Vercel is the selected deployment platform. Root `vercel.json` pins the Container framework preset. The operator supplied a successful build/deployment log for commit `3bb77c0`; the latest app-code commit `0775d5d` has successful CI and a successful Vercel status. The log confirms Vercel built from repository-root paths, set `PORT=8000` in the container image, and deployed the Beta Container Runtime in `iad1` with a 300-second timeout. The operator reports the authenticated Preview checks passed for health, docs, catalog, calculation, CSV download, and all six policy pages on `ccb75f9`; the new source-geography filter still needs a quick authenticated check. External probes are redirected to SSO. Vercel's OCI build ignores Docker `HEALTHCHECK`, so `Dockerfile.vercel` no longer relies on it while CI still HTTP-smoke-tests `/healthz`. The operator selected a no-SLA early beta and no custom domain. The candidate default alias `environmentalimpactanalyzer.vercel.app` still returns 404 externally; record the exact working Preview alias and attach/confirm the stable Production alias in Vercel. `PRIVACY.md` and `TERMS.md` now use the operator's public name, linked contact page, and India-law/India-venue clause per direction; confirm identity, monitor the contact channel, review legal suitability and live Vercel logging/retention, and record the effective date before public Production. `main` remains the Production Branch; no PR/merge or Production deployment has been made. Compose validates images only. See [roadmap.md](roadmap.md) for release gates and rollback steps.

## Fixed product boundary

The following are not incomplete v1 tasks; they are deliberately outside the delivered estimator's boundary:

- product BOM/material composition and cross-stage mass propagation;
- upstream raw-material factor coverage and modeled waste treatment;
- whole-product totals, comparison, ranking, and consumer environmental claims;
- access to or reconstruction of ecoinvent or any other non-open inventory.

The roadmap records a discovery path for adding product-input/BOM capture and more upstream/loss/waste process factors only when open licensed data, compatible units/boundaries, and validated calculations exist. Results must remain separate by process and indicator under the current authorization. No cross-stage total, complete product footprint, or combined score is planned; ecoinvent reconstruction is excluded by the open-data-only rule. See [roadmap.md](roadmap.md).
