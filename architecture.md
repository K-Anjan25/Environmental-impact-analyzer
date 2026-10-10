# Project Architecture — Environmental Impact Analyzer

## 1. Implemented boundary

The application is an open-data process-factor estimator with an optional v2 organizer for user-declared product inputs. The worksheet can manually associate an input line with a selected process as context only; it does not infer or validate a product BOM, use input quantities in calculations, create a whole-product LCA, sum activities, or output a combined score. The calculation remains a direct scale of one published impact factor by a separate user-entered quantity in that factor's source reference unit.

## 2. Runtime components

- **Web:** React 19, TypeScript, Vite, Material UI. It loads the factor catalog from a relative `/api/v1/factors` path, keeps optional product-input notes and manual context associations in page memory, posts only factor IDs and separate reference-unit quantities to the estimate endpoint, displays separate indicators, and exports CSV in the browser.
- **API:** Python 3.11, FastAPI, Pydantic v2. It validates process IDs and positive quantities, loads the bundled static data at startup, calculates with `Decimal`, and returns indicator values separately.
- **Data:** pinned CSV score files and family README files in `services/api/data/carbonfact-v1.1.0/`. No runtime provider fetch, background database, product catalogue, or database connection exists.
- **Production serving:** a multi-stage container builds the web client and serves it from FastAPI's static-file fallback, on the same origin as the API. The Vite dev server proxies relative `/api` paths to port 8000.

## 3. Repository layout

```text
docker-compose.yml          Local same-origin container acceptance setup
Dockerfile.vercel            Vercel Container Runtime image entrypoint (Beta)
roadmap.md                  Release readiness and future-version flow
apps/web/
  src/App.tsx              Factor search, v2 input organizer, calculation UI, results, source dialog
  src/api.ts               API/data contracts and same-origin fetch functions
  src/export.ts            CC BY-SA CSV export formatter/download
  src/styles.css           Responsive and accessible visual system
services/api/
  app/main.py              FastAPI app, endpoints, security headers, static SPA serving
  app/factor_catalog.py    Versioned CSV loader, family/index registry, Decimal calculator
  app/factor_schemas.py   Request/response contracts and JSON number serialization
  app/sources.py           Active source/license/provenance disclosure
  data/carbonfact-v1.1.0/  Included CC BY-SA 4.0 source files, license, SOURCE.md
  tests/                   API, factor-catalog, and arithmetic tests
```

## 4. Factor load and calculation flow

1. At API import/startup, `factor_catalog.py` reads an explicit allowlist of CSV paths from the pinned data directory. Non-woven preview files are not on the allowlist.
2. The loader checks required headers, all 16 indicator columns, finite decimal values, stable descriptor IDs, and reference-unit mappings. Missing or malformed required data fails startup rather than serving an empty catalog.
3. `GET /api/v1/factors` returns up to 500 factor records with source values, units, geography tags, DQR fields, family metadata, license/attribution metadata, and optional filters/pagination.
4. Product-input labels, declared amounts/units, and manual context associations remain in client state. The client posts only `[{factor_id, quantity}, ...]` to `POST /api/v1/process-estimates`; each quantity is separately entered in its factor's reference unit.
5. The API validates 1–25 positive quantities, finds each exact factor ID, and computes each indicator value as `source_factor_value × quantity` using Python `Decimal`.
6. The response has one result line per submitted process selection. The API exposes `aggregation: none`; it does not calculate a cross-process total or any product-level score.
7. The client renders one 16-row table per line and can export one CSV row per process/indicator pair. Optional manually associated input context is added in the browser; unassociated inputs are exported as not calculated, not zero. Attribution, ShareAlike license, transformation, and background-database note accompany calculated outputs.

## 5. API contract

- `GET /healthz` — readiness and loaded factor count/source version.
- `GET /api/v1/methodology` — formula, indicator count, privacy behavior, data policy, and product-footprint boundary.
- `GET /api/v1/sources` — active source license, attribution, source background dependency, scope, and limitations.
- `GET /api/v1/factors?family=&q=&offset=&limit=` — source factor catalog; default page size 500 and maximum 500.
- `POST /api/v1/process-estimates` — validated selections, maximum 25 rows; separate process/indicator response.
- `GET /api/docs` — OpenAPI UI. ReDoc is disabled.
- When the production web build exists, `/assets/*` serves static bundles and unmatched browser routes return `index.html`; unknown API/health paths return 404.

## 6. Logical models

### Process factor

