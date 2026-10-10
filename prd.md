# Product Requirements — Environmental Impact Analyzer

## Product decision

The user expanded v2 beyond a process estimator to include user-confirmed product-input mappings, supported unit conversions, source-based mass diagnostics, a flat-BOM mass comparison, selected-process subtotals, and a combined score. The current implementation supports those bounded calculations using the pinned Carbonfact v1.1.0 published score rows and official EF 3.1 JRC normalisation/weighting values.

This remains **not a complete product footprint or validated BOM/LCA**. The selected-row total and single score cover exactly the rows chosen by the user. Missing source factors, unmodeled stages, and uncertain boundaries are not filled in or treated as zero.

## Goals

1. Make pinned published apparel/footwear process factors usable with their exact source units and geography.
2. Preserve all 16 EF 3.1 indicator values per process and display a transparent selected-row subtotal and single score where data is complete and compatible.
3. Let users organize up to 25 product inputs, view word-match factor suggestions, and choose a quantity mapping basis with explicit browser-local unit conversion.
4. Use source-reported `Input required (kg)` only for a user-selected feed-to-output conversion and a constrained mass-difference diagnostic; do not add unsupported waste-treatment impacts.
5. Keep product-input data local, avoid request-body logging, and avoid storing users or calculations.
6. Keep completeness, source, licensing, and boundary limitations accessible outside the clean input area.

## Non-goals and gates

- A complete or validated hierarchical/composition-complete product BOM, product-specific finished-output validation, stage-coverage percentage, allocation model, or whole-product life-cycle assessment. The optional flat-BOM mass comparison is an arithmetic diagnostic only.
- Automatic scientific mapping from materials to processes. Word overlap produces suggestions only; a user must confirm and validate each choice.
- Missing process stages, transport, distribution, waste treatment, or end-of-life factors where no compatible licensed source data are available.
- Ranking, product comparison, certification verification, or consumer-facing environmental claims.
- Acquiring, querying, reconstructing, or redistributing ecoinvent without lawful access and an explicit license permitting the intended use. No such license evidence or dataset is present; do not bypass the terms.
- Accounts, saved assessments, product catalogues, analytics, or long-lived user inputs.

## Supported source scope

The pinned dataset includes 302 rows from 11 documented source categories: spinning, knitting, weaving, dyeing, finishing, printing, textile assembly, footwear assembly, synthetic PU leather, natural rubber, and use phase. The UI exposes 12 factor groups because sneaker and women's-boots assembly use different functional units. See [`data-sources.md`](data-sources.md), [`v2-source-audit.md`](v2-source-audit.md), and the bundled [`SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md).

All 16 published EF 3.1 indicators remain distinct: ACD, ETF, FRU, FWE, GHG, HTC, HTN, IOR, LDU, MRU, OZD, PCO, PMA, SWE, TRE, and WTU.

## Primary user journey

1. Optionally record known product/component/process inputs with a name, positive quantity, and free-text unit; entries remain in browser memory.
2. Search or filter the pinned factor catalog by activity, family, and exact source geography. Factor suggestions from an input name are word matches that require user confirmation.
3. Review the factor activity, geography, source reference unit, and any input-required metadata.
4. Add a selected factor and choose a process quantity basis: manually entered source-reference quantity, declared input as process output, or declared input as process feed where the source reports a positive input requirement.
5. Validate conversions; unsupported or incompatible units block calculation rather than silently convert.
6. Calculate. The app returns a separate 16-indicator row for each process, displays the subtotal across only the selected rows, and computes the EF 3.1 single score only when all 16 indicators have compatible units.
7. Review source/method provenance, mapping basis, mass-difference diagnostics where supported, and missing-data limits; export an attributed CSV.

## Functional requirements

- **FR-01 — Pinned catalog:** Load the committed Carbonfact v1.1.0 score files at API startup. Fail startup if a required included file/column is missing or malformed. Do not fetch live factor data at runtime.
- **FR-02 — Factor discovery:** Provide process-family/geography filters and activity search. Preserve published geography codes, descriptors, and source factor IDs.
- **FR-03 — Input organizer:** Allow up to 25 user-declared input lines with name, positive finite amount, and free-text unit. Keep the fields visually clean.
- **FR-04 — Factor suggestions:** Propose candidate activities by text overlap only. Require explicit user selection; show that suggestions do not validate material/process equivalence.
- **FR-05 — Quantity basis and units:** Support manual reference-unit quantity, compatible declared-output conversion, and declared mass-feed conversion using a positive source `Input required (kg)` value. Reject unknown, compound, or dimensionally incompatible units.
- **FR-06 — Process indicators:** For factor value `F` and process quantity `Q` in the exact reference unit, compute `F × Q` for each of the 16 indicators. Preserve separate process rows and source values.
- **FR-07 — Mass diagnostics:** Scale source input requirement per selected reference quantity. If the process output reference unit is mass, show a nonnegative source-derived input/output mass difference where coherent. Optionally compare all supported flat input masses with a user-entered finished-product mass per functional unit, but only after the user confirms every declared line is a product component for that functional unit; reset confirmation when inputs change, show unconverted lines, and withhold full closure if any line is not mass-convertible. These diagnostics are arithmetic only; do not add waste-treatment impacts or label the result a complete BOM validation.
- **FR-08 — Selected-row total and score:** Sum each indicator across exactly the selected process rows only when units agree. Calculate `sum((indicator total / JRC global normalisation factor) × (EF weighting percentage / 100))` only with all 16 EF 3.1 categories and compatible category units. Show the normalisation factors/units, weights, and contributions; provide both JRC method links in the separate Method/source dialog and CSV. Do not treat a score as coverage.
- **FR-09 — Provenance/licensing:** Keep activity, geography, and reference unit with result rows. Provide source release/file, DQR where supplied, source license/attribution, background-inventory note, and JRC method citation in the Method/source dialog and CSV. Export these with source-derived results under applicable CC BY-SA 4.0 terms; do not add descriptive attribution blocks under results tables.
- **FR-10 — Privacy:** Persist no users, selected quantities, calculations, or history. Product-input names/amounts/units/associations, finished-product mass, and mapped quantities stay in browser memory and never enter API requests. Manually entered process quantities may be sent with factor IDs for stateless API calculation. Do not log request bodies; disable app access logging.
- **FR-11 — Missing-data handling:** Keep unmapped inputs visible as not calculated/not zero. Suppress incompatible totals or scores; never silently impute factors or missing stages.
- **FR-12 — CSV:** Export individual process-indicator rows, selected-row totals, score/method provenance where available, input-mapping status, flat-BOM mass diagnostic, and explicit not-calculated input rows.

