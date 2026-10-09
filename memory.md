# Project Memory — Environmental Impact Analyzer

> **Purpose:** Durable shared context for future contributors and agents. Update this file when scope, methodology, architecture, data sources, or operating assumptions change.
> **Last updated:** 2026-10-03

## 1. One-paragraph brief

Environmental Impact Analyzer is a consumer-facing apparel/footwear prototype that reviews product facts and may eventually show method-specific indicators. It uses NLP only to suggest facts from product text; deterministic, versioned calculations and documented LCA data are required for any result. No overall consumer-score method is approved. A distinct index would need independent LCA validation and legal/claims review; do not repurpose PEFCR v3.1 single scores or representative-product comparisons for B2C communication.

## 2. Current repository state

- The repository began as a minimal README-only scaffold.
- The project now has a React/MUI web prototype and FastAPI service with deterministic extraction suggestions (including tested mass normalization), a stateless no-score assessment endpoint, a candidate-source registry endpoint, API/UI tests, and a CI workflow.
- The form/API accept optional user-provided component/material shares and supplier-stage evidence (process description, output/reference unit, geography, year, process-input/loss notes, waste-treatment notes, and text reference), validate basic bounds, and report checklist readiness. These inputs are unverified; references are not fetched, the app adds no assessment-record persistence, and no impact is calculated. Hosting/request-log retention has not been reviewed.
- Vitest includes axe-core checks for the initial and expanded evidence form, the methodology dialog, and the no-score result/mapping checklist; a static CSS/theme test checks declared non-decorative colors against the light canvas. A browser review used temporary npm-packaged Chromium 153 after the Playwright CDN download failed: rendered axe checks passed on the initial form, expanded supplier-evidence section, extraction review, no-score result/mapping checklist, and stable methodology dialog. Desktop (1440 px) and mobile (390/360/320 px) layouts showed no horizontal overflow or runtime/request errors. Keyboard tab order, dialog Enter/Escape and focus restoration, plus reduced-motion behavior were checked. JSDOM's static contrast test is not a substitute for browser-rendered checks; human screen-reader/usability review and supported-browser/device verification remain open.
- Latest verification (2026-10-03): the API checks pass using the same repo-root commands as CI (Ruff lint/format, strict Mypy, and 28 pytest cases); the frontend has 9 passing tests and a successful TypeScript/production build. `npm audit` found 0 vulnerabilities, and `pip-audit` found none in `requirements-dev.txt`. A broader temporary-venv audit found old Debian-bootstrap `pip`/`setuptools` with advisories; README setup and API CI now upgrade packaging tools to `pip>=26.2` and `setuptools>=83.0.0`. The full temporary environment audit was clean after upgrading.
- There is still no database, trained model, product catalogue, licensed LCA factor set, or validated scoring dataset. Numeric environmental results remain intentionally unavailable.
- `task.md` tracks implementation work and explicitly marks what remains incomplete. Do not describe the prototype as production-ready or the scoring method as validated.

## 3. Stable planning decisions

| Topic | Current decision |
|---|---|
| Initial audience | Consumers first; business use is future scope. |
| Initial category | Apparel and footwear, narrowed further by a data-coverage review. Food and electronics are not part of the first scoring model. |
| Stack | The prototype uses React + TypeScript + Vite + themed MUI and Python + FastAPI. PostgreSQL is planned but not connected. See `architecture.md`. |
| Assessment style | Transparent screening estimate, not a certified or complete LCA. |
| NLP role | Extract candidate facts with evidence spans for user confirmation. Never generate an impact factor or score. |
| Initial numeric indicators | Climate and a specifically defined water-use indicator only when source method, unit, boundary, and review support them. A candidate EF 3.1 WTU factor is expressed in m³ world-equivalent, not physical litres; do not relabel or convert it to litres. Other attributes such as repairability/recycled content stay separate facts until justified. |
| Composite score | No approved overall-score formula. Withdraw the earlier percentile/equal-weight concept from MVP requirements. Default to no consumer score; any separate index needs independent LCA validation plus legal/claims approval. Do not use PEFCR v3.1 single scores or representative-product comparisons in B2C communication. |
| Data policy | Record source/version, license, boundary, geography, year, units, and transformation history. Publicly discoverable does not mean free to redistribute. |
| Privacy direction | No account or app-level assessment persistence in the prototype; raw descriptions are sent to the suggestion API only on request. Hosting/request-log retention is unreviewed; define retention/deletion and feedback consent before a public pilot. |
| UI direction | Calm, plain-language, accessible; do not use a universal “eco-friendly” badge or color-only score labels. |

