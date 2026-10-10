# Project Memory — Environmental Impact Analyzer

> **Purpose:** Durable shared context for future contributors and agents. Update this file when scope, methodology, architecture, data sources, or operating assumptions change.
> **Last updated:** 2026-10-10

## 1. One-paragraph brief

Environmental Impact Analyzer is a global-market apparel/footwear prototype with multiple separate indicators and no combined score. It reviews product facts; any future indicator values require deterministic, versioned calculations and documented open LCA data. No product subtype-only pilot or production geography has been confirmed. Do not repurpose PEFCR v3.1 single scores or representative-product comparisons for B2C communication.

## 2. Current repository state

- The repository began as a minimal README-only scaffold.
- The project now has a React/MUI web prototype and FastAPI service with deterministic extraction suggestions (including tested mass normalization), a stateless no-score assessment endpoint, a candidate-source registry endpoint, API/UI tests, and a CI workflow.
- The form/API accept optional user-provided component/material shares and supplier-stage evidence (process description, output/reference unit, geography, year, process-input/loss notes, waste-treatment notes, and text reference), validate basic bounds, and report checklist readiness. These inputs are unverified; references are not fetched, the app adds no assessment-record persistence, and no impact is calculated. Hosting/request-log retention has not been reviewed.
- Vitest includes axe-core checks for the initial and expanded evidence form, the methodology dialog, and the no-score result/mapping checklist; a static CSS/theme test checks declared non-decorative colors against the light canvas. An assertion verifies that the hero landscape and empty-state glyph stay `aria-hidden` and unfocusable. Browser review with temporary npm-packaged Chromium 153 on 2026-10-10 found no rendered axe violations or horizontal overflow at 1440, 390, 360, or 320 px; the landscape SVG rendered visibly and no browser-console errors appeared. The previous full browser run verified the sample assessment remained unscored (`score: null`, `scoring_enabled: false`) at desktop/mobile sizes, with reduced motion honored. Keyboard tab order, dialog Enter/Escape and focus restoration were checked previously. JSDOM's static contrast test is not a substitute for browser-rendered checks; human screen-reader/usability review and supported-browser/device verification remain open.
- Latest frontend verification (2026-10-10): `npm test` passed 10 tests and TypeScript/production build succeeded after the landscape refresh. API Ruff lint/format, strict Mypy, and 28 pytest cases passed on 2026-10-09; no API code changed in this visual update. `npm ci` reported 0 vulnerabilities. Prior `pip-audit` found none in `requirements-dev.txt`; a broader temporary-venv audit found old bootstrap `pip`/`setuptools` advisories, so README and API CI upgrade packaging tools to `pip>=26.2` and `setuptools>=83.0.0`; the full temporary-environment audit was clean after upgrading.
- There is still no database, trained model, product catalogue, licensed LCA factor set, or validated scoring dataset. Numeric environmental results remain intentionally unavailable.
- `task.md` tracks implementation work and explicitly marks what remains incomplete. Do not describe the prototype as production-ready or the scoring method as validated.

### Visual direction and current artwork (2026-10-10)

- The user's references set the requested broad visual language: poster-like flat color fields, layered mountains/hills, simplified cloud and sun shapes, and clean geometric silhouettes. The art is hand-authored, original inline SVG; do not trace or reproduce the reference compositions or stock watermark.
- MDN SVG guidance informed `viewBox` scaling. The hero landscape and small landscape glyph use `aria-hidden="true"` and `focusable="false"`; they are illustrative only, not result charts, routes, or factors. A visible hero caption says it is not a footprint result.
- W3C WCAG 2.2 contrast guidance shapes text/controls; `prefers-reduced-motion` remains respected. Human assistive-technology/usability review is not complete.
- `design.md` records the landscape direction, palette, accessibility guardrails, and source links. Do not add impact-value motifs or scores to the artwork.

## 3. Stable planning decisions

