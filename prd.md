# Product Requirements — Environmental Impact Analyzer

## Product decision

The requested global-market apparel/footwear product footprint cannot be derived responsibly from the open published score files alone. The shipped product is a **process-factor estimator** using 302 openly licensed Carbonfact v1.1.0 records. It is useful for inspecting separate activity impacts, but it does not claim to calculate a complete product LCA.

The required direction remains: apparel and footwear context, multiple distinct indicators, **no combined score**, and open data only. The estimator scales a selected source factor by a user-entered quantity in the factor's stated reference unit. Each selected process stays separate; there is no cross-stage sum, ranking, or product total.

## Goals

1. Make published open process factors immediately usable without external data approval or hidden license assumptions.
2. Show factor activity, source geography, reference unit, data-quality ratings, input-required metadata, source version, and license attribution with results.
3. Calculate each of the 16 EF 3.1 impact indicators independently and transparently.
4. Keep application behavior stateless and avoid retaining user-entered calculation quantities.
5. Keep scope limits visible so process results cannot be mistaken for whole-product footprints.

## Non-goals

- Complete product or cradle-to-gate/cradle-to-grave life-cycle assessment.
- Inferring a garment or shoe bill of materials, material composition, stage route, country, losses, or waste treatment.
- Adding source factors across process stages or representing selected rows as a product total.
- A combined score, ranking, benchmark, product comparison, certification verification, or consumer-facing environmental claim.
- Reconstructing Carbonfact's full inventory model, acquiring ecoinvent, or introducing any non-open dependency.
- Accounts, saved assessments, product catalogues, analytics, or long-lived user inputs.

## Supported source scope

The pinned data snapshot includes 302 rows from 11 documented source categories: spinning, knitting, weaving, dyeing, finishing, printing, textile assembly, footwear assembly, synthetic PU leather, natural rubber, and use phase. The UI exposes 12 factor groups because sneaker and women's-boots assembly use different functional units. See [`data-sources.md`](data-sources.md) and the bundled [`SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md) for row counts, license, background dependency, and exclusions.

All published EF 3.1 indicators are available as separate rows: acidification (ACD), freshwater ecotoxicity (ETF), fossil resource use (FRU), freshwater eutrophication (FWE), climate change (GHG), human toxicity cancer (HTC), human toxicity non-cancer (HTN), ionising radiation (IOR), land use (LDU), mineral resource use (MRU), ozone depletion (OZD), photochemical ozone formation (PCO), particulate matter (PMA), marine eutrophication (SWE), terrestrial eutrophication (TRE), and water use (WTU).

## Primary user journey

1. Filter the pinned catalog by process family and search activity, material, or geography.
2. Select an exact source row and read its reference unit and geography.
3. Enter a positive quantity in units of that reference unit. Add up to 25 distinct factor rows.
4. Calculate. The app returns a separate 16-indicator table for each row, including the source factor, scaled result, source DQR values where available, and source-reported input requirement where available.
5. Review the on-screen attribution/license and download a CSV that preserves one row per process and indicator.

## Functional requirements

