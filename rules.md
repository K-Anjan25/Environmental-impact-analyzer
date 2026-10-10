# Coding and Calculation Rules — Environmental Impact Analyzer

## 1. Product invariants

1. The delivered application is a process-factor estimator, not a whole-product LCA.
2. Report separate indicator values only. Never calculate a combined environmental score, ranking, or cross-stage total.
3. Never infer a product BOM, missing process stage, geography, reference unit, loss treatment, or zero impact.
4. Use only the pinned, explicitly licensed data included in the repository. Do not fetch unpinned runtime factors or use a commercial/non-open fallback.
5. Display source attribution, license, transformation, source geography, and reference unit beside results.
6. Treat v2 product-input lines as user-declared browser-only context. Never infer completeness, factor compatibility, process mapping, or geography; never send those fields to the calculation API.

## 2. Data and licensing

- Pin every factor change to a source version, tag/commit, source file, and row ID.
- Keep original score values unchanged in the bundled CSVs; document parser normalization and derived calculations.
- Include the source CC BY-SA 4.0 notice and preserve linked same-screen attribution.
- Offer dataset-derived process results under CC BY-SA 4.0 and include the license/attribution in exports.
- State that Carbonfact's published score rows may reflect ecoinvent 3.12 background contributions, while its full underlying inventory is not distributed or included here. Do not claim this estimator is a reproducible open-inventory LCA.
- Exclude the source's unlisted/forthcoming non-woven rows because its v1.1.0 family documentation conflicts with the CSV contents. Do not pad the catalog to match the source's headline count.

## 3. Calculation rules

- Formula: `scaled indicator = published indicator factor × quantity expressed in that factor's reference unit`.
- Use Decimal arithmetic in the API. Reject missing/unknown factor IDs, nonfinite values, zero/negative quantities, and out-of-bound requests.
- Return the source factor and scaled result with units. Convert only as a direct dimensionally valid scale by quantity; no unit guessing or silent conversions.
- Keep every selected process row separate. No input propagation, calculated process linking, summing, normalizing, ranking, or product boundary is applied. An optional manual input association is display/export context only.
- `Input required (kg)` is display-only metadata in v1. Do not apply it to an upstream factor or waste treatment.
- DQR values are source metadata. Do not combine them with impact values or relabel them as confidence.
- WTU is m³ world-equivalent. Never relabel it as litres or physical water volume.
- A missing DQR or unsupported process row remains missing; it is never set to zero.

## 4. API and data code

- Validate request/response structures with Pydantic.
- Keep factor loading deterministic and fail at startup for a missing required file, column, reference unit, duplicate ID, or nonfinite score.
- Load only the allowlisted bundled CSV files; do not make network calls to a data provider at runtime.
- Keep routes same-origin friendly. Browser code uses relative paths only.
- Never log request bodies or store calculations. Keep the production server's access log disabled.
- Keep v2 user-input labels, quantities, unit text, and association IDs out of API requests and schemas; only explicit factor IDs and separately entered reference-unit quantities reach the calculation route.
- Do not expose unused no-score/product-intake APIs in OpenAPI.

## 5. Frontend and content

- Label quantity with the selected reference unit and show geography before calculation.
- Present one semantic 16-indicator table per selected process; do not make an aggregate row.
- Keep source attribution and CC BY-SA statement visible with results and available in CSV.
- State that results are not whole-product footprints and process units/boundaries vary.
- Show source DQR and Input required (kg) only when present. Do not display pending activation states, empty warning badges, or mock impact values.
- Use semantic landmarks, associated labels, visible keyboard focus, accessible tables, and reduced-motion support.

## 6. Validation and tests

- Test catalog counts against actual bundled CSV records and verify factor IDs are unique.
- Test indicator count, input header variants, reference units, geography extraction, and optional DQR/input metadata.
- Test quantity arithmetic against source values, serialization as JSON numbers, invalid input rejection, and preservation of independent process rows.
- Test CSV quoting, attribution/license columns, and the absence of aggregate rows.
- Run Ruff, mypy, pytest, frontend tests, axe checks, TypeScript, and Vite production build before release.
