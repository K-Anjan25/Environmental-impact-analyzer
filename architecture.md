# Project Architecture — Environmental Impact Analyzer

## 1. Implemented boundary

The application is an open-data process estimator with an expanded v2 product-input mapping prototype. It preserves independent process rows and can calculate a selected-row subtotal and EF 3.1 single score in the browser. Text-match factor suggestions require user confirmation; supported same-dimension unit and source-input-required conversions are local. An optional flat-BOM mass diagnostic runs only after the user confirms every declared line is a product component for the same functional unit; adding/removing an input resets confirmation. It compares supported user-declared inputs to finished-product mass and exposes unconvertible lines. It is arithmetic only: this does not validate a hierarchical/composition-complete BOM or establish a complete product footprint.

## 2. Runtime components

- **Web:** React 19, TypeScript, Vite, Material UI. It loads the factor catalog from relative `/api/v1/factors`, keeps product-input lines/mappings in page memory, computes mapped-input quantities and estimates locally, displays separate indicators plus a selected-row subtotal/EF score, and exports CSV in the browser. Manually entered process quantities use the stateless estimate endpoint.
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
  src/product-quantity.ts  Browser-local unit, feed, and process-mass diagnostic rules
  src/product-bom.ts       Flat-BOM mass check and local input-use review
  src/factor-suggestions.ts User-confirmed word-overlap factor suggestions
  src/ef31-score.ts        JRC EF 3.1 normalisation/weighting factors and score formula
  src/product-summary.ts  Compatible selected-row indicator totals
  src/local-estimates.ts   Browser-local estimates for mapped input quantities
  src/export.ts            Source/method attributed CSV formatter/download
  src/styles.css           Responsive and accessible visual system
services/api/
  app/main.py              FastAPI app, endpoints, security headers, static SPA serving
  app/factor_catalog.py    Versioned CSV loader, family/index registry, Decimal calculator
  app/factor_schemas.py   Request/response contracts and JSON number serialization
  data/carbonfact-v1.1.0/  Included source files and SOURCE.md record
  tests/                   API, factor-catalog, and arithmetic tests
```

## 4. Factor load and calculation flow

1. At API import/startup, `factor_catalog.py` reads an explicit allowlist of CSV paths from the pinned data directory. Non-woven preview files are not on the allowlist.
2. The loader checks required headers, all 16 indicator columns, finite decimal values, stable descriptor IDs, and reference-unit mappings. Missing or malformed required data fails startup rather than serving an empty catalog.
3. `GET /api/v1/factors` returns up to 500 factor records with source values, units, geography tags, DQR fields, family metadata, source credit, and optional filters/pagination.
4. Product-input labels, declared amounts/units, associations, and quantity mappings remain in client state. Manual process quantities may be sent as `[{factor_id, quantity}, ...]` to `POST /api/v1/process-estimates`; mapped input quantities are derived and calculated locally and never enter that POST body.
5. The API validates 1–25 positive quantities, finds each exact factor ID, and computes each indicator value as `source_factor_value × quantity` using Python `Decimal`. The API response has independent process lines and `aggregation: none`.
6. For local mappings, `product-quantity.ts` validates unit dimensions and converts declared output or feed mass into factor reference quantity; `local-estimates.ts` scales the already-loaded factors. `product-summary.ts` sums compatible indicators across exactly the selected result rows; `ef31-score.ts` normalizes and weights the 16 categories with JRC values. Invalid or incomplete category sets suppress the score.
7. The client renders one 16-row table per process plus a selected-row subtotal/single score. Source input-required values can support mass-flow diagnostics, but no waste-treatment factor is applied. CSV exports individual rows, totals, score/method provenance, mapping status, and missing inputs as not calculated, not zero.

## 5. API contract

- `GET /healthz` — readiness and loaded factor count/source version.
- `GET /api/v1/methodology` — formula, indicator count, privacy behavior, data policy, and product-footprint boundary.
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

A browser-memory record of a user-provided name, positive quantity, and free-text unit, plus an optional finished-product mass per functional unit. A user may manually link an input to one or more selected process rows or accept a word-overlap suggestion. The declared name/amount/unit, finished-product mass, and associations never enter the API. If mapped as process output or feed, browser-local conversion derives the factor quantity. A separate flat-BOM mass check compares supported input masses with the entered finished-product mass only after the user confirms all declared lines are components for that functional unit; adding/removing an input resets confirmation. Non-mass or ambiguous units remain visible and suppress full closure. CSV may include the declaration, mass check, and mapping basis; inputs not used by a mapped calculation have blank impact values and an explicit not-calculated/not-zero status.

### Process estimate line and selected summary

Each process line contains source factor identity/metadata, quantity and reference unit, and 16 separate indicator records. Each indicator keeps source factor value/unit and scaled result value/unit. Separately, the browser may return compatible per-indicator sums for selected rows and an EF 3.1 score with normalized values, weights, and contributions. These are not complete-product results or a coverage percentage.

## 7. Data lineage and terms

The bundled snapshot is Carbonfact v1.1.0 tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`. The active files are published impact-score CSVs and process-family README files. The source record ships alongside them.

The source says its complete Brightway/Activity Browser inventories are not distributed and use ecoinvent 3.12. Published impact scores may reflect those modeled background contributions. The app uses the published outputs only; it does not bundle, query, or reconstruct full inventories. This limitation is returned by both source and calculation APIs and shown in the UI.

Schema normalization is documented in `SOURCE.md`: header variants for `Input required (kg)` and DQR names are normalized, reference-unit metadata are assigned from source family documentation, and indicator values are loaded unchanged. Global EF 3.1 normalisation factors are transcribed from the [JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx), while the all-category final weights, including robustness, are transcribed from the [JRC EF weighting report](https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf) and scaled to 100%. Normalisation values are reported to three significant figures; explicit category-specific unit aliases are tested for the toxicity and water-use outputs. Linked source credit, the pinned release, and the background-data note are available in the Method and source dialog and included in CSV exports.

## 8. Privacy and security

- No database, user accounts, analytics, cookie-based identity, or result history.
- Product-input labels, quantities, units, associations, finished-product mass, and quantities derived from those inputs remain in browser memory and are never part of the API schema or request body. Only manually entered process factor IDs and their separate source-reference quantities are posted for server calculation.
- The browser CSV may contain user-entered input context and the flat-BOM mass diagnostic when the user downloads it. No API persistence, browser storage, or server-side history is added. Request bodies and quantities are processed in memory and not written to application storage. Uvicorn access logging is disabled in the production container; the API has no request-body logging middleware.
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

- Selected-row subtotals and an EF 3.1 score are now authorized and implemented in the browser, but no complete product LCA or coverage percentage is claimed.
- Product inputs and derived mappings stay local; text suggestions require human confirmation; unsupported unit conversions are rejected.
- Carbonfact published v1.1.0 score outputs are active; the source credit is applied.
- Ecoinvent and other restricted background data are not included or reconstructed. Use requires evidence that the source terms permit the intended processing and redistribution.
- The v1.1.0 count discrepancy is handled by loading exact included CSV rows (302) and documenting the source's 304 headline; no placeholders are created.
- Global and country-specific factors remain explicit source choices; no default geography is inferred.
- Missing upstream, transport, waste-treatment, and end-of-life coverage remains a blocker to a complete product footprint.
