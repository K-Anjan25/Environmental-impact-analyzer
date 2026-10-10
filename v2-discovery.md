# v2 expanded product-input worksheet

**Authorization:** the user explicitly expanded v2 to include mapped inputs, unit conversion, mass/yield diagnostics, selected-process totals, and a combined score. This supersedes the earlier prohibition on those prototype features. It does not supply new licensed inventory files, establish full product coverage, or authorize use of proprietary data without the relevant rights.

**Status:** browser-local, user-confirmed factor mapping, a flat-BOM mass diagnostic, selected-row subtotals, and the EF 3.1 single score are implemented. This is not a full product LCA or a v2 completeness claim. The existing Carbonfact v1.1.0 published scores remain the only bundled process-factor data; the source audit has not cleared another factor dataset.

## Implemented behavior

- Up to 25 flat user-declared lines with name, positive quantity, and free-text unit. The input form stays visually clean; scope and privacy disclosures remain in the separate Method, source and reuse dialog.
- Factor suggestions are generated from overlapping words in the input name and published activity names. A user must confirm a suggestion; the word match is not evidence of material/process equivalence.
- A selected input can be used as process output with supported same-dimension unit conversion, or as process feed where the chosen factor has a positive source-reported `Input required (kg)` value. Feed mass in kg is divided by that source coefficient to obtain the factor's output reference-unit quantity.
- Supported conversions include common mass units (kg, g, mg, metric tonnes, lb, oz), selected area units, time units, and pair/count units. Unknown, compound, or cross-dimension conversions are rejected. The mapping must be reviewed by the user; a matching physical unit does not prove matching material identity.
- An optional flat-BOM mass diagnostic runs only after the user confirms every declared line is a product component for the same functional unit. It sums only declared inputs whose units can be converted to mass and compares the sum with user-entered finished-product mass. Adding/removing an input resets confirmation. It reports the arithmetic difference, flags unconvertible lines, and does not infer components or validate a complete BOM.
- Source-reported input requirements are scaled to the selected quantity. Where the factor output reference unit is mass, the browser displays a source-derived input/output mass difference. It is a mass diagnostic only: no waste-treatment impact or disposal scenario is added.
- Each process row still shows its 16 indicators separately. The browser adds indicator subtotals for the selected rows and an EF 3.1 single score where all 16 categories and units are compatible.
- The single score is `sum((selected-row indicator total / JRC global normalisation factor) × (JRC EF weighting percentage / 100))`. Normalisation values are transcribed from the official EF 3.1 workbook and reported to three significant figures; the recommended all-category final weighting factors including robustness follow the JRC EF weighting report and sum to 100%. Each normalised value, weighting percentage, and weighted contribution is shown and exported with both source links.
- CSV exports include separate process-indicator rows, selected-row totals, score/method provenance, and unmapped inputs marked not calculated, not zero.

## Input and privacy contract

- Product-input names, quantities, unit labels, association IDs, suggestion choices, and quantities derived from those inputs stay in browser page memory and are not sent to the API.
- Mapped calculations use the already-loaded static factor catalog in the browser. The process-estimate POST endpoint is used only for manually entered process reference-unit quantities; it receives factor IDs and those manually entered quantities, never product-input fields or derived mapped quantities.
- Inputs are cleared on reload or page close. A user-initiated CSV may contain the declared values.
- Keep the input area concise. Do not place implementation descriptions beneath input fields.

## Coverage and method limitations

- The worksheet is flat, not hierarchical. It does not validate product composition, BOM completeness, allocation, system boundaries, or required life-cycle stages. A score/subtotal includes exactly the selected rows; it does not show coverage and is not a complete product footprint, comparison, ranking, or environmental claim.
- Users must check overlap between process boundaries and repeated input mappings; adding upstream and downstream scores can double count source-included burdens.
- Text suggestions require explicit user selection and do not infer composition, geography, supplier, or a validated factor mapping. Automatic stage completion is not implemented.
- `Input required (kg)` is used only as a source-reported mass coefficient for an explicitly selected mapping and as a mass diagnostic; it does not add an upstream factor. Waste-treatment factors and end-of-life scenarios are unavailable and not modelled.
- No new LCI/LCIA process factors are bundled. The USDA field-crop version-2 archive is a possible open foreground-LCI lead, but its complete provider graph and compatible open characterization method remain unaudited; the separate ecoinvent-linked crosswalk remains excluded. See [v2-source-audit.md](v2-source-audit.md).
- Ecoinvent acquisition, reconstruction, querying, and redistribution are not implemented. No license evidence or authorized ecoinvent package is present. Do not obtain or recreate the proprietary inventory without lawful access and terms that permit the proposed processing and redistribution. Carbonfact's published score files are retained under their own source license and may reflect ecoinvent-based background contributions; their underlying inventory is not included or reconstructed here.

## Tests and next gates

Web tests cover unit conversion, input-feed conversion, material-mass diagnostics, the EF 3.1 score formula, compatible cross-process totals, mixed-unit rejection, text suggestions, local-only mapped calculations, export provenance, and accessibility. API tests verify the independent process-row contract and source metadata.

Remaining gates for a defensible complete product footprint are: define a product functional unit and stage boundary; validate a hierarchical BOM and component mass balance against a declared finished output; audit and integrate suitable openly licensed upstream, transport, waste-treatment, and end-of-life factors; verify provider/dependency graphs and units; add coverage rules and non-overlap checks; and independently validate the release in the authenticated Vercel Preview. A licensed ecoinvent package could be considered only after the exact license explicitly permits the intended processing and redistribution; no credentials or private license documents should be placed in chat or Git.