| Topic | Current decision |
|---|---|
| Initial audience | Consumers first; business use is future scope. |
| Initial category | Apparel and footwear, narrowed further by a data-coverage review. Food and electronics are not part of the first scoring model; a T-shirt-only pilot is not confirmed. |
| Target market | Global. Actual item/stage geographies must be evidence-based; do not infer or default production locations. |
| Indicator presentation | Multiple separate environmental indicators; no combined score or aggregate ranking. |
| Stack | The prototype uses React + TypeScript + Vite + themed MUI and Python + FastAPI. PostgreSQL is planned but not connected. See `architecture.md`. |
| Assessment style | Transparent screening estimate, not a certified or complete LCA. |
| NLP role | Extract candidate facts with evidence spans for user confirmation. Never generate an impact factor or score. |
| Initial numeric indicators | Climate and a specifically defined water-use indicator only when source method, unit, boundary, and review support them. A candidate EF 3.1 WTU factor is expressed in m³ world-equivalent, not physical litres; do not relabel or convert it to litres. Other attributes such as repairability/recycled content stay separate facts until justified. |
| Combined score | Explicitly out of scope: multiple separate indicators only, no combined score. Do not implement an aggregate score/ranking unless the user explicitly changes direction. Do not use PEFCR v3.1 single scores or representative-product comparisons in B2C communication. |
| Data policy | Open data only: every dataset and dependency used must have explicit, item-specific open terms for the intended use. Public access, a library “open” label, or a method/paper license is not enough. No non-open background data or paid-license fallback. Carbonfact published CC BY-SA outputs are a candidate only; its full ecoinvent inventories are excluded. |
| Privacy direction | No account or app-level assessment persistence in the prototype; raw descriptions are sent to the suggestion API only on request. Hosting/request-log retention is unreviewed; define retention/deletion and feedback consent before a public pilot. |
| UI direction | Calm and plain-language with original flat, poster-like landscape inline SVGs; vectors are explicitly decorative/non-data, and no artwork implies an impact value, process route, geography, or certification. Keep keyboard-visible focus, text contrast, reduced-motion support, and accessible word labels. Do not use a universal “eco-friendly” badge or color-only score labels. See `design.md`. |

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

1. Enforce the open-data-only rule: verify item-specific, versioned open terms for all source data and dependencies, including software integration and derived outputs, before importing. Exclude unclear/non-open content; no paid-license fallback.
2. Keep factor and reference versions immutable once used in an assessment; a changed source or method creates a new version.
3. Do not mix incompatible system boundaries, geographies, years, functional units, or impact methods without an explicit, reviewed mapping.
4. Preserve provenance through every normalization and calculation; do not make a model-produced citation look like a source.
5. Product marketing claims and certification names can be captured as claims/evidence, but are not proof of overall product performance.
6. If a separate indicator lacks suitable open data/method coverage, withhold that indicator rather than inventing a value.
7. Do not create a combined score or aggregate ranking; this is the selected product direction. Do not show PEFCR v3.1 single scores or representative-product comparisons in consumer communication.

## 6. Open-data source scan (2026-10-10)

This is a source/rights inventory, **not** legal review, LCA-method approval, or authorization to publish environmental results. The user requires open data only. No external dataset has been downloaded, imported, or calculated.

### Acceptance rule

Use only immutable, version-pinned data with explicit, item-specific open terms that permit the intended use. Record license scope, attribution, ShareAlike, downstream-user conditions, and all material dependencies. A public download, an “open source” description of a library, a paper's open license, or an old repository-wide submission policy does not prove rights to every data record. Do not access or silently depend on proprietary/unclear background databases. There is no separate commercial-license path; exclude a source if its open terms do not fit.

### Candidate: Carbonfact Open Source LCA Database v1.1.0

