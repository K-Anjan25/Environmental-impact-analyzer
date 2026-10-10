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

`docker-compose.yml` builds and health-checks the same-origin web/API image. The API's static-serving path was smoke-tested against the Vite build, but the image itself could not be built in this environment because Docker-compatible tools are unavailable. The user will run Compose and share the build/runtime logs for follow-up.

Vercel is the selected deployment platform. The Vercel project configuration and custom domain are undecided, and no Vercel deployment has been validated yet. Compose is for local container acceptance, not the Vercel deployment configuration. See [roadmap.md](roadmap.md) for the release flow and future-version path.

## Fixed product boundary

The following are not incomplete v1 tasks; they are deliberately outside the delivered estimator's boundary:

- product BOM/material composition and cross-stage mass propagation;
- upstream raw-material factor coverage and modeled waste treatment;
- whole-product totals, comparison, ranking, and consumer environmental claims;
- access to or reconstruction of ecoinvent or any other non-open inventory.

The roadmap records a discovery path for adding product-input/BOM capture and more upstream/loss/waste process factors only when open licensed data, compatible units/boundaries, and validated calculations exist. Results must remain separate by process and indicator under the current authorization. No cross-stage total, complete product footprint, or combined score is planned; ecoinvent reconstruction is excluded by the open-data-only rule. See [roadmap.md](roadmap.md).
