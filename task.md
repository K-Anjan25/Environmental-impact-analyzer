# Tasks and Roadmap — Environmental Impact Analyzer

> **Status:** Initial implementation backlog
> **Last updated:** 2026-10-10
> **Repository state:** Stateless web/API prototype and informational source registry are in place. The user requires open data only: Carbonfact v1.1.0's published CC BY-SA 4.0 outputs are a candidate, while its undistributed ecoinvent-backed inventories and any unclear/non-open data are excluded. No source data have been imported; license-scope, method, coverage, privacy, validation, and release gates remain open; no numeric scoring is implemented.

## Status and priority legend

- `[ ]` Not started
- `[~]` In progress / partial
- `[x]` Complete for the stated prototype scope
- **P0** required before a credible MVP; **P1** important for MVP; **P2** post-MVP / scale-up.

## Project outcome

Deliver a global-market consumer assessment for apparel/footwear with multiple separate indicators and **no combined score**. Individual indicators remain unavailable until open-data rights, method, coverage, validation, privacy, and claims gates are resolved. A T-shirt-only pilot has not been confirmed; do not narrow product scope or default production geography without an explicit decision. An honest partial assessment is acceptable.

## Milestone 0 — Product and method validation (P0)

- [x] **M0-01 — Create planning baseline.** Add PRD, architecture, engineering rules, UX direction, roadmap, and project memory documents.
- [ ] **M0-02 — Confirm first pilot subcategories and coverage.** Keep the selected target market global. Select any pilot product subtypes and stage/geography coverage explicitly; a T-shirt-only pilot is not confirmed, and no production geography may be defaulted. Document excluded categories and coverage gaps.
- [~] **M0-03 — Inventory environmental data.** Open-data-only scan identifies Carbonfact v1.1.0 as a possible source of published CC BY-SA 4.0 process scores/foreground parameters—not an open full inventory because its ecoinvent 3.12 background inventories are not distributed. Textile Exchange's library is raw-material/initial-processing LCI with no blanket item-level license established; LCA Commons is a repository whose individual records need license checks (one USEEIO v1.1 example is CC0 but U.S.-specific and input-output). Publicly reachable Cotton Incorporated tables have no verified open data license. No data have been downloaded or imported. The existing form accepts optional component/material shares and supplier process/loss/waste notes; its no-score checklist does not match factors. Product/process mapping, method, indicators, geography, and reference population remain unresolved. See `data-sources.md`.
- [~] **M0-04 — Complete open-data rights review.** The registry/UI document only the published Carbonfact v1.1.0 CC BY-SA 4.0 content as a candidate, its attribution/ShareAlike and product-integration obligations, and the separate ecoinvent 3.12 background-inventory boundary. Do not use or reconstruct the unavailable background inventory, and do not seek a paid/commercial-license alternative. Verify that the pinned published outputs are within scope for the intended use, that same-screen attribution/change marking/downstream ShareAlike can be met, and whether current product guidance applies to v1.1.0. Verify every other source record and method/factor dataset individually; exclude unclear/non-open rights. No factors may be imported until rights, method, and coverage gates are approved.
- [~] **M0-05 — Review separate-indicator method.** The selected product direction has multiple separate indicators and no combined score. PEFCR v3.1 is a full cradle-to-grave EU-27/UK/EFTA reference; do not repurpose its B2C-prohibited single score or representative-product comparisons. The Commission’s July 2026 guidance says current PEFCRs remain valid until EF 4.0 is implemented and valid-PEFCR studies follow a separate data hierarchy. Confirm current applicability; define each indicator, functional unit, factor mapping, units, boundaries, geography/coverage, and uncertainty with expert review. Do not add a combined index unless the user explicitly changes product scope.
- [~] **M0-06 — Define privacy policy.** The app has no assessment-record persistence, but hosting/request-log retention has not been reviewed. Define retention/deletion, feedback consent, and user notices before a public pilot or storage; do not enter confidential supplier data in the prototype.
- [ ] **M0-07 — Establish reviewed examples.** Create an authorized validation set with expected ranges/eligibility decisions before implementing numeric calculations.