- The [Zenodo v1.1.0 record](https://zenodo.org/records/21102756) states CC BY-SA 4.0 and describes published process-level scores across 16 EF 3.1 / PEF indicators plus documented foreground parameters. The pinned release has 304 process datasets. The potential open-data scope is the specific published, licensed content only; **the complete LCI is not open/reproducible through this release**.
- The full Brightway/Activity Browser inventories are not distributed and are built on ecoinvent 3.12. Do not access, download, reconstruct, or describe these inventories as open. The current main repository guidance calls for same-screen linked attribution, retained notices/user-reuse information, change marking, and ShareAlike for adapted/recalculated dataset values served through a product. Confirm that the guidance and license scope apply to pinned v1.1.0 and that every obligation can be met. If not, exclude the dataset; do not seek a non-open license as a workaround.
- The v1.1.0 database uses a global energy mix; regional production/assembly variations are incomplete or planned. It is not a ready-made product footprint or a representative product distribution. Process-specific units, BOM/process-route mapping, geography, loss/waste treatment, end of life, boundaries, and method compatibility remain unresolved. EF 3.1 WTU is m³ world-equivalent, not litres of physical water.
- The current [main-branch changelog](https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/CHANGELOG.md) contains post-release changes and withdrawn full-inventory/contribution files; main is not the immutable v1.1.0 snapshot. Pin and cite the released version for any future review.
- Prototype status: in `GET /api/v1/sources` as an inactive candidate. The API/UI disclose the open license, ShareAlike/attribution duties, non-open inventory boundary, and four pending gates. The UI can prepare—but does not send—an open-license clarification email. No factor data are loaded; `license_review_status` and `method_review_status` remain `pending`; `active_for_scoring` remains `false`.

### Textile Exchange LCI Library

- [Textile Exchange](https://textileexchange.org/lci-library/) calls this library open source, but limits it to raw-material production and initial processing and says it does not verify or endorse included data.
- The library is an aggregator of existing records; its page does not establish a blanket open license for every included record. Treat each underlying dataset separately and exclude it until its exact license/rights allow the intended reuse and redistribution. It contains inventory inputs, not ready-made impact scores.

### Federal LCA Commons / USLCI

- [LCA Commons](https://www.lcacommons.gov/quick-start-guide) is a repository of different LCI/LCIA/method resources, not a uniform licensed dataset. Check each record's own metadata and terms.
- One example, [EPA USEEIO v1.1](https://lcacommons.gov/lca-collaboration/US_Environmental_Protection_Agency/USEEIO/datasets/Processes/31-33:%20Manufacturing/3116:%20Animal%20Slaughtering%20and%20Processing), explicitly states CC0 1.0; it is a U.S. economy-wide input-output model, not a global, process-specific apparel product inventory. The 2018 LCA Commons submission-guideline PDF is a draft and does not establish a blanket license for all existing repository content.

### Other reviewed references

- [Cotton Incorporated's 2016 LCA/LCI update](https://cottontoday.cottoninc.com/wp-content/uploads/2019/11/2016-LCA-Full-Report-Update.pdf) is publicly reachable, but no explicit open license for its data tables was verified in this scan. Do not reuse its values until item-level data rights are clear.
- The Apparel & Footwear PEFCR v3.1 PDF is a method reference, not a dataset license. Its EU-27/UK/EFTA boundary and B2C communication restrictions do not authorize underlying EF datasets or scores.
- EF 3.1 characterization-factor/database rights, the Carbonfact score dataset license, and ecoinvent rights are distinct. A method paper or free download does not grant reuse rights to its background inventory.

**Decision:** keep indicator calculations and environmental claims disabled until all gates close. Use only explicitly open data; non-open supplier/background data will not be introduced. Continue source-by-source provenance/licensing review and method/coverage work without importing data. See [`data-sources.md`](data-sources.md) for the detailed register.

## 7. Learning and reference links

These links are learning starting points and candidate data resources, not endorsements or automatic permission to reuse data. Recheck current documentation, course availability, versions, and licensing when implementation begins.

### LCA and environmental data

- [ecoinvent database](https://ecoinvent.org/database/) — **excluded** from the open-data-only source pool; its license page may be consulted only to document why its inventories are not being accessed or reconstructed.
- [openLCA software](https://www.openlca.org/) and [openLCA 2 manual](https://greendelta.github.io/openLCA2-manual/) — LCA modeling and workflow learning.
- [openLCA Nexus: ecoinvent](https://nexus.openlca.org/database/ecoinvent) — excluded from data use under the open-only policy; a listing is not an open license.
- [Federal LCA Commons quick-start guide](https://www.lcacommons.gov/quick-start-guide) — explains repository types; check item-level license metadata and coverage before considering any record.

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
- [data-sources.md](data-sources.md): open-data acceptance policy and item-specific source rights/coverage register.
- [architecture.md](architecture.md): service design, schema, API, security, and deployment proposal.
- [rules.md](rules.md): future coding, calculation, NLP, testing, and privacy standards.
- [design.md](design.md): user journeys, screens, content, visual direction, accessibility.
- [task.md](task.md): milestones and actionable backlog.
- [README.md](README.md): repository entry point.

If two docs conflict, prefer the explicit product safety/data guardrails here and in the PRD, then resolve the mismatch by editing the documents together. Do not silently change scoring, boundaries, or scope in implementation code.

## 9. Open decisions to carry forward

- Which apparel/footwear subtypes and pilot geography have enough comparable, licensed climate and water data?
- Who will review the LCA boundary, factor mapping, water indicator, and any separately proposed screening method before release?
- Which separate indicators and open datasets can support a global-market apparel/footwear service without defaulting production geography?
- What anonymous assessment retention duration and deletion behavior are appropriate?
- Which user-reported facts or product-level evidence can be verified, and by whom?
- What model (if any) is accurate, licensed, private, and fast enough for extraction?
