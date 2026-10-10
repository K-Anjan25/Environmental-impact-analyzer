# Project Memory — Environmental Impact Analyzer

## Current product state

The application is a working process-level estimator for apparel and footwear activities. It uses 302 published score rows from a pinned CC BY-SA 4.0 source, calculates 16 EF 3.1 indicators separately, and exports attributed CSV. The application never sums different process rows or presents a whole-product footprint or combined score.

The UI and API no longer have inactive-source gates or no-score product-assessment endpoints. There are no account, database, history, analytics, or request-body logs in the application.

## Firm scope decisions

- Keep the product context global-market apparel/footwear; show source geography exactly and do not infer an item's manufacturing location.
- Use only openly licensed data. Carbonfact v1.1.0 published impact scores are included under CC BY-SA 4.0 with same-screen linked attribution and ShareAlike for derived results.
- Use published process factors only. The formula is source factor × user-entered quantity in the same reference unit.
- Report each selected process and each of its 16 indicators separately. No cross-stage sum, product total, comparison, ranking, or combined score.
- Do not imply a complete product LCA. Material composition, product BOM, stage linking, upstream input propagation, waste treatment, distribution, and end-of-life are not modeled.
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
- `apps/web/src/App.tsx`: responsive process search, reference-unit quantity form, separate indicator results, source dialog, and attribution.
- `apps/web/src/export.ts`: one-row-per-process/indicator CC BY-SA CSV formatter and download.
- `services/api/data/carbonfact-v1.1.0/SOURCE.md`: exact source snapshot, attribution, included families, count reconciliation, and transformations.
- `README.md`, `prd.md`, `data-sources.md`, `architecture.md`, `design.md`, `rules.md`, `task.md`, and `roadmap.md`: current product boundary, release flow, and version path.

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
- Frontend Vitest/axe: 9 passed.
- TypeScript and Vite production build: pass.
- ASGI smoke test: static `/` serving, `/api/docs`, OpenAPI route set, 302-row catalog, a 16-indicator estimate, and 404 for unknown API routes all passed.
- Docker/Podman/Buildah/nerdctl are unavailable in this sandbox, so the Docker image itself was not built. `docker-compose.yml` is present for user-run container acceptance; the local API static-serving behavior was tested.
- Vercel is the user's selected deployment platform. Vercel project configuration and custom domain are undecided; no production deployment has been validated. The Vercel-specific FastAPI/static build and routing spike is documented in `roadmap.md`.

## Reference links

- [Carbonfact v1.1.0 tag](https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0)
- [Zenodo record](https://zenodo.org/records/21102756)
- [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [Open-data source record](data-sources.md)