**Milestone exit:** A legal and method-reviewed path exists to produce supported separate indicators from open data. A combined score is outside current scope. Do not use PEFCR v3.1 single scores or representative-product comparisons in B2C. If an indicator lacks adequate data or a compatible reference, withhold that indicator rather than inventing a value.

## Milestone 1 — Application foundation (P0)

- [x] **M1-01 — Scaffold the web app.** React + TypeScript + Vite with a custom-themed MUI component baseline, responsive shell, and build/test scripts.
- [x] **M1-02 — Scaffold the API.** FastAPI service with typed request/response schemas, versioned routes, health endpoint, and OpenAPI docs.
- [~] **M1-03 — Add local environment.** Local setup instructions and API Dockerfile are present. Docker Compose and Postgres are deferred because the prototype has no persistence layer.
- [x] **M1-04 — Add CI quality gates.** Ruff lint/format, Mypy, Python API tests, frontend unit tests, TypeScript check, and production build run in CI.
- [ ] **M1-05 — Implement database migrations.** Product, assessment, indicators, extraction candidates, source/factor metadata, reference distribution, and feedback schema.
- [~] **M1-06 — Add privacy/security defaults.** Request schemas are bounded, descriptions are not persisted, and the browser uses a same-origin API proxy. Rate limits, deployment policy, and retention/deletion behavior remain open.

## Milestone 2 — Transparent assessment vertical slice (P0)

- [x] **M2-01 — Build typed assessment contracts.** Define and test category/subtype, attribute provenance, indicator, confidence, scope, and extraction schemas.
- [~] **M2-02 — Implement unit-safe domain primitives.** Product-mass normalization now supports mg, g, kg, oz, and lb with Decimal arithmetic; extraction rejects ambiguous thousands separators and out-of-range/non-item mass units. Environmental indicator units and factor compatibility still require an approved method/source.
- [ ] **M2-03 — Implement factor registry/import validation.** Store immutable source/factor versions, licenses, boundaries, regions, years, units, and data-quality metadata; produce import reports.
- [ ] **M2-04 — Implement deterministic indicator calculator.** Calculate only supported indicators; keep per-stage contributions and factor IDs; handle unknown values without zero-imputation.
- [~] **M2-05 — Implement eligibility/confidence logic.** The prototype safety gate withholds all scores because no approved consumer-score method, licensed product-level factors, or compatible reference set is configured. Full dynamic eligibility and confidence rules await M0 method/data review.
- [~] **M2-06 — Implement assessment API.** Stateless endpoint validates product facts, optional component/material shares, and supplier process/reference-unit/input-loss/waste-treatment evidence; it returns known facts and a Carbonfact v1.1.0 process-mapping checklist without calculating impact. Persistence and data-backed calculation await retention decisions, approved rights, and reviewed method.
- [~] **M2-07 — Add calculation regression suite.** Parser, mass-unit conversion, validation, partial-composition, component-BOM bounds, supplier-process evidence, mapping-readiness, missing-data, and no-score safety tests pass. Environmental calculation examples await an approved dataset and method; no impact values are fabricated in tests.

## Milestone 3 — Consumer experience and extraction (P1)