## 4. Important terminology

- **Assessment:** One calculation snapshot for a product input and method version.
- **Impact indicator:** A measured or estimated environmental result with a defined unit, boundary, and method (for example, kg CO₂e per item).
- **Functional unit:** The quantified reference that makes results comparable. “One finished item” is only a proposed screening reference, not a PEFCR-compliant functional unit; PEFCR v3.1 defines category-specific function and service duration.
- **Life-cycle boundary:** Processes included in the estimate. The prototype’s proposed raw-material-to-factory-gate boundary is narrower than PEFCR v3.1’s cradle-to-grave scope; distribution, use, and end of life cannot be silently omitted from a PEFCR claim.
- **Evidence class:** Product-specific, user-provided, model-extracted, dataset estimate, or unknown/unsupported.
- **Reference distribution:** Reviewed, versioned population of comparable products used to calculate relative indicator ranks.
- **Confidence:** Qualitative evidence/data-quality label, separate from score; not a calibrated probability unless explicitly developed and validated as one.
- **No data:** Unknown or unsupported information. It is not zero impact.

## 5. Environmental-data guardrails

1. Check source license and terms for the intended use, including software integration and derived outputs, before importing data.
2. Keep factor and reference versions immutable once used in an assessment; a changed source or method creates a new version.
3. Do not mix incompatible system boundaries, geographies, years, functional units, or impact methods without an explicit, reviewed mapping.
4. Preserve provenance through every normalization and calculation; do not make a model-produced citation look like a source.
5. Product marketing claims and certification names can be captured as claims/evidence, but are not proof of overall product performance.
6. If suitable climate + water reference data is unavailable, release an indicator-only assessment rather than inventing a composite.
7. Do not show PEFCR v3.1 single scores or representative-product comparisons in consumer communication; the PEFCR report explicitly excludes those uses. Any alternative index needs independent LCA and legal/claims review.

## 6. Data-source scan (2026-10-03)

This is an initial source inventory, **not** a legal review, LCA-method approval, or authorization to publish derived scores. No external dataset has been imported into the application.

### Candidate: Carbonfact Open Source LCA Database for Footwear & Apparel

