# Tasks and Roadmap — Environmental Impact Analyzer

> **Status:** Initial implementation backlog
> **Last updated:** 2026-10-10
> **Repository state:** Stateless web/API prototype and informational candidate-source registry are in place. A potential CC BY-SA 4.0 reuse path and a separate commercial-license fallback are documented, but release-specific rights and methodology approval remain pending; no factor data, persistence, or numeric scoring is implemented.

## Status and priority legend

- `[ ]` Not started
- `[~]` In progress / partial
- `[x]` Complete for the stated prototype scope
- **P0** required before a credible MVP; **P1** important for MVP; **P2** post-MVP / scale-up.

## Project outcome

Deliver a consumer-facing apparel/footwear assessment that makes evidence and limitations clear. No overall consumer score is enabled by default; any separate index requires suitable data, independent LCA validation, legal/claims approval, and a defined comparison policy. An honest partial assessment is acceptable.

## Milestone 0 — Product and method validation (P0)

- [x] **M0-01 — Create planning baseline.** Add PRD, architecture, engineering rules, UX direction, roadmap, and project memory documents.
- [ ] **M0-02 — Confirm first pilot subcategories.** Select a narrow set of garment/footwear types and pilot geography; document excluded categories.
- [~] **M0-03 — Inventory environmental data.** Initial scan identifies Carbonfact process factors, Textile Exchange raw-material LCI data, and PEFCR as a method reference. Carbonfact’s v1.1.0 snapshot has 304 process datasets; the current changelog records post-release score/file changes. The form now accepts optional component/material shares and supplier process, output/reference-unit, input/loss, and waste-treatment notes; the no-score response reports mapping status for composition, BOM, route, factor reference units, geography, losses/waste, use phase, and end of life. Entries remain unverified. Actual factor matching, method choice, and a suitable reference population remain unresolved.
- [~] **M0-04 — Complete data/license review.** The source registry/UI now document the pinned v1.1.0 CC BY-SA 4.0 route (attribution, ShareAlike, current same-screen product guidance), the publisher’s separate commercial-license contact, and the distinction between public pre-calculated scores and ecoinvent-backed full inventories. The UI lists four pending activation gates and can prepare—but does not send—a version-specific email inquiry. Still confirm with Carbonfact/counsel whether current product-integration guidance applies to pinned v1.1.0, decide whether this product can release adapted/recalculated outputs under CC BY-SA or needs commercial terms, and review storage/redistribution and version/update policy. Separately verify EF 3.1 database-provider EULAs (the openLCA listing says earlier agreements expired 2025-12-31); Commission transition guidance is not a data license. No factors may be imported until approved.
- [~] **M0-05 — Review assessment method.** PEFCR v3.1 is a full cradle-to-grave EU-27/UK/EFTA reference, not the proposed factory-gate screen; its report disallows a single score in B2C communication and comparisons against its representative products. The Commission’s July 2026 guidance says current PEFCRs remain valid until EF 4.0 is implemented and valid-PEFCR studies follow a separate data hierarchy. Confirm current applicability; obtain expert/legal review for any distinct screening index; define functional unit, factor mapping, water indicator/unit, boundaries, coverage, uncertainty, and comparison policy.
- [~] **M0-06 — Define privacy policy.** The app has no assessment-record persistence, but hosting/request-log retention has not been reviewed. Define retention/deletion, feedback consent, and user notices before a public pilot or storage; do not enter confidential supplier data in the prototype.
- [ ] **M0-07 — Establish reviewed examples.** Create an authorized validation set with expected ranges/eligibility decisions before implementing numeric calculations.

**Milestone exit:** A legal and method-reviewed path exists to produce supported indicators. Any overall consumer score needs a separate, approved method and communication policy; do not use PEFCR v3.1 single scores or representative-product comparisons in B2C. If no adequate reference distribution exists, release indicator-only results.

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
- [~] **M4-04 — Publish methodology page.** The prototype dialog explains no-score rules, the candidate source and its four activation gates, license options, PEFCR communication limits, and official transition guidance. Assessment results also show a non-scoring process-mapping readiness checklist. A dedicated, reviewed methodology page with the full method/version, uncertainty, exclusions, and evidence model remains to be published.
- [ ] **M4-05 — Run usability and expert review.** Confirm users understand no-score states and indicator limitations; reviewers can reproduce examples; obtain legal/claims and LCA review for any separately proposed consumer index.
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
- No overall consumer score is enabled by default. Any independent index passes the PRD’s LCA, validation, and legal/claims gates; PEFCR v3.1 single scores and representative-product comparisons are not used in B2C communication.
- Tests, accessibility review, privacy behavior, source licensing, operational checks, and plain-language understanding of indicator/no-score limitations have passed.