- **FR-01 — Pinned catalog:** Load the committed Carbonfact v1.1.0 score files at API startup. Fail startup if a required included source file or indicator column is missing, nonnumeric, or malformed. Do not fetch live factor data at runtime.
- **FR-02 — Factor discovery:** Provide process-family and explicit source-geography filters plus text search over activity, geography, and source descriptor. Show published geography labels/codes and result counts; keep missing geography unstated and never infer it. Preserve the exact source descriptor as the stable factor ID.
- **FR-03 — Quantity input:** Require a finite positive quantity for each selected factor. Display the exact source reference unit alongside the input. Limit a request to 25 process rows.
- **FR-04 — Calculation:** For factor value `F` and user quantity `Q`, compute `F × Q` for each indicator. Use Decimal arithmetic internally. Return the source factor value and scaled indicator result with the numerator units and source reference unit.
- **FR-05 — Separate indicators and processes:** Return all 16 indicators separately for each selected factor. Never return cross-indicator scores, cross-process totals, product totals, or ranks.
- **FR-06 — Provenance and uncertainty metadata:** Show source activity, geography descriptor, version, source row/file, DQR fields as supplied, and Input required (kg) per reference unit if available. Missing DQR values remain absent.
- **FR-07 — Boundaries:** State that selected-process outputs are not whole-product footprints. Do not apply Input required (kg) to upstream factors or add waste treatment. State that WTU is m³ world-equivalent, not physical litres.
- **FR-08 — Attribution and licensing:** Display linked CC BY-SA 4.0 attribution beside results. Mark quantity scaling as the transformation. Include attribution, source URL, result license and license URL, and background-dependency note in CSV exports.
- **FR-09 — Privacy:** Store no users, selected quantities, calculations, or history. Do not log request bodies. Disable application-server access logging in the production container.
- **FR-10 — Error handling:** Validate IDs and quantities; return clear client errors for invalid requests and non-sensitive server errors for failures. Never convert an unknown or missing factor to zero.

## Calculation and units

The source provides an impact score for a particular activity and functional/reference unit. The quantity entered by the user must be expressed in units of that exact reference unit. A quantity of `0.18` against `1 kg yarn` means 0.18 kg yarn-equivalent output for that selected activity. It is not an item mass unless the source reference unit and user quantity genuinely correspond.

The API retains decimal source values and calculations internally. Values are rendered for display at a readable precision; CSV export retains the API value to JSON-number precision. Factor and result units are shown in each indicator row.

## Data, claims, and uncertainty rules

- Only the pinned score outputs and process-family notes covered by the source's CC BY-SA 4.0 release are bundled.
- The source says its full Brightway/Activity Browser inventories are unavailable and built on ecoinvent 3.12. Published scores may reflect those background contributions; this app does not include/query/reconstruct the underlying inventory.
- Source geography is descriptive, not inferred. `WORLD`, `GLO`, and country rows must remain distinct.
- The source Input required (kg) field is reported as metadata. Loss, upstream input, and waste-treatment calculations are not applied.
- DQR values are data-quality metadata, not a score or confidence estimate calculated by this app.
- WTU cannot be described as litres or physical water consumption.
- Missing product stages are outside the estimator boundary, not zero-impact stages.

## Non-functional requirements

- **Accessibility:** Keyboard-accessible factor search and forms, programmatic labels, visible focus, semantic result tables, screen-reader-readable units, reduced-motion support, and automated axe checks.
- **Performance:** Load the small bundled catalog once per app session; calculate a request synchronously from in-memory data; support browser CSV export.
- **Security/privacy:** Same-origin relative requests, no CORS allowlist, no user-facing request logs, no account/auth state, no database or analytics.
- **Deployment:** Multi-stage Docker build serves the production React bundle and API from one origin; non-root runtime; health check and Uvicorn access logging disabled.
- **Reproducibility:** Version and commit of the source snapshot are recorded with the bundled data and in source responses.

## Acceptance criteria

- Exactly 302 bundled rows load from the documented source families; no inferred or placeholder factors are created.
- Each loaded factor contains 16 finite source indicator values and an explicit reference unit.
- Quantity scaling matches the source factor multiplied by the entered quantity, tested using known source values.
- Multi-row requests return the same number of independent process results; no aggregate is present.
- Results and CSV include source attribution, source version, license, and background-database limitation.
- API, frontend, accessibility, lint, type-check, and production-build tests pass.
- The UI contains no unresolved source-review or activation state; product-level conclusions remain explicitly out of scope.

## Future scope changes

Adding a whole-product footprint would require compatible openly licensed raw-material and process factors, justified stage linking/loss/waste treatment, product composition, boundary consistency, and reproducible method data. It is not an unclosed requirement for this release and must not be approximated by summing the current process results.