- The [Zenodo v1.1.0 record](https://zenodo.org/records/21102756) (published 2026-07-01) and its [pinned GitHub release tag](https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0) describe a process-level factor set with 304 apparel/footwear datasets and EF 3.1 impact indicators, including GHG (`kg CO₂e`) and WTU (`m³ world-equivalent`) per process-specific reference units. The v1.1.0 changelog added natural rubber, women’s boot and sneaker assembly, and synthetic PU leather datasets.
- The pinned [v1.1.0 README license section](https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/README.md#license) states CC BY-SA 4.0, permits commercial use subject to attribution and ShareAlike, strongly encourages same-screen attribution, and lists a separate commercial-license contact. The [current main README product-integration guidance](https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/README.md#if-you-integrate-this-database-into-a-product-or-platform) is more explicit: linked same-screen attribution, retaining notices and informing customers about reuse obligations, marking changes, and distributing adapted/recalculated values served through a product under CC BY-SA 4.0 or compatible terms. Since that guidance postdates the pinned v1.1.0 release, ask Carbonfact/counsel which requirements apply to that snapshot before integration. Carbonfact lists `science@carbonfact.com` for a separate commercial license if the open terms do not fit. The repository openly shares the pre-calculated impact-score CSVs, while full background inventories are not distributed; use/reproduction of full inventories requires separate ecoinvent 3.12 rights, which CC BY-SA does not grant. See [ecoinvent developer licensing](https://ecoinvent.org/licenses/) and [license FAQ](https://ecoinvent.org/faqs/). No source data have been imported.
- The [current main-branch changelog](https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/CHANGELOG.md) has post-release changes marked Unreleased: sneaker GLO electricity-scenario GHG moves from 1.014 to 1.905 kg CO₂e/pair (+88%, VN unchanged), and full inventory plus per-exchange contribution files were withdrawn while sharing terms are finalized. Therefore main is not equivalent to the pinned v1.1.0 snapshot; review and cite an immutable release, and re-check updates before any later use.
- It is not an end-to-end product footprint or a consumer comparison distribution. The pinned [process table](https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/README.md#whats-included), [spinning docs](https://github.com/carbonfact/lca-database-footwear-apparel/tree/v.1.1.0/datasets/spinning), and [textile assembly docs](https://github.com/carbonfact/lca-database-footwear-apparel/tree/v.1.1.0/datasets/textile-assembly) show process-specific reference units (for example, 1 kg yarn, 1 kg fabric, 1 kg dyed textile, 1 kg textile assembly, and shoe assembly per pair or kg); product subtype/material alone cannot choose a route. The source's [loss-handling guidance](https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/README.md#handling-material-losses) says `Input required (kg)` losses must be applied externally by scaling upstream input and adding waste treatment. Its [use-phase docs](https://github.com/carbonfact/lca-database-footwear-apparel/tree/v.1.1.0/datasets/use-phase) describe European consumer behavior; the v1.1.0 process-family table does not list an end-of-life stage. Source CSV headers vary in spelling/spacing, so any importer needs schema normalization and expert-reviewed loss/waste handling. A no-score mapping-readiness checklist reports product-input gaps but does not match factors or calculate impact. BOM/process-route mapping, stage geography, boundary choice, method compatibility, and reference-population design remain unresolved. WTU is not physical water volume in litres.
- Prototype status: listed by `GET /api/v1/sources` as a candidate only; the API and methodology dialog disclose the possible CC BY-SA route, required attribution links, ShareAlike condition, separate commercial-license contact, ecoinvent boundary, and four pending activation gates. The UI can create a version-specific email draft to Carbonfact but sends nothing. `POST /api/v1/assessments` returns a `prototype-no-score-v0.4` process-mapping checklist and accepts optional component/material shares and stage-specific process/loss/waste evidence; all remain unverified and are neither saved nor used to calculate impacts. `license_review_status` and `method_review_status` remain `pending`; `active_for_scoring` remains `false`.

### Method and raw-material references

- The European Commission’s [PEFCR announcement](https://environment.ec.europa.eu/news/new-eu-rules-measuring-environmental-impact-clothes-and-shoes-2025-06-25_en) confirms an apparel/footwear full-life-cycle method. The [PEFCR v3.1 Technical Secretariat report](https://www.carbonfact.com/hubfs/A&FW_PEFCR_v3.1.pdf) (hosted by Carbonfact; heed its disclaimer) specifies 13 subcategories, cradle-to-grave scope, and EU-27/UK/EFTA geographic validity. The report says valid to 2027-12-31 and explicitly disallows a single score for B2C communication and comparisons against its representative products. Do not reuse its single score/representative-product benchmarks for this consumer tool or claim PEFCR conformity.
- The [European Commission’s transitional guidance (14 July 2026)](https://green-forum.ec.europa.eu/news/transitional-guidance-limited-availability-ef-compliant-datasets-2026-07-14_en) says existing PEFCRs remain valid until EF 4.0 is implemented; the Commission’s [EF data guidance](https://green-forum.ec.europa.eu/green-business/environmental-footprint-methods/data-ef-methods_en) projects EF 4.0 for 2028. The older [PEFCR project FAQ](https://pefapparelandfootwear.eu/faq-glossary/) still says validity ended in 2025, so treat it as outdated and confirm the applicable current Commission rules before compliance work. The interim alternative-dataset hierarchy applies when no valid PEFCR/OEFSR exists; valid-PEFCR studies must follow Section 2.2 of the Commission guidance. This does not grant permission to use or redistribute any candidate dataset.
- The [EF 3.1 listing on openLCA Nexus](https://nexus.openlca.org/database/Environmental%20Footprint) says previous database-provider agreements expired 2025-12-31. EF database access/license, the Carbonfact CC BY-SA terms, and ecoinvent rights are separate reviews; do not infer that one grants the others.
- [Textile Exchange’s LCI Library](https://textileexchange.org/lci-library/) is a candidate source for raw-material and initial-processing inventory inputs. It is LCI (inventory) data rather than ready-made impact scores; Textile Exchange states that the library does not verify/endorse the included data and recommends users understand LCA methods and data limitations.
- The ecoinvent FAQ states that software/tool integration calls for a Developer license. Do not use ecoinvent factors in the application unless the correct license and derived-output terms are in place.

**Decision:** keep all numeric product scoring disabled. First resolve product categories, compatible boundaries and indicator units, source licenses, process coverage, reference-population design, and expert review. The source registry is informational only.

## 7. Learning and reference links

These links are learning starting points and candidate data resources, not endorsements or automatic permission to reuse data. Recheck current documentation, course availability, versions, and licensing when implementation begins.

### LCA and environmental data

- [ecoinvent database](https://ecoinvent.org/database/) — commercial/background LCI source to evaluate; review its [license offerings](https://ecoinvent.org/licenses/) before any software integration or redistribution.
- [openLCA software](https://www.openlca.org/) and [openLCA 2 manual](https://greendelta.github.io/openLCA2-manual/) — LCA modeling and workflow learning.
- [openLCA Nexus: ecoinvent](https://nexus.openlca.org/database/ecoinvent) — dataset listing and access information; do not assume a listed dataset is free to reuse.
- [Federal LCA Commons quick-start guide](https://www.lcacommons.gov/quick-start-guide) — explains repository data types and how additional analysis/modeling is needed to produce LCA results.

### NLP and product engineering

- [Hugging Face Transformers documentation](https://huggingface.co/docs/transformers) — transformer library docs. Check individual model licenses and suitability, not only the library docs.
- [Natural Language Processing with Transformers, Revised Edition](https://www.oreilly.com/library/view/natural-language-processing/9781098136789/) by Lewis Tunstall, Leandro von Werra, and Thomas Wolf — book/publisher page.
- [React Learn](https://react.dev/learn) — official React learning guide.
- [Express.js documentation](https://expressjs.com/) — alternative backend reference from the original project brief; the current architecture proposes FastAPI instead.
- [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) — proposed API framework guide.

### Machine learning foundations

- [Machine Learning Specialization — DeepLearning.AI / Stanford Online on Coursera](https://www.coursera.org/specializations/machine-learning-introduction) — course link referenced in the project brief; check current enrollment and availability.
- [Python for Data Science and Machine Learning Bootcamp — Udemy](https://www.udemy.com/python-for-data-science-and-machine-learning-bootcamp/) — course link referenced in the brief; check current syllabus and availability.

## 8. Document map and source of truth

- [prd.md](prd.md): product scope, score gates, functional/non-functional requirements, and release conditions.
- [architecture.md](architecture.md): service design, schema, API, security, and deployment proposal.
- [rules.md](rules.md): future coding, calculation, NLP, testing, and privacy standards.
- [design.md](design.md): user journeys, screens, content, visual direction, accessibility.
- [task.md](task.md): milestones and actionable backlog.
- [README.md](README.md): repository entry point.

If two docs conflict, prefer the explicit product safety/data guardrails here and in the PRD, then resolve the mismatch by editing the documents together. Do not silently change scoring, boundaries, or scope in implementation code.

## 9. Open decisions to carry forward

- Which apparel/footwear subtypes and pilot geography have enough comparable, licensed climate and water data?
- Who will review the LCA boundary, factor mapping, water indicator, and any separately proposed screening method before release?
- Is any independently developed consumer-facing index appropriate after legal/claims and LCA review, given the PEFCR v3.1 B2C single-score and representative-product restrictions?
- What anonymous assessment retention duration and deletion behavior are appropriate?
- Which user-reported facts or product-level evidence can be verified, and by whom?
- What model (if any) is accurate, licensed, private, and fast enough for extraction?
