# UI/UX Design — Environmental Impact Analyzer

## 1. Design intent

The interface is a transparent process-factor explorer, not a product scorecard. It makes each source activity and reference unit concrete, reports separate EF 3.1 indicators, and keeps the process-only boundary visible without warning icons or unresolved activation states.

Principles:

- Source first: activity, geography, reference unit, version, DQR where published, and license remain visible around the result.
- Units before arithmetic: the quantity field is unavailable until a factor is selected and labeled against that factor's source reference unit.
- Separate outputs: 16 indicators are shown in a semantic table for each activity. Selected activities remain separate.
- Honest scope: no product total, combined score, default geography, or missing-stage imputation.
- Accessible presentation: semantic sections, visible keyboard focus, descriptive controls, responsive tables, reduced-motion support, and no meaning conveyed only by color.

## 2. Information architecture

1. **Header:** app identity, “Open process data” label, and Method & data dialog.
2. **Hero:** apparel/footwear context, process-only purpose, and explicit separate-indicator/no-combined-score statement.
3. **Catalog summary:** live factor count, selectable factor groups, 16 indicators, and source version.
4. **Calculator panel:** family filter, searchable activity selector, source reference unit/geography, quantity input, and editable selected rows.
5. **Results panel:** a separate indicator table per chosen process; data quality/source details; same-screen attribution and CSV export.
6. **Method & data dialog:** formula, boundaries, source/license, ecoinvent-background note, WTU interpretation, DQR handling, count discrepancy, and privacy behavior.

## 3. Primary journey

1. Select a process family or use the activity autocomplete to search by material, process, geography, unit, or source ID.
2. Review activity name, source geography and reference unit before entering a quantity.
3. Add the process row; edit or remove it from the list. The same factor cannot be added twice—the selected row's quantity can be edited instead.
4. Calculate up to 25 selected rows. Every row returns the source factor and its quantity-scaled 16 indicators.
5. Review DQR fields and source-reported Input required (kg) if provided.
6. Download an attributed CSV, one row per process and indicator. The export includes units, source file/ID, source version, result license, and background-data note.

## 4. Content rules

- Header message: “Separate indicators. No combined score.”
- Quantity helper: enter the number of units of the selected factor's exact functional/reference unit.
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

The dialog says the app has no accounts, analytics, database, or calculation history. Calculation requests are processed in memory; application access logging is disabled. The dialog states that hosting infrastructure can retain network metadata according to its own policies.

The source section links to the pinned v1.1.0 repository, Zenodo record, and CC BY-SA 4.0 license. It states that source-published scores may include modeled ecoinvent 3.12 background contributions even though the underlying inventories are not distributed or included in this app.
