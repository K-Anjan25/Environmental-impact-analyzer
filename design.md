# UI/UX Design — Environmental Impact Analyzer

## 1. Design intent

The interface is a transparent process-factor explorer, not a product scorecard. It makes each source activity and reference unit concrete, reports separate EF 3.1 indicators, and keeps the process-only boundary visible without warning icons or unresolved activation states.

Principles:

- Source first: activity, geography, reference unit, version, DQR where published, and license remain visible around the result.
- Units before arithmetic: the quantity field is unavailable until a factor is selected and labeled against that factor's source reference unit.
- Separate outputs: 16 indicators are shown in a semantic table for each activity. Selected activities remain separate.
- Honest scope: no product total, combined score, default geography, or missing-stage imputation. User-entered input quantities are never substituted for process-factor quantities.
- Accessible presentation: semantic sections, visible keyboard focus, descriptive controls, responsive tables, reduced-motion support, and no meaning conveyed only by color.

## 2. Information architecture

1. **Header:** app identity and Method & data dialog.
2. **Hero:** apparel/footwear context, process-only purpose, and separate-indicator/no-combined-score framing.
3. **Catalog summary:** live factor count, selectable factor groups, 16 indicators, and source version.
4. **Optional v2 input worksheet:** user-declared input labels, quantities, and free-text units, with manual context-only associations to selected processes.
5. **Calculator panel:** family and source-geography filters, searchable activity selector, source reference unit, quantity input, and editable selected rows.
6. **Results panel:** a separate indicator table per chosen process; optional user-input context; data quality/source details; same-screen attribution and CSV export.
7. **Method & data dialog:** formula, boundaries, source/license, ecoinvent-background note, WTU interpretation, DQR handling, count discrepancy, and privacy behavior.

## 3. Primary journey

1. Optionally record up to 25 known product/component/process inputs using a user-provided label, quantity, and free-text unit; these stay in page memory.
2. Select a process family/geography or use the activity autocomplete to search by material, process, geography, unit, or source ID.
3. Review activity name, source geography, and exact reference unit before entering a process quantity.
4. Add the process row; optionally choose a declared input as context. Edit or remove rows as needed. The same factor cannot be added twice—the selected row's quantity can be edited instead.
5. Calculate up to 25 selected rows. Every row returns the source factor and its quantity-scaled 16 indicators; an input association does not alter the calculation.
6. Review DQR fields and source-reported Input required (kg) if provided.
7. Download an attributed CSV, one row per process and indicator, plus not-calculated/not-zero records for input lines without an associated process. The export includes units, source file/ID, source version, result license, and background-data note.

## 4. Content rules

- Header message: “Separate indicators. No combined score.”
- Quantity helper: enter the number of units of the selected factor's exact functional/reference unit. This remains separate from any declared product-input quantity.
- V2 input associations are always manual and context only. Do not use the declared amount for calculation, infer unit compatibility, or represent unassociated inputs as zero.
- Result table: code and name, published factor per reference unit, quantity-scaled result, numerator unit.
- Geography labels follow the source descriptor. Do not describe `WORLD`/`GLO` as complete global representativeness.
- `Input required (kg)` is described as source metadata, displayed per reference unit, and not applied in this calculation.
- DQR values appear in a collapsible details section. If absent, say no DQR was published for that factor.
- WTU is labeled as m³ world-equivalent, with an adjacent note that it is not physical water volume.
- Process-only scope and no-total message remain visible before and after a calculation.
- Attribution text, source release link, ShareAlike/result license, scaling transformation, and source background note appear on the same screen as results.
- Error alerts appear only for an actual user-input or service error; there are no pending, candidate-source, or unreviewed-gate badges in the normal interface.

## 5. Visual direction

The existing forest/sand palette and original layered landscape SVG are retained as non-data decoration. The caption states that the illustration is not a result. It never uses plotted values, colors, or shapes to imply impact magnitude.

The result table prioritizes precision and provenance over comparison. Green accents identify source data and actions; no red/amber warning color is used to imply data quality. Process rows use simple numbered identifiers, and source/indicator metadata remain readable on mobile.

## 6. Accessibility and responsive behavior

- Use one page-level `h1`, ordered section headings, descriptive labels, and a native form submission path.
- Factor autocomplete supports keyboard selection; result tables have activity-specific accessible names and column headers.
- Icon-only removal controls have a full activity-specific accessible label.
- Units are text, not color or tooltip alone; WTU's nonphysical-volume note is adjacent and discoverable.
- All links identify their destination and use safe external-link attributes.
- Focus outlines are visible; motion is reduced for `prefers-reduced-motion`.
- On narrow screens, panels stack, controls use full width, and results remain horizontally scrollable with semantic tables.
- Automated tests exercise the calculator, populated results, and source dialog with axe-core; decorative illustrations are hidden from assistive technology.

## 7. Privacy and source dialog

The dialog says the app has no accounts, analytics, database, or calculation history. Optional declared input labels, quantities, units, and manual associations remain in browser page memory and are not sent to the API; factor IDs and separately entered factor-reference quantities are sent for calculation. A downloaded CSV may contain user-entered input context. Calculation requests are processed in memory; application access logging is disabled. The dialog states that hosting infrastructure can retain network metadata according to its own policies.

The source section links to the pinned v1.1.0 repository, Zenodo record, and CC BY-SA 4.0 license. It states that source-published scores may include modeled ecoinvent 3.12 background contributions even though the underlying inventories are not distributed or included in this app.