## Calculation and units

Manual process quantity formula: `scaled indicator = published indicator factor × quantity expressed in the factor's exact reference unit`.

For a user-confirmed output mapping, convert the declared quantity only when input and reference units share a supported dimension. For a user-confirmed process-feed mapping: `output reference quantity = declared mass converted to kg / source Input required (kg) per reference unit`. These mappings are calculated locally in the browser using the already-loaded static catalog; no input or derived mapped quantity is sent to the API.

Process-level mass diagnostics use the published input requirement and the net output mass implied by a mass reference unit. The optional flat-BOM diagnostic runs only after the user confirms every declared line is a product component for the same functional unit, then sums declared lines that can be converted to kg and compares that mass with the user-entered finished-product mass; if any line is non-mass or ambiguous, full closure is unavailable. Adding or removing an input resets confirmation. These are arithmetic diagnostics, not a complete process/product mass balance, and they do not add an environmental burden for waste treatment. The cross-process score uses the global normalisation factors from the official JRC EF 3.1 workbook (three significant figures) and the JRC report's recommended all-category final weighting factors, including robustness and scaled to 100%. The distinct alternate set excluding three toxicity categories is not used. Explicit category-specific unit aliases bridge the source labels for cancer/non-cancer toxicity and water use to the JRC normalisation-unit labels; they are not generic unit conversions.

The API retains decimal values and calculations internally for manual process quantities. Browser-local conversions use guarded numeric operations and reject nonfinite/nonpositive values. UI display may round for readability; CSV preserves calculation values to JavaScript/JSON numeric precision.

## Data, claims, and uncertainty rules

- Only the pinned published score rows and source notes covered by the source's CC BY-SA 4.0 release are bundled.
- Carbonfact says its full Brightway/Activity Browser inventories are unavailable and use ecoinvent 3.12. Published scores may reflect those background contributions; this app does not include, query, or reconstruct the underlying inventory.
- Source geography is descriptive, not inferred. `WORLD`, `GLO`, and country rows remain distinct.
- `Input required (kg)` may support a user-selected quantity mapping and mass diagnostic; it does not itself provide upstream factor impacts or waste-treatment impacts.
- DQR values are source metadata, not a score or confidence estimate calculated by this app.
- WTU is m³ world-equivalent, not litres or physical water consumption.
- Missing product stages are outside the estimator boundary, not zero-impact stages.

## Non-functional requirements

- **Accessibility:** Keyboard-accessible factor search and dialogs, programmatic labels, visible focus, semantic result tables, screen-reader-readable units, reduced-motion support, and automated axe checks.
- **Performance:** Load the small bundled catalog once per app session; calculate from in-memory data and support browser CSV export.
- **Security/privacy:** Same-origin relative requests, no user-facing request logs, no account/auth state, no database or analytics.
- **Deployment:** Multi-stage Docker build serves the production React bundle and API from one origin; non-root runtime; health and Uvicorn access logging disabled.
- **Reproducibility:** Record the source snapshot and JRC score-method URL and values used by the front end.

## Acceptance criteria

- Exactly 302 bundled rows load; no inferred or placeholder factors are created.
- Each loaded factor contains 16 finite source indicator values and a reference unit.
- Manual scaling, input conversions, source-feed conversion, process/BOM mass diagnostics, and JRC unit aliases have unit tests.
- Cross-process aggregation rejects mixed units; the EF 3.1 score requires all 16 compatible categories.
- Product-input fields, finished-product mass, and locally derived mapped quantities never enter API requests.
- CSV includes source/method attribution and marks missing or unmapped input rows as not calculated, not zero.
- API, frontend, accessibility, lint, type-check, and production-build tests pass.
- UI clearly states that selected-row totals/scores do not establish a complete product footprint.

## Remaining complete-footprint work

A full product footprint requires a defined functional unit and system boundary; a hierarchical BOM with a declared finished output and mass-balance validation; compatible open factors for material, transport, waste treatment, and end-of-life stages; verified provider/license graphs; coverage and non-overlap rules; and independent product-level validation. The current subtotal must not be represented as complete until those gates pass. Ecoinvent can only be evaluated with lawful access and terms that allow the intended processing and redistribution.
