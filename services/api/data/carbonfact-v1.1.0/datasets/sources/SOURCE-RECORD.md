# Supplementary source record

This file records provenance for supplementary GHG and exploratory data. The calculator's 16-indicator process results use the published Carbonfact score rows documented in [SOURCE.md](../../SOURCE.md) and [data-sources.md](../../../../../../data-sources.md).

## DEFRA GHG Conversion Factors 2026 (UK Government, OGL v3.0)

- File: `defra-2026/ghg-conversion-factors-2026-flat-format-revised.xlsx`
  - SHA-256: `a9a455ab396dae226d510c7be6233748416d490c41a5d20f3dc7a0c45feecd5e`
- Second file: `defra-2026/ghg-conversion-factors-2026-full-set.xlsx`
  - SHA-256: `b5c4f2f86cdc74707337b2fb013b44ded189a1b528f5e29ea99856ba65ae0205`
- Workbook version 1.2, updated 2026-07-10, status Final. Sheet "Factors by Category", 8,740 data rows.
- Values transcribed into `apps/web/src/ghg-supplement.ts` and verified by ID and value (kg CO2e per unit):

| ID | Factor | Value | Unit |
|---|---|---:|---|
| 27_304_3136_14_1 | Freight, artic average laden | 0.07926 | kg CO2e / tonne-km |
| 27_304_3120_14_1 | Freight, rigid >17t average laden | 0.17256 | kg CO2e / tonne-km |
| 27_320_3235_14_1 | Freight, container ship | 0.01612 | kg CO2e / tonne-km |
| 27_315_3151_14_1 | Freight, freight train | 0.02583 | kg CO2e / tonne-km |
| 27_317_3156_14_1 | Freight, flights long-haul to/from UK, with RF | 0.89939 | kg CO2e / tonne-km |
| 27_317_3158_14_1 | Freight, flights international, with RF | 0.89939 | kg CO2e / tonne-km |
| 20_507_5313_15_1 | Waste, commercial & industrial, landfill | 520.58023 | kg CO2e / tonne |
| 20_507_5311_15_1 | Waste, commercial & industrial, combustion | 4.65358 | kg CO2e / tonne |
| 20_505_5380_15_1 | Plastics, average, closed-loop | 4.65358 | kg CO2e / tonne |
| 20_505_5383_15_1 | Plastics, average, landfill | 9.00687 | kg CO2e / tonne |

- Scope limit: the recycling and combustion rows cover transport to the facility only. They do not include treatment emissions or credits. Freight rows are transport only, not production.

## USLCI exploratory mapping (not used by the calculator)

- Historical source: FLCAC-admin/uslci-content, version `v1.2026-03`, under MIT terms. The earlier repository snapshot contained 1,434 processes and 5,708 flows, with no impact-method folder.
- An exploratory climate-change-only mapping covered 26 emission flows: CO2 fossil (7), CO2 biogenic (4), CH4 fossil (7), CH4 biogenic (3), and N2O (5). Characterisation factors were CO2 fossil 1, CO2 biogenic 0, CH4 fossil 29.8, CH4 biogenic 27 (JRC EUR 31414 EN, 2023, Table 3), and N2O 273 (IPCC AR6 Table 7.15).
- The raw USLCI snapshot, mapping JSON, and mapping-generation script have been removed because the current calculator does not load or use them. This note preserves the exploratory method's provenance; none of these values are used in current estimates or product-scope claims.
- Scope limit of the former mapping: climate change only; it did not cover the other 15 EF 3.1 categories, resource-side flows, or CO2 land-use-change flows.

## Apparel A1 (textile fibre)

- No open licensed A1 textile-fibre dataset is bundled. Apparel A1 is out of scope for the bundled data and is not presented as covered.
