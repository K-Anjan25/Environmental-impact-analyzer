# Release Readiness and Version Roadmap

This roadmap separates **v1 release verification** from future discovery. A feature outside v1 is not a hidden v1 blocker, and a roadmap item is not permission to relax the current product and data constraints.

## Current release: v1 process estimator

### Delivered

- Carbonfact v1.1.0 published factors are bundled and pinned under CC BY-SA 4.0: 302 source rows, 12 selectable factor groups, and 16 EF 3.1 indicators.
- A quantity scales one selected factor in that factor's reference unit. Every process and indicator remains separate; there is no product total or combined score.
- Attribution, license URL, source geography, available DQR/input metadata, CSV export, and the ecoinvent-background limitation are in the product.
- API tests (11), frontend/accessibility/export tests (10), Ruff, formatting, mypy, TypeScript, and the Vite production build passed. CI smoke-tests both containers.

### Remaining v1 release checks

1. **Container acceptance:** GitHub CI run `38049930531` built both container images and smoke-tested health, docs, all six policy/source pages, the catalog, and a 16-indicator estimate. Frontend tests cover the separate-indicator UI and CSV formatting. A real browser download in the Vercel Preview remains to be confirmed.
2. **Vercel Preview:** the operator supplied a Vercel build log for feature-branch commit `3bb77c0` showing the repository-root build, image push, and deployment completion. The deployed artifact is the Beta Container Runtime in `iad1`, with a 300-second timeout; the Docker image sets `PORT=8000`. The operator reports the Preview is running. GitHub's Vercel status still says pending, so reconcile that status in the Vercel dashboard. The Preview is SSO-protected; external route checks cannot inspect the app content.
3. **Authenticated Preview acceptance:** in the Vercel-authenticated browser, verify `/`, `/healthz`, `/api/docs`, `/api/v1/factors?limit=1`, factor search/selection, a calculation, CSV download, and all six policy/source pages: `/legal/privacy.html`, `/legal/terms.html`, `/legal/license.html`, `/legal/data-sources.html`, `/legal/source-record.html`, and `/legal/source-license.html`. Review security headers and live runtime/logging settings. Vercel's build log says OCI output ignores Docker `HEALTHCHECK`; the Vercel Dockerfile no longer relies on that instruction, while `/healthz` remains HTTP-smoke-tested.
4. **Legal and product release readiness:** the operator/contact details and a proposed India/Hyderabad governing-law clause are now filled in `PRIVACY.md` and `TERMS.md` at the operator's direction. Confirm the displayed name is the correct operator identity, monitor the published email for privacy/service requests, review the proposed law/venue with appropriate counsel, record the actual effective date at launch, and inspect Vercel's live logging/retention and deployment-protection settings. The root MIT license applies only to original project code/documentation; the Carbonfact dataset and derived results retain CC BY-SA 4.0 obligations.
5. **Limited beta cut:** the operator selected Vercel's Beta Container Runtime only for a no-SLA early beta, with no custom domain. The project default alias `environmentalimpactanalyzer.vercel.app` returned Vercel 404 in an unauthenticated probe; verify the actual Preview URL and attach/confirm a working default alias in Vercel before advertising it. Production is **not launched** and no PR/merge has been made. After the authenticated checks and legal/configuration review, prepare the release PR from this branch, merge to `main`, verify the production alias and repeat health/API/calculation/CSV checks. Record the release version/date and rollback target before any public announcement.

### Vercel deployment attempt log

The first Vercel build output cloned `main` at `102be24` and reported no deployable output; that commit predates the implementation. The feature-branch Preview for `04eb280` later returned Vercel's `404 NOT_FOUND`, after which root `vercel.json` pinned the `container` framework preset. The operator's latest build log for `3bb77c0` shows Vercel cloned the correct feature branch, built and pushed the container image, and reported “Deployment completed.” The same log confirms the image's `PORT=8000`, container runtime, `iad1` region, and 300-second timeout; it also warns that Buildah's OCI output ignores Docker `HEALTHCHECK`, now removed from `Dockerfile.vercel`. The operator reports the Preview is running, but the authenticated Preview remains inaccessible to external checks. The candidate project default URL `environmentalimpactanalyzer.vercel.app` returned 404, so it is not yet a verified public production URL. No Production deployment has been made.

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
