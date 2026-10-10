# Project Memory — Environmental Impact Analyzer

## Current product state

The application is a working process-level estimator for apparel and footwear activities. It uses 302 published score rows from a pinned CC BY-SA 4.0 source, calculates 16 EF 3.1 indicators separately, and exports attributed CSV. The optional v2 worksheet records user-declared input labels, amounts, and free-text units in browser memory and allows manual context associations to selected process rows. It never uses those input amounts in calculations, sums different process rows, or presents a whole-product footprint or combined score.

The UI and API no longer have inactive-source gates or no-score product-assessment endpoints. There are no account, database, saved-history, analytics, or request-body logs in the application. Product-input context does not reach the API or persist after reload/page close.

## Firm scope decisions

- Keep the product context global-market apparel/footwear; show source geography exactly and do not infer an item's manufacturing location.
- Use only openly licensed data. Carbonfact v1.1.0 published impact scores are included under CC BY-SA 4.0 with same-screen linked attribution and ShareAlike for derived results.
- Use published process factors only. The formula is source factor × user-entered quantity in the same reference unit.
- Report each selected process and each of its 16 indicators separately. No cross-stage sum, product total, comparison, ranking, or combined score.
- Do not infer or validate a product BOM or imply a complete product LCA. The v2 worksheet is only a user-declared input organizer with optional manual context links; no automatic factor matching, stage linking, unit conversion, upstream input propagation, loss/waste treatment, distribution, or end-of-life is modeled.
- Display source `Input required (kg)` but do not apply it to upstream burdens or waste treatment.
- Preserve the source's EF 3.1 WTU unit as m³ world-equivalent, never as litres or physical water volume.
- The Carbonfact outputs may reflect ecoinvent 3.12 modeled background contributions. Do not bundle, query, reconstruct, or call the underlying inventories open.
- Do not wait for external dataset approval or request a non-open license. The chosen source license and scope are applied as published.

## Pinned data facts

- Source: Carbonfact Open Source LCA Database for Footwear & Apparel, v1.1.0.
- Tag: `v.1.1.0`; commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`; Zenodo release date 2026-07-01.
- License: CC BY-SA 4.0. Source `LICENSE`, family README files, and impact-score CSVs are bundled at `services/api/data/carbonfact-v1.1.0/`.
- Loaded data: 302 actual CSV rows across 11 documented source categories; 12 UI factor groups because sneaker assembly is per pair and women's-boots assembly is per kg.
- Source top-level docs say 304 datasets. Actual included family CSV rows sum to 302 (weaving has 17 rows). The source's non-woven folder is excluded because the v1.1.0 top-level catalog lists it as forthcoming and its README/CSV counts conflict. No rows are invented.
- The process categories include yarn spinning, knitting, weaving, dyeing, finishing, printing, textile assembly, footwear assembly, synthetic PU leather, natural rubber, and use phase. Units vary across activities.

## Implementation map

- `services/api/app/factor_catalog.py`: pinned CSV loading, metadata mapping, family catalog, and Decimal calculation.
- `services/api/app/factor_schemas.py`: validated catalog/estimate request and response models.
- `services/api/app/sources.py`: active open source, license, background, attribution, and scope disclosure.
- `services/api/app/main.py`: `/healthz`, methodology, sources, factors, process estimates, security headers, and production static serving.
- `apps/web/src/App.tsx`: responsive process search, reference-unit quantity form, browser-only product-input organizer with context associations, separate indicator results, source dialog, and attribution.
- `apps/web/src/export.ts`: attributed process/indicator CSV with explicit context-only input fields and not-calculated/not-zero rows for unassociated declarations.
- `services/api/data/carbonfact-v1.1.0/SOURCE.md`: exact source snapshot, attribution, included families, count reconciliation, and transformations.
- `docker-compose.yml`: local same-origin container acceptance setup.
- `Dockerfile.vercel`: Vercel Container Runtime image entrypoint (Beta; project `PORT=8000` required).
- `.github/workflows/ci.yml`: API/web checks plus standard and Vercel-targeted container build/smoke jobs.
- `README.md`, `prd.md`, `data-sources.md`, `architecture.md`, `design.md`, `rules.md`, `task.md`, `roadmap.md`, and `v2-discovery.md`: current product boundary, release flow, and v2 input/mapping gates.

## Verification commands

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm test --prefix apps/web
npm run build --prefix apps/web
```

Run the one-origin container acceptance test from repository root:

```bash
docker compose up --build
```

## Latest verification (2026-10-10)

- API Ruff lint and format checks: pass.
- API mypy: pass.
- API pytest: 11 passed.
- Frontend Vitest/axe: 13 passed, including local-only product-input handling, exact API payload boundaries, context-only associations, CSV unassociated-input rows, and accessibility.
- TypeScript and Vite production build: pass.
- Vite-to-API smoke test: `/` served, proxied `/api/v1/factors?limit=1` returned 302 catalog records with one factor, and proxied `/healthz` returned ready.
- Current local code includes the v2 product-input organizer; the organizer and context links are client-only. The API receives only factor IDs and separately entered reference-unit quantities. No new source data or factor mapping was added.
- GitHub CI run `38061931644` passed API, web, and both container checks on the prior documentation commit `ba9141b`. CI for the current v2 changes must be checked after push.
- Vercel reports deployment success for app-code commit `0775d5d`; the new geography filter still needs the operator's authenticated Preview check. Vercel Preview is SSO-protected from external probes. The Vercel Container Runtime is Beta, authorized only for a no-SLA early beta with no custom domain; no Production deployment, PR, or merge is authorized. Check the current v2 Preview separately after the new branch deployment.
- Root `LICENSE` applies MIT to original project code/documentation; Carbonfact data and derived results remain under CC BY-SA 4.0. `PRIVACY.md` and `TERMS.md` describe the browser-only worksheet and still require operator/legal review before public Production. Legal pages are generated from canonical source documents during Vite build.


## Reference links

- [Carbonfact v1.1.0 tag](https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0)
- [Zenodo record](https://zenodo.org/records/21102756)
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [Open-data source record](data-sources.md)
