# Release Readiness and Version Roadmap

This roadmap separates **v1 release verification** from future discovery. A feature outside v1 is not a hidden v1 blocker, and a roadmap item is not permission to relax the current product and data constraints.

## Current release: v1 process estimator

### Delivered

- Carbonfact v1.1.0 published factors are bundled and pinned under CC BY-SA 4.0: 302 source rows, 12 selectable factor groups, and 16 EF 3.1 indicators.
- A quantity scales one selected factor in that factor's reference unit. Every process and indicator remains separate; there is no product total or combined score.
- Attribution, license URL, source geography, available DQR/input metadata, CSV export, and the ecoinvent-background limitation are in the product.
- API tests (11), frontend/accessibility tests (9), Ruff, formatting, mypy, TypeScript, and the Vite production build passed. Local API/static-serving smoke tests passed.

### Remaining v1 release checks

1. **Container acceptance:** run the repository's `docker-compose.yml` and inspect the image build, healthy status, UI, API, and result behavior. The image has not been built in this development environment because no Docker-compatible engine is installed. The user will run Compose and share the build/runtime logs.
2. **Vercel deployment validation:** Vercel is the selected deployment platform. The exact Vercel project configuration and custom domain are not chosen yet, and no production deployment has been made. The Compose setup is a local container acceptance test; it is not itself a Vercel deployment configuration.
3. **Vercel implementation spike:** verify the existing FastAPI application and bundled score files with Vercel's Python/FastAPI runtime, build and route the Vite assets, and test same-origin paths and response headers in a Vercel preview. Vercel documents deploying FastAPI with Python Functions and supports static assets/frontends; implement and verify the repository-specific entrypoint/build/routing before relying on it ([FastAPI deployment guide](https://vercel.com/docs/frameworks/backend/fastapi)). Do not assume the local Docker/Compose behavior is identical to Vercel.
4. **Production cut:** after the preview passes, select the deployment URL/domain, verify health and privacy behavior, run the release checks, and record the release/version and rollback procedure.

### Local container acceptance flow

From the repository root:

```bash
docker compose up --build
```

In another terminal, verify:

```bash
docker compose ps
curl -fsS http://localhost:8000/healthz
curl -fsS 'http://localhost:8000/api/v1/factors?limit=1'
curl -fsS http://localhost:8000/api/docs
```

Then use the browser at `http://localhost:8000` to calculate a process and download its CSV. The service should report healthy and return separate indicator rows with source/license information. To provide diagnostics, share the full `docker compose up --build` output if the build fails, plus:

```bash
docker compose logs --no-color --tail=150 analyzer
docker compose ps
```

Stop the local container with `docker compose down`. To use a different host port, run `ANALYZER_PORT=8001 docker compose up --build` and visit port 8001.

## Future versions: gated by open data and the product boundary

### v1.x — source coverage and operational polish

- Add a process family only when the source is openly licensed, pinned to a version/commit, attributable, and has a clear process boundary, reference unit, geography, and compatible EF 3.1 indicators.
- Reconcile source row counts and optional metadata; preserve original scores and document transformations.
- Improve search, CSV usability, and accessibility without adding defaults, missing-stage imputation, cross-process sums, or a combined score.

### v2 discovery — product inputs without an aggregate score

This is a discovery path, not a committed full-product LCA. A future workflow may capture product/BOM quantities to help users select and scale relevant process factors, while continuing to return **separate process-by-indicator results only**.

1. Define the intended product/use cases, product-input fields, reference quantities, and boundaries before adding a BOM form.
2. Inventory openly licensed upstream material and process factors. Record each source's license, version, attribution, geography, time coverage, and reference unit before integration.
3. Map factors to BOM/process inputs only where units and boundaries support that mapping. Missing compositions, stage inputs, loss rates, or geography must stay explicit; do not infer them.
4. Add loss or waste-treatment factors only when openly licensed, compatible factors and an explicit mass-balance method are available. Display those rows separately; do not silently apply `Input required (kg)` as an upstream burden.
5. Use only openly licensed, bundled data. Do not obtain, bundle, query, or reconstruct ecoinvent or another non-open inventory. If no suitable open factor exists, leave that process unavailable rather than fabricate a result.
6. Test unit conversion, factor lineage, mass balance, missing-data behavior, licensing, accessibility, and exports before any release.

### Hard boundary under the current authorization

Cross-stage totals, a complete product footprint, and any combined environmental score remain out of scope. The future workflow above may organize product inputs and show additional separate rows, but it must not sum process results or imply that the selected rows form a complete LCA. Reconsidering that boundary would require a separate, explicit product-scope decision and a defensible open-data method; it must not happen as an implementation detail.

## Version flow

`Use case and boundary → open-source/license audit → reference-unit and geography reconciliation → calculation/schema tests → accessible UI and attributed export → container smoke test → Vercel preview validation → release record and rollback plan`
