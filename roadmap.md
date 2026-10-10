# Release Readiness and Version Roadmap

This roadmap separates release verification from the expanded v2 product-input work. The user has explicitly authorized selected-process mapping, unit conversion, mass diagnostics, cross-process subtotals, and an EF 3.1 single score; that authorization supersedes the earlier v2 exclusions. It does not establish product completeness or grant rights to proprietary inventory data.

## Current implementation: process estimator plus v2 subtotal prototype

### Delivered

- Carbonfact v1.1.0 published factors are bundled and pinned under CC BY-SA 4.0: 302 source rows, 12 selectable factor groups, and 16 EF 3.1 indicators.
- Each factor row scales in its own reference unit, and the app preserves 16 separate indicators per process. The browser can subtotal the selected rows and calculate a JRC EF 3.1 single score; neither establishes a complete product footprint.
- Attribution, license URL, source geography, available DQR/input metadata, CSV export, the JRC score method, and the ecoinvent-background limitation are in the product.
- CI run `38060391993` passed API tests (11), frontend/accessibility/export tests (10), Ruff, formatting, mypy, TypeScript, and the Vite build on `f3db1d1`. The next-version geography-filter update on `0775d5d` raises the frontend suite to 11; CI run `38061673637` passed API, web, and both-container checks.

### Remaining v1 release checks

1. **Container acceptance:** GitHub CI run `38052549592` passed API/web checks and built/smoke-tested both container images, including health, docs, all six policy/source pages, the catalog, and a 16-indicator estimate. Frontend tests cover the separate-indicator UI, CSV formatting, and the Download CSV action.
2. **Vercel Preview:** GitHub reports deployment success for the geography-filter app commit `0775d5d`. The operator's build log for `3bb77c0` shows a repository-root build, image push, and deployment completion in the Beta Container Runtime (`iad1`, 300-second timeout), with `PORT=8000` in the image. The Preview is SSO-protected, so external route checks cannot inspect app content.
3. **Authenticated Preview acceptance:** the operator confirmed the authenticated Preview passed `/`, `/healthz`, `/api/docs`, `/api/v1/factors?limit=1`, factor search/selection, calculation, CSV download, and all six policy/source pages on `ccb75f9`. This is user-reported verification; the assistant's `/healthz` probe is redirected to Vercel SSO. It predates the expanded mapping, selected-row subtotal, and EF 3.1 score changes in the current workspace; those need authenticated Preview verification after a deployment. No exact working Preview URL was supplied. Vercel's build log says OCI output ignores Docker `HEALTHCHECK`; the Vercel Dockerfile no longer relies on that instruction, and `/healthz` is HTTP-smoke-tested in CI.
4. **Legal and product release readiness:** the operator name, linked contact page, and India-law/India-venue clause are now in `PRIVACY.md` and `TERMS.md` per the operator's direction. Confirm the name is the correct service identity, monitor the contact channel for privacy/service requests, review the law/venue and notice with appropriate counsel, record the actual effective date at launch, and inspect Vercel's live logging/retention and deployment-protection settings. The root MIT license applies only to original project code/documentation; the Carbonfact dataset and derived results retain CC BY-SA 4.0 obligations.
5. **Limited beta cut:** the operator selected Vercel's Beta Container Runtime only for a no-SLA early beta, with no custom domain. The candidate project default alias `environmentalimpactanalyzer.vercel.app` still returns Vercel 404 in an unauthenticated probe, although the operator reports the Preview alias they use works. Record that exact working URL and verify/attach a stable default alias in Vercel before advertising it. Production is **not launched** and no PR/merge has been made. Once the URL/legal/configuration details are confirmed, prepare the release PR from this branch, merge to `main`, and verify the production alias and repeat health/API/calculation/CSV checks. Record the release version/date and rollback target before announcement.

### Vercel deployment attempt log

The first Vercel build output cloned `main` at `102be24` and reported no deployable output; that commit predates the implementation. The feature-branch Preview for `04eb280` later returned Vercel's `404 NOT_FOUND`, after which root `vercel.json` pinned the `container` framework preset. The operator's build log for `3bb77c0` shows Vercel cloned the correct feature branch, built and pushed the container image, and reported “Deployment completed.” It confirms the image's `PORT=8000`, container runtime, `iad1` region, and 300-second timeout; Buildah also warned that OCI output ignores Docker `HEALTHCHECK`, now removed from `Dockerfile.vercel`. Commit `ccb75f9` has successful CI and Vercel status; the newer geography-filter app commit `0775d5d` also has successful CI and Vercel deployment. The operator reports the authenticated Preview acceptance checks passed on `ccb75f9`; the new geography filter still needs an operator check. The Preview URL is SSO-protected from external probes. The new v2 app-code commit `2bf2130` passed CI and Vercel reports deployment success; the operator should still verify the geography filter and v2 input worksheet in the authenticated Preview. `environmentalimpactanalyzer.vercel.app` still returned 404 unauthenticated; it is not yet verified as the stable Production alias. No Production deployment has been made.

