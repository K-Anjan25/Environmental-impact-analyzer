# Release Readiness and Version Roadmap

This roadmap separates **v1 release verification** from future discovery. A feature outside v1 is not a hidden v1 blocker, and a roadmap item is not permission to relax the current product and data constraints.

## Current release: v1 process estimator

### Delivered

- Carbonfact v1.1.0 published factors are bundled and pinned under CC BY-SA 4.0: 302 source rows, 12 selectable factor groups, and 16 EF 3.1 indicators.
- A quantity scales one selected factor in that factor's reference unit. Every process and indicator remains separate; there is no product total or combined score.
- Attribution, license URL, source geography, available DQR/input metadata, CSV export, and the ecoinvent-background limitation are in the product.
- API tests (11), frontend/accessibility tests (9), Ruff, formatting, mypy, TypeScript, and the Vite production build passed. Local API/static-serving smoke tests passed.

### Remaining v1 release checks

1. **Container acceptance:** the user's `docker compose up --build` reported `healthy` and both Uvicorn workers completed startup. GitHub CI also built both container images and smoke-tested health, docs, catalog, and a 16-indicator estimate against each. The user-facing browser/CSV workflow in the Compose container remains to be checked.
2. **Local Vercel-image preflight:** the Vercel-targeted image has been built and API-smoke-tested in GitHub CI. To run that same image locally, use `docker compose --profile vercel up --build analyzer-vercel`; it listens on host port 8001 and uses `PORT=8000`. This validates the image locally, not Vercel routing.
3. **Vercel preview deployment:** Vercel is the selected platform; the project and custom domain are undecided, and no Vercel deployment has been made. The root `Dockerfile.vercel` uses Vercel's Container Runtime so the same-origin app can run as one container. Vercel auto-detects that filename and routes traffic to the image; the Container Runtime is currently Beta ([official guide](https://vercel.com/docs/functions/runtimes/container)). Import the repository with its root as the project root, set the project environment variable `PORT=8000` for Preview and Production, and deploy a preview. Do not treat the local Compose result as a Vercel preview result.
4. **Preview acceptance:** check `/`, `/healthz`, `/api/docs`, `/api/v1/factors?limit=1`, one estimate, CSV download, security headers, and runtime logs. Verify resource limits, cold starts, health behavior, and privacy/logging policy before using the Beta container runtime in production.
5. **Production cut:** after the preview passes and the runtime choice is accepted, select the production URL/domain, verify health and privacy behavior, run the release checks, and record the release/version and rollback procedure. If the Container Runtime Beta is not acceptable for production, switch the deployment spike to Vercel's standard FastAPI Python runtime and validate its entrypoint, static files, and bundled data instead; do not treat Beta as an approved production choice by default.

### Vercel deployment attempt log

The first Vercel build output cloned `main` at `102be24` and reported no `functions`, `static`, or `services` output. That commit predates this implementation and does not contain `Dockerfile.vercel`; this was a branch/root-selection issue, not a failure of the current container image. Do not promote or use that empty deployment. A later GitHub Vercel status for feature-branch commit `cd788f0` reports `success` / “Deployment has completed.” The app routes have not yet been confirmed in the user's browser. Open that branch Preview, confirm `PORT=8000` is set for Preview, then test `/`, `/healthz`, `/api/docs`, factor search, calculation, and CSV. Keep `main` as the Production Branch for now; the project Root Directory must be the repository root.

### Local container acceptance flow

From the repository root:

```bash
docker compose up --build
```

The user's first run already showed `Up ... (healthy)` and successful FastAPI startup. To complete the container smoke test, verify these routes (use `curl.exe` in Windows PowerShell):

```powershell
docker compose ps
curl.exe -fsS http://localhost:8000/healthz
curl.exe -fsS 'http://localhost:8000/api/v1/factors?limit=1'
curl.exe -fsS http://localhost:8000/api/docs
```

Then use the browser at `http://localhost:8000` to calculate a process and download its CSV. The service should return separate indicator rows with source/license information. To provide diagnostics, share the full `docker compose up --build` output if the build fails, plus:

```bash
docker compose logs --no-color --tail=150 analyzer
docker compose ps
```

Stop the normal local container with `docker compose down`. To test the Vercel-targeted image locally, run:

```powershell
docker compose --profile vercel up --build analyzer-vercel
curl.exe -fsS http://localhost:8001/healthz
```

Open `http://localhost:8001` and test one estimate/CSV. Stop the profile with `docker compose --profile vercel down`. This is still a local image test; Vercel's preview must be checked separately. To move the normal Compose app to another host port, run `ANALYZER_PORT=8001 docker compose up --build` in a POSIX shell, or set `$env:ANALYZER_PORT='8001'` before `docker compose up --build` in PowerShell.

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
