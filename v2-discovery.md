# v2 discovery — declared product inputs, separate process results

**Status:** the first input-organization increment is implemented; this is not a v2 release or a full product LCA. A preliminary open-data/licensing screen is recorded in [v2-source-audit.md](v2-source-audit.md); no new factor source is cleared for integration.

## Intended use case

An apparel or footwear practitioner already has some component or activity quantities and wants to keep those declarations visible while separately inspecting published process factors. The app lets the user label an input and optionally associate it with a manually selected process row. It does not determine whether that association is scientifically or operationally appropriate.

## Input contract

- Up to 25 user-declared input lines, each with a user-entered name, positive finite quantity, and free-text unit label.
- Input descriptions, amounts, and units remain in browser page memory. They are not sent to the API and are cleared on reload or page close.
- A user may manually associate an input line with a selected factor. No link is created by default and no material, process, or geography is inferred.
- Keep the input area visually clean: show concise field labels and direct controls, with no implementation descriptions or explanatory paragraphs beneath or around the input fields. Keep required scope/privacy disclosures in the separate Method, source and reuse dialog or documentation.
- The process-factor quantity remains a separate, explicit value entered in the selected source factor's exact reference unit. An associated input quantity is context only: it is not copied, converted, propagated, or used in the calculation.
- The API contract remains `factor_id` plus process reference-unit `quantity`; it does not receive product-input labels, quantities, units, or association IDs.

## Results and export

- Each selected factor still returns 16 separate indicator values. Different process rows are never summed.
- The UI displays a linked input label and amount; the Method, source and reuse dialog documents that associations are context only. CSV identifies links as user-selected context only.
- CSV includes unassociated declared input lines as `declared_input_not_calculated` records with blank indicator/result fields and an explicit `not calculated and not zero` status. Such lines are not treated as zero-impact results.
- The generated CSV is a user-initiated download. It may contain the input labels, quantities, and unit text entered in the page.

## Boundaries

- This worksheet is not an inferred or validated bill of materials, product footprint, or product life-cycle model.
- No automatic factor matching, composition parsing, unit conversion, reference-unit mapping, loss-rate calculation, stage linking, upstream input propagation, waste treatment, coverage percentage, cross-process total, or combined environmental score is implemented.
- Source-reported `Input required (kg)` remains display-only. Missing or unassociated inputs stay explicit and are never assigned a zero impact.
- The worksheet uses no new source data. The existing Carbonfact v1.1.0 release remains the only bundled source; its published impact scores retain their separate CC BY-SA 4.0 attribution and result-license requirements. Do not add or query ecoinvent or another non-open inventory.
- Do not enter confidential business information, supplier secrets, or personal data. The service has no persistent input store.

## Validation

The web tests verify that the input area stays concise, a manually associated declared input stays out of the API request, its quantity does not replace the process quantity, the UI remains axe-clean, and the CSV distinguishes unassociated inputs from calculated indicator rows without assigning numeric results.

## Next v2 gates

1. **Open-data/licensing audit (in progress):** a preliminary screen is recorded in [v2-source-audit.md](v2-source-audit.md). The USDA LCA Commons field-crop version-2 archive is a possible open LCI lead, but its complete provider graph and compatible open characterization method have not been cleared; its separate ecoinvent crosswalk is excluded. No new factor data is integrated.
2. Define an explicit mapping rule only for factors whose boundary and unit genuinely match a user-declared process output. Do not assume an input mass equals a process output or material loss-adjusted mass.
3. Add unit conversion, mass-balance, loss, or waste-treatment behavior only after the required openly licensed factors and transparent method are available and tested.
4. Keep unsupported or unmapped stages unavailable and visible; preserve separate process-by-indicator outputs unless a new product-scope authorization and defensible open-data method explicitly change the boundary.