- [x] **M3-01 — Build assessment form.** Support apparel/footwear subtypes, optional facts, component/material BOM rows, supplier process evidence, unknown states, inline validation, and description entry. Added BOM/process fields remain unverified and are not persisted.
- [x] **M3-02 — Add extraction adapter.** Deterministic pattern suggestions return evidence spans. Transformer inference remains deferred pending accuracy, license, latency, and privacy evaluation.
- [x] **M3-03 — Build extraction review UI.** Users can select or dismiss suggestions with source spans, then edit applied values before assessment.
- [~] **M3-04 — Build results UI.** Prototype results show a clear no-score state, unavailable indicators, known facts, data gaps, limitations, and a collapsible product-to-process mapping checklist. Data-backed score/evidence presentation awaits reviewed sources.
- [ ] **M3-05 — Build feedback flow.** Capture structured issue type and optional comment without requiring identity; route feedback to a review process.
- [~] **M3-06 — Add accessibility and responsive testing.** Automated axe checks cover the initial form, expanded supplier-evidence inputs, methodology dialog, no-score result, and expanded mapping checklist; an additional assertion keeps decorative SVGs out of the accessibility tree and tab order. A static CSS/theme contrast test checks declared non-decorative text against the light page surface (axe color-contrast remains disabled in JSDOM). Browser review with temporary, npm-packaged Chromium 153 covered desktop at 1440 px and mobile at 390/360/320 px; rendered axe checks passed on the initial form, expanded evidence section, extraction review, no-score result/mapping checklist, and stable methodology dialog. The 2026-10-10 flat-landscape refresh passed rendered axe and no-overflow checks at 1440/390/360/320 px; the earlier full vector review also passed reduced-motion emulation and the sample no-score API flow with no runtime or request errors. Keyboard tab order, Enter/Escape dialog handling and focus restoration, and reduced-motion CSS were checked. Human screen-reader and usability reviews, plus supported-browser/device verification, remain outstanding.
- [x] **M3-07 — Implement original flat landscape/vector visual direction.** User references informed an original, poster-like inline-SVG mountain/lake landscape and compact no-score glyph, with an explicit non-data caption, responsive styling, and decorative SVG accessibility handling. The artwork does not encode factors, boundaries, eligibility, or results; visual principles and source links are documented in `design.md`.

## Milestone 4 — Comparison and pilot readiness (P1)

- [ ] **M4-01 — Implement product/reference search.** Expose only reviewed records and show how reference matching works.
- [ ] **M4-02 — Implement comparable-product checks.** Enforce same subtype, functional unit, boundary, and method version; prevent misleading rankings.
- [ ] **M4-03 — Implement compare view.** Align indicators and evidence in a responsive, accessible comparison layout.
- [~] **M4-04 — Publish methodology page.** The prototype dialog explains no-score rules, the candidate source and its four activation gates, open-license scope, PEFCR communication limits, and official transition guidance. Assessment results also show a non-scoring process-mapping readiness checklist. A dedicated, reviewed methodology page with the full method/version, uncertainty, exclusions, and evidence model remains to be published.
- [ ] **M4-05 — Run usability and expert review.** Confirm users understand that no combined score is provided by design and can interpret each separate indicator; reviewers can reproduce examples and verify open-data rights, methods, and limitations.
- [ ] **M4-06 — Deployment and operations checklist.** HTTPS, secrets, database backups, migration/rollback plan, health monitoring, error logging, rate limits, and incident contact.
- [ ] **M4-07 — Pilot release gate.** Release only after data rights, method review, result traceability, privacy behavior, and accessibility checks pass.

## Milestone 5 — Learn and extend (P2)

- [ ] **M5-01 — Analyze pilot quality.** Review coverage, extraction corrections, confidence, user comprehension, and failure patterns; publish limitations.
- [ ] **M5-02 — Improve reference data.** Expand subtypes/geographies only when factor quality and license allow; version all changes.
- [ ] **M5-03 — Evaluate alternatives.** Add alternatives only with comparable functional units, boundaries, source coverage, and a defensible matching approach.
- [ ] **M5-04 — Consider barcode/URL ingestion.** Conduct legal, terms-of-service, security, privacy, and data-quality review before implementation.
- [ ] **M5-05 — Consider accounts and business use.** Only after validating user demand, retention needs, and access-control requirements.
- [ ] **M5-06 — Evaluate additional categories.** Electronics or packaged food require separate category models, functional units, reference populations, and release gates; do not reuse apparel weights by default.

## Definition of MVP ready

- A user can enter an in-scope item, review extracted facts, and receive a traceable result or useful no-data explanation.
- No result silently fills unknown information with zero or relies on unapproved factors.
- Every numeric result states functional unit, boundary, sources, and methodology version.
- No combined score is in product scope. Only independently supportable, method-specific indicators may be shown after the open-data, LCA, validation, privacy, and legal/claims gates pass; PEFCR v3.1 single scores and representative-product comparisons are not used in B2C communication.
- Tests, accessibility review, privacy behavior, source licensing, operational checks, and plain-language understanding of indicator/no-score limitations have passed.
