# UI/UX Design — Environmental Impact Analyzer

## 1. Design intent

The interface is a transparent process-factor and selected-input explorer, not a complete product scorecard. It makes each published activity, geography, and reference unit concrete; preserves the 16 EF 3.1 indicator values per process; and can display an explicitly selected-row subtotal and weighted score without implying full-product coverage.

Principles:

- Keep activity, geography, and reference units close to results; offer source release, attribution, license, and background-data details in the Method/source dialog and CSV.
- Units before arithmetic: user-selected factors and reference units are visible before mapping or quantity calculation. Unknown or incompatible units are rejected.
- Separate outputs: 16 indicators remain visible per activity; the optional subtotal identifies itself as a sum of selected rows only.
- Honest scope: no completeness claim, ranking, default geography, or missing-stage imputation. Text-match suggestions require user confirmation and are not validated equivalencies.
- Local privacy: product-input labels, quantities, units, associations, finished-product mass, and mapped calculations stay in page memory/browser runtime. They are not sent to the API.
- Clean inputs: show concise field labels and direct controls; keep implementation and privacy descriptions in the separate Method, source and reuse dialog.
- Accessible presentation: semantic sections, visible keyboard focus, descriptive controls, responsive tables, reduced-motion support, and no meaning conveyed only by color.

## 2. Information architecture

1. **Header:** app identity and Method & data dialog.
2. **Hero:** apparel/footwear context and process-impact purpose.
3. **Catalog summary:** live factor count, selectable factor groups, 16 indicators, and source version.
4. **Product-input worksheet:** user-declared labels, quantities, and free-text units; a compact “Find factor” action opens user-confirmed text suggestions. A collapsed mass-check control compares the flat input list with user-entered finished-product mass only after the user confirms all declared lines are components for the same functional unit; editing the list resets that confirmation.
5. **Calculator panel:** family and source-geography filters, searchable activity selector, source reference unit, process quantity, selected process rows, and optional input-to-output/feed mapping controls.
6. **Results panel:** selected-process indicator subtotal and EF 3.1 single score, separate indicator table for every process, concise process context, and CSV export. Keep attribution and explanatory text out of the table area; provide source/method details in the separate dialog.
7. **Method & data dialog:** calculation formulas, score factors, boundaries, source/license, background-data note, WTU interpretation, DQR handling, count discrepancy, and privacy behavior.

## 3. Primary journey

1. Optionally record up to 25 known product/component/process inputs using a user-provided name, positive quantity, and free-text unit; these stay in page memory.
2. Choose a published activity directly or open text-match suggestions from a declared input. Review and confirm the activity, geography, and exact reference unit.
3. Choose a manual process quantity, map the declared amount as process output using dimension-compatible conversion, or map it as process feed where the selected factor has a positive input-required value.
4. Review and add up to 25 process rows. The same factor cannot be added twice; selected rows can be edited or removed.
5. Calculate. Manual quantities use the API; declared-input mappings use the loaded catalog locally in the browser. Product inputs and derived mapped quantities never enter the API request.
6. Review each process's 16 indicators, the compatible selected-row totals, the normalised/weighted EF 3.1 score contributions, process/BOM mass diagnostics where supported, input-use status, and source details.
7. Download an attributed CSV with process rows, selected-row totals, score and method provenance, input mapping status, flat-BOM mass diagnostic, and unmapped inputs marked not calculated/not zero.

## 4. Content rules

- The form fields remain concise; no explanatory implementation paragraphs under input fields.
- A selected-process summary is titled **Selected-process total** and explicitly states that it includes only selected rows, may contain overlapping boundaries, and is not a complete product footprint.
- The EF 3.1 single score is `sum((selected-row indicator total / JRC global normalisation factor) × EF weighting percentage/100)`. Normalisation values come from the official JRC EF 3.1 workbook (three significant figures); weighting percentages are the report's recommended all-category final factors, including robustness, scaled to 100%. Display normalised values, weighting percentages, score contributions, normalisation-factor units, and separate JRC source links; retain all 16 indicator results because weights reflect value choices.
- A user-confirmed suggestion is described as a word match, not a scientific mapping or composition inference.
- Process-feed conversion uses `output reference quantity = declared mass in kg / source Input required (kg) per reference unit`. Source input requirements are not new upstream impact factors.
- A source-derived input/output mass difference is a mass diagnostic only. The optional flat-BOM check runs only after the user confirms all declared lines are components for the same functional unit, compares their convertible mass with finished-product mass, and leaves unconvertible inputs explicit; changes to the list reset confirmation. Neither is a complete process mass balance, BOM/composition validation, or waste-treatment impact.
- Result tables include indicator code/name, published factor per reference unit, quantity-scaled result, and units.
- Geography labels follow the source descriptor. Do not describe `WORLD`/`GLO` as complete global representativeness.
- Preserve source DQR values in CSV exports when published; keep explanatory details out from below result tables.
- WTU is labeled as m³ world-equivalent, with a nearby note that it is not physical water volume.
- Attribution, source release link, ShareAlike/result license, scaling transformation, background note, and the JRC normalisation and weighting method links appear on the same screen as results or within the disclosed method section.

## 5. Visual direction

The existing forest/sand palette and original layered landscape SVG are retained as non-data decoration. The illustration never uses values, colors, or shapes to imply impact magnitude.

The result tables prioritize precision and provenance. Green accents identify source data and actions; color is not used alone to imply data quality. Process rows use simple numbered identifiers, and source/indicator metadata remain readable on mobile.

## 6. Accessibility and responsive behavior

- Use one page-level `h1`, ordered section headings, descriptive labels, and a native form submission path.
- Factor autocomplete and suggestion dialogs support keyboard selection; result tables have activity-specific accessible names and column headers.
- Icon-only removal controls have a full activity-specific accessible label.
- Units are text, not color or tooltip alone; WTU's nonphysical-volume note is adjacent and discoverable.
- All links identify their destination and use safe external-link attributes.
- Focus outlines are visible; motion is reduced for `prefers-reduced-motion`.
- On narrow screens, panels stack, controls use full width, and results remain horizontally scrollable with semantic tables.
- Automated tests exercise the calculator, mapping flows, subtotal, score, CSV, and source dialog with axe-core; decorative illustrations are hidden from assistive technology.

## 7. Privacy and source dialog

The dialog says the app has no accounts, analytics, database, or calculation history. Product-input labels, amounts, units, associations, finished-product mass, and derived mapped quantities remain in browser page memory and are not sent to the API. The optional mass diagnostic runs locally. For manually entered process quantities, only factor IDs and those process reference-unit quantities are sent. A downloaded CSV may contain user-entered inputs and mass diagnostics. API calculation requests are processed in memory; application access logging is disabled. Hosting infrastructure can retain network metadata under its own policies.

The source section links to the pinned v1.1.0 repository, Zenodo record, CC BY-SA 4.0 license, JRC EF 3.1 normalisation workbook, and JRC weighting report. It states that source-published scores may include modeled ecoinvent 3.12 background contributions even though the underlying inventories are not distributed or included in this app.