`id`, `family_id`, `family_label`, `activity`, `source_descriptor`, source geography code/label, exact reference unit, 16 source indicator factors, optional DQR fields, optional `Input required (kg)` per source reference unit, and bundled source-file path.

### Process selection

`factor_id` (exact catalog descriptor) and `quantity` (finite positive decimal; maximum 1,000,000,000 and 8 decimal places). The UI prevents duplicate factor rows and the API limits requests to 25 selections.

### User-declared product input (client-only)

A browser-memory record of a user-provided name, positive quantity, and free-text unit, optionally associated manually with a selected process row. It is not sent to the API. The declared amount is context only and is not converted, propagated, or substituted for the process selection's reference-unit quantity. The browser CSV can include the declaration; unassociated lines have blank impact values and an explicit not-calculated/not-zero status.

### Process estimate line

Source factor identity and metadata, entered quantity and reference unit, and 16 separate indicator records. Each indicator returns source factor value/unit and scaled result value/unit. No result type contains a cross-process total or combined score.

## 7. Data lineage and licensing

The bundled snapshot is Carbonfact v1.1.0 tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`. The active files are published impact-score CSVs and process-family README files licensed CC BY-SA 4.0. The exact license text is shipped alongside them.

The source says its complete Brightway/Activity Browser inventories are not distributed and use ecoinvent 3.12. Published impact scores may reflect those modeled background contributions. The app uses the published outputs only; it does not bundle, query, or reconstruct full inventories. This limitation is returned by both source and calculation APIs and shown in the UI.

Schema normalization is documented in `SOURCE.md`: header variants for `Input required (kg)` and DQR names are normalized, reference-unit metadata are assigned from source family documentation, and indicator values are loaded unchanged. Derived results are licensed CC BY-SA 4.0 with linked attribution displayed beside on-screen values and included in CSV exports.

## 8. Privacy and security

- No database, user accounts, analytics, cookie-based identity, or result history.
- Optional user-declared input labels, quantities, unit text, and manual associations live in browser page memory only; no product-input fields are part of the API schema or request body. The API receives process factor IDs and separately entered source-reference quantities.
- The browser CSV may contain user-entered input context when the user downloads it. No API persistence, browser storage, or server-side history is added. Request bodies and quantities are processed in memory and not written to application storage. Uvicorn access logging is disabled in the production container; the API has no request-body logging middleware.
- Deployment infrastructure may retain network metadata under its own operating policy; the application does not claim control over external platform logs.
- API requests are same-origin in the production container and use relative paths in the browser. No permissive CORS policy is enabled.
- Response headers set `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. No `X-Frame-Options: DENY` header is set so the hosted preview can be embedded by Arena.

## 9. Deployment and operation

Run the local container acceptance test from the repository root:

```bash
docker compose up --build
```

The Compose service builds the Node web stage and Python API runtime into one same-origin image, exposes port 8000 by default, runs as non-root, and provides an HTTP health check. Uvicorn binds `0.0.0.0`, uses two workers, and disables access logging. The user's Compose log confirms the image built, the health check passed, and application startup completed. The sandbox could not run Docker; browser/API/CSV checks in the user's container remain in the release checklist.

Vercel is selected for a no-SLA early beta on the Beta Container Runtime; no custom domain or Production launch is authorized. Root `vercel.json` pins the container preset and the image listens on `PORT=8000`. Vercel reports deployment success for app-code commits `0775d5d` and `2bf2130`. The authenticated Preview needs an operator check of both the geography filter and v2 worksheet; external probes are redirected to SSO. The exact working Preview alias has not been recorded, and the candidate default alias last returned 404 externally. Docker Compose/CI verifies images but not Vercel routing or project settings; see [roadmap.md](roadmap.md) for release gates.

For local development, run the API on `0.0.0.0:8000` with `--no-access-log`, then Vite on `0.0.0.0:5173`; Vite proxies `/api` and `/healthz`. The Vite server permits the Arena `.e2b.app` preview host and no browser code contacts localhost.

## 10. Resolved architecture decisions

- Process-only calculations are the shipped alternative to unsupported full product LCA; v2 input declarations provide only user-owned context for separate process rows.
- Carbonfact published v1.1.0 score outputs are active under CC BY-SA 4.0; ShareAlike and linked attribution are applied.
- A product total, cross-stage sum, product score, full LCI reconstruction, and non-open background data integration are out of scope.
- The v1.1.0 count discrepancy is handled by loading exact included CSV rows (302) and documenting the source's 304 headline; no placeholders are created.
- Global and country-specific factors remain explicit source choices; no default geography is inferred.
