# Release Readiness and Version Roadmap

This roadmap separates **v1 release verification** from future discovery. A feature outside v1 is not a hidden v1 blocker, and a roadmap item is not permission to relax the current product and data constraints.

## Current release: v1 process estimator

### Delivered

- Carbonfact v1.1.0 published factors are bundled and pinned under CC BY-SA 4.0: 302 source rows, 12 selectable factor groups, and 16 EF 3.1 indicators.
- A quantity scales one selected factor in that factor's reference unit. Every process and indicator remains separate; there is no product total or combined score.
- Attribution, license URL, source geography, available DQR/input metadata, CSV export, and the ecoinvent-background limitation are in the product.
- CI run `38060391993` passed API tests (11), frontend/accessibility/export tests (10), Ruff, formatting, mypy, TypeScript, and the Vite build on `f3db1d1`. The next-version geography-filter update on `0775d5d` raises the frontend suite to 11; CI run `38061673637` passed API, web, and both-container checks.

### Remaining v1 release checks

1. **Container acceptance:** GitHub CI run `38052549592` passed API/web checks and built/smoke-tested both container images, including health, docs, all six policy/source pages, the catalog, and a 16-indicator estimate. Frontend tests cover the separate-indicator UI, CSV formatting, and the Download CSV action.
2. **Vercel Preview:** GitHub reports deployment success for the geography-filter app commit `0775d5d`. The operator's build log for `3bb77c0` shows a repository-root build, image push, and deployment completion in the Beta Container Runtime (`iad1`, 300-second timeout), with `PORT=8000` in the image. The Preview is SSO-protected, so external route checks cannot inspect app content.
3. **Authenticated Preview acceptance:** the operator confirmed the authenticated Preview passed `/`, `/healthz`, `/api/docs`, `/api/v1/factors?limit=1`, factor search/selection, calculation, CSV download, and all six policy/source pages on `ccb75f9`. This is user-reported verification; the assistant's `/healthz` probe is redirected to Vercel SSO. The new geography-filter change on `0775d5d` needs a quick authenticated Preview check by the operator. Vercel's build log says OCI output ignores Docker `HEALTHCHECK`; the Vercel Dockerfile no longer relies on that instruction, and `/healthz` is HTTP-smoke-tested in CI.
4. **Legal and product release readiness:** the operator name, linked contact page, and India-law/India-venue clause are now in `PRIVACY.md` and `TERMS.md` per the operator's direction. Confirm the name is the correct service identity, monitor the contact channel for privacy/service requests, review the law/venue and notice with appropriate counsel, record the actual effective date at launch, and inspect Vercel's live logging/retention and deployment-protection settings. The root MIT license applies only to original project code/documentation; the Carbonfact dataset and derived results retain CC BY-SA 4.0 obligations.
5. **Limited beta cut:** the operator selected Vercel's Beta Container Runtime only for a no-SLA early beta, with no custom domain. The candidate project default alias `environmentalimpactanalyzer.vercel.app` still returns Vercel 404 in an unauthenticated probe, although the operator reports the Preview alias they use works. Record that exact working URL and verify/attach a stable default alias in Vercel before advertising it. Production is **not launched** and no PR/merge has been made. Once the URL/legal/configuration details are confirmed, prepare the release PR from this branch, merge to `main`, and verify the production alias and repeat health/API/calculation/CSV checks. Record the release version/date and rollback target before announcement.

### Vercel deployment attempt log

The first Vercel build output cloned `main` at `102be24` and reported no deployable output; that commit predates the implementation. The feature-branch Preview for `04eb280` later returned Vercel's `404 NOT_FOUND`, after which root `vercel.json` pinned the `container` framework preset. The operator's build log for `3bb77c0` shows Vercel cloned the correct feature branch, built and pushed the container image, and reported “Deployment completed.” It confirms the image's `PORT=8000`, container runtime, `iad1` region, and 300-second timeout; Buildah also warned that OCI output ignores Docker `HEALTHCHECK`, now removed from `Dockerfile.vercel`. Commit `ccb75f9` has successful CI and Vercel status; the newer geography-filter app commit `0775d5d` also has successful CI and Vercel deployment. The operator reports the authenticated Preview acceptance checks passed on `ccb75f9`; the new geography filter still needs an operator check. The Preview URL is SSO-protected from external probes. The new v2 app-code commit `2bf2130` passed CI and Vercel reports deployment success; the operator should still verify the geography filter and v2 input worksheet in the authenticated Preview. `environmentalimpactanalyzer.vercel.app` still returned 404 unauthenticated; it is not yet verified as the stable Production alias. No Production deployment has been made.

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

- **First usability increment (implemented on this branch):** an explicit source-geography filter alongside process-family filtering. It preserves published geography codes and counts, keeps missing geography unstated, adds no inferred default, and never aggregates results.
- Add a process family only when the source is openly licensed, pinned to a version/commit, attributable, and has a clear process boundary, reference unit, geography, and compatible EF 3.1 indicators.
- Reconcile source row counts and optional metadata; preserve original scores and document transformations.
- Improve search, CSV usability, and accessibility without adding defaults, missing-stage imputation, cross-process sums, or a combined score.

### v2 discovery — product inputs without an aggregate score

This is a staged discovery path, not a committed full-product LCA. The first v2 increment is implemented as a client-only product-input organizer: users can enter known input labels, quantities, and free-text units, then manually associate an input with a selected process row as context. The declaration is not a BOM validation or calculation input; process reference quantities remain separate, and every indicator/process result stays separate. See [v2-discovery.md](v2-discovery.md).

1. **Use case, input fields, and boundary (implemented):** define the apparel/footwear input organizer and its client-only data contract. An optional manual association never copies or converts the declared input amount into the process-factor quantity. Unassociated lines stay explicit in CSV as not calculated, not zero.
2. **Open-source/license audit (in progress):** a preliminary screen is recorded in [v2-source-audit.md](v2-source-audit.md). The USDA LCA Commons field-crop version-2 archive is a possible open-LCI lead, not a factor-ready source; its complete provider graph and compatible open characterization method remain unverified. Exclude the separate version-1 ecoinvent crosswalk. No new factor data is integrated; record exact license, version, attribution, geography, time coverage, reference unit, and boundary before any integration.
3. **Factor mapping (gated):** map factors to declared process outputs only where the reference unit and system boundary genuinely match. The current manual association is context-only, not a scientific mapping. Missing compositions, stage inputs, loss rates, or geography must stay explicit; do not infer them.
4. Add loss or waste-treatment factors only when openly licensed, compatible factors and an explicit mass-balance method are available. Display those rows separately; do not silently apply `Input required (kg)` as an upstream burden.
5. Use only openly licensed, bundled data. Do not obtain, bundle, query, or reconstruct ecoinvent or another non-open inventory. If no suitable open factor exists, leave that process unavailable rather than fabricate a result.
6. Test any future unit conversion, factor lineage, mass balance, missing-data behavior, licensing, accessibility, and exports before release.

### Hard boundary under the current authorization

Cross-stage totals, a complete product footprint, and any combined environmental score remain out of scope. The v2 worksheet may organize user-declared inputs and show manual context links to selected process rows, but it does not validate the BOM, derive process quantities, sum results, or imply that selected rows form a complete LCA. Reconsidering that boundary would require a separate, explicit product-scope decision and a defensible open-data method; it must not happen as an implementation detail.

## Version flow

`Use case and boundary → open-source/license audit → reference-unit and geography reconciliation → calculation/schema tests → accessible UI and attributed export → container smoke test → Vercel preview validation → release record and rollback plan`