### Local container acceptance flow

From the repository root:

```bash
docker compose up --build
```

The user previously supplied output showing `Up ... (healthy)` and successful FastAPI startup. Docker/Compose is not installed in the current sandbox, so the image smoke test cannot be rerun here; a browser/API/CSV smoke test for the expanded build remains unverified. Where Docker is available, verify these routes (use `curl.exe` in Windows PowerShell):

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

## Expanded v2 work and remaining gates

### Implemented in the current workspace

- **Product-input organizer:** up to 25 browser-local input lines. The input fields remain visually clean; detailed method and privacy notes stay in the disclosure dialog.
- **User-confirmed factor suggestions:** token overlap proposes published activities, but the user confirms the selection and chooses its quantity basis. A word match does not validate the mapping.
- **Unit/yield conversion:** supported same-dimension conversions for common mass, selected area/time, pair, and count units; source-reported `Input required (kg)` can convert a declared feed mass to factor output reference units. Unsupported dimensions are rejected.
- **Material-flow and flat-BOM diagnostics:** source input mass, output mass, and mass difference are displayed where reference units support that arithmetic. An optional flat-BOM mass check runs only after the user confirms every declared line is a product component for the same functional unit; adding/removing an input resets confirmation. It compares supported declared inputs with user-entered finished-product mass and leaves unconvertible lines explicit. These are arithmetic diagnostics only; waste-treatment impacts are not included.
- **Cross-process subtotal and score:** separate process/indicator rows are preserved; compatible selected rows are summed per indicator and weighted to an EF 3.1 single score using global normalisation factors from the official JRC workbook and the report's recommended all-category final weights (including robustness) from the JRC EF weighting report. The 16 weight percentages sum to 100%; the UI and CSV expose factor units, normalized totals, weights, contributions, and both method citations.
- **Privacy:** input names, amounts, units, mappings, and derived quantities remain in the browser. Mapped calculations run locally; only manually entered reference-unit quantities are sent to the estimate API.

### Not yet a complete product footprint

A flat worksheet, arithmetic input-mass comparison, and selected-row score do not validate a hierarchical/composition-complete BOM or establish a complete product boundary. Missing gates include: define and verify a product functional unit and stage boundary; validate component identity and hierarchy beyond the flat mass comparison; assess stage coverage and non-overlap; integrate suitable licensed upstream, transport, waste-treatment, and end-of-life factors; and add defensible product-specific coverage rules. The selected-row subtotal is never presented as complete coverage.

### Data and licensing gates

The source audit in [v2-source-audit.md](v2-source-audit.md) still clears no new factor source. The USDA field-crop version-2 archive is a possible open-LCI lead, but its provider graph and compatible open characterization method are unaudited; the separate ecoinvent-linked crosswalk is excluded as supplied. No new factor values were integrated.

No ecoinvent license evidence or authorized dataset is present. Do not acquire, query, reconstruct, bundle, or redistribute it unless the exact license permits the intended access, processing, and redistribution. Do not bypass the terms or fabricate a proprietary inventory. Carbonfact's existing published scores may reflect ecoinvent-based background contributions, but the underlying inventory is not included or reconstructed.

### Release checks

The current workspace changes have local frontend/API test and build coverage, but no PR, merge, or deployment was made for this expanded increment. The previous user-reported authenticated Preview checks were on an older code version; verify the latest branch in an authenticated Preview after deployment. Vercel Container Runtime remains a no-SLA beta, not production-grade. Confirm an actual working alias before advertising. No Production launch is authorized.

See [v2-discovery.md](v2-discovery.md), [v2-source-audit.md](v2-source-audit.md), and [task.md](task.md) for scope, source findings, and test status.

## Version flow

`Product boundary → source/license audit → user-confirmed mapping → unit and mass diagnostics → selected-row subtotals/EF score → completeness and non-overlap gates → API/UI/export tests → container smoke test → authenticated Vercel Preview → release and rollback record`
