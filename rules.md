# Coding and Calculation Rules — Environmental Impact Analyzer

## 1. Product invariants

1. The application is a process estimator with a selected-row subtotal and EF 3.1 single score; it is not a complete product LCA.
2. Always preserve the 16 separate indicator values per process. A browser-calculated subtotal/single score may cover only the exact selected rows and must not imply completeness, ranking, or environmental claims.
3. Do not infer product composition, missing life-cycle stages, geography, reference units, supplier routes, waste-treatment impacts, or zero impacts. User-confirmed text matches are only suggestions, not evidence of equivalence.
4. Use pinned, documented source data. New sources require per-file licensing, provenance, provider-graph, unit, boundary, and method review. Do not use proprietary data without license terms that permit the intended access, processing, and redistribution.
5. Keep result tables focused on values and process context. Make source attribution, license, transformation, pinned release, background-data note, and JRC method citations available in the Method, source and reuse dialog and CSV export.
6. Keep product-input names, quantities, units, and associations browser-local. Never send those fields or quantities derived from them to the calculation API.

## 2. Data and licensing

- Pin every factor change to a source version, tag/commit, source file, and row ID.
- Keep original score values unchanged in bundled CSVs; document parser normalization and derived calculations.
- Include the source CC BY-SA 4.0 notice and preserve linked attribution in the Method/source dialog and CSV export.
- Offer dataset-derived process results under CC BY-SA 4.0 and include the license/attribution in exports.
- State that Carbonfact's published score rows may reflect ecoinvent 3.12 background contributions, while its full underlying inventory is not distributed or included here. Do not claim this estimator is a reproducible open-inventory LCA.
- Ecoinvent access or reconstruction requires lawful access and a license that explicitly allows the proposed processing and redistribution. Never circumvent terms, infer missing proprietary inventories, or check restricted data into Git.
- Exclude the source's unlisted/forthcoming non-woven rows because its v1.1.0 family documentation conflicts with the CSV contents. Do not pad the catalog to match the source's headline count.

## 3. Calculation rules

- Manual formula: `scaled indicator = published indicator factor × quantity in that factor's reference unit`.
- A declared output may set a process quantity only after a user-selected, dimension-compatible conversion. A declared mass feed may set process output only where the selected factor has a positive source-reported `Input required (kg)` value: `output reference quantity = input mass kg / input-required kg per reference unit`.
- Common mass, selected area/time, pair, and count conversions are explicit and unit-tested. Reject unknown or dimensionally incompatible units; never guess.
- Use Decimal arithmetic and strict validation in the API. The browser-local mapping path must also reject nonfinite/nonpositive values and must not send mapped quantities to the API.
- Source-reported input requirements can yield an input/output mass-difference diagnostic when net output mass is known. The diagnostic is not a waste-treatment impact and must not add an unsupported upstream factor.
- A flat-BOM mass comparison is arithmetic only and may run only after the user confirms every declared line is a product component for the same functional unit. Reset confirmation when an input is added/removed; keep non-mass/ambiguous lines explicit and do not infer composition, hierarchy, completeness, or waste treatment.
- Sum indicators only when indicator codes and units agree across rows. The EF 3.1 score requires all 16 categories with the expected source units and uses `sum((selected-row indicator total / JRC normalisation factor) × final JRC weighting factor / 100)`. Use the recommended all-category final weights including robustness, scaled to 100% (not the alternate set excluding toxicity); preserve the underlying categories, show weights/contributions, and cite the normalisation workbook separately from the weighting report. Normalisation factors are rounded to three significant figures in the workbook.
- DQR values are source metadata. Do not combine them with impact values or relabel them as confidence.
- WTU is m³ world-equivalent. Never relabel it as litres or physical water volume.
- A missing indicator, factor, stage, or DQR remains missing; it is never set to zero. Incompatible indicators suppress aggregation or the combined score.

## 4. API and data code

- Validate request/response structures with Pydantic.
- Keep factor loading deterministic and fail at startup for a missing required file, column, reference unit, duplicate ID, or nonfinite score.
- Load only the allowlisted bundled CSV files; do not make network calls to a data provider at runtime.
- Keep routes same-origin friendly. Browser code uses relative paths only.
- Never log request bodies or store calculations. Keep the production server's access log disabled.
- The API accepts only selected factor IDs and manually entered reference-unit quantities. Product-input labels, amounts, units, associations, and locally derived quantities remain out of API requests/schemas.
- Do not expose unused no-score/product-intake APIs in OpenAPI.

## 5. Frontend and content

- Label quantity with the selected reference unit and show geography before calculation.
- Present a semantic 16-indicator table for each process plus an explicitly selected-row subtotal and EF 3.1 score when valid.
- Keep the input fields concise; put method, privacy, licensing, source, and completeness explanations in the separate dialog or documentation.
- Keep source attribution, CC BY-SA statement, JRC method citation, and aggregation boundary available in the separate Method/source dialog and CSV; avoid explanatory blocks under result tables.
- State that selected-row totals are not whole-product footprints and that process units/boundaries vary.
- Preserve source DQR and input-required metadata in CSV exports when present; keep result tables uncluttered. Do not display pending activation states, empty warning badges, or mock impact values.
- Use semantic landmarks, associated labels, visible keyboard focus, accessible tables, and reduced-motion support.

## 6. Validation and tests

- Test catalog counts against actual bundled CSV records and verify factor IDs are unique.
- Test indicator count, input header variants, reference units, geography extraction, and optional DQR/input metadata.
- Test quantity arithmetic, conversions, source-reported feed mapping, material-mass diagnostics, score factors, compatible totals, mixed-unit rejection, serialization, and invalid input rejection.
- Test that declared inputs and derived mapped quantities never enter API requests; test CSV quoting, source/method provenance, and not-calculated-not-zero records.
- Run Ruff, mypy, pytest, frontend tests, axe checks, TypeScript, and Vite production build before release.
