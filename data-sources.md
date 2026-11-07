# Data sources and scope

## Published process factors

The calculator uses the published impact-score CSVs from the [Carbonfact Open Source LCA Database for Footwear & Apparel](https://github.com/carbonfact/lca-database-footwear-apparel), pinned to version 1.1.0 (tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`). It loads 302 process rows from 11 source families and reports their 16 EF 3.1 indicators separately. The source files, license, count reconciliation, and transformation notes are documented in the [Carbonfact source record](services/api/data/carbonfact-v1.1.0/SOURCE.md).

The required attribution is: “Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.” The source data and derived results retain the source's CC BY-SA 4.0 terms.

The source says its complete Brightway/Activity Browser inventories use ecoinvent 3.12 and are not distributed. This app uses the published scores only; it does not bundle, query, or reconstruct those inventories. The results are not an independently reproducible full-inventory LCA.

## EF 3.1 single score

The optional single score normalises and weights only the selected process rows. Normalisation factors come from the [JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx); the recommended all-category final weights, including robustness, follow the [JRC weighting report](https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf). Indicator values remain separate in their own units. The score does not establish product coverage or support a product claim.

## Supplementary climate-change factors

DEFRA 2026 freight and end-of-life factors are transcribed in `apps/web/src/ghg-supplement.ts` from the [UK Government GHG Conversion Factors](https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting), published under the Open Government Licence v3.0. These are separate climate-change-only values, not EF 3.1 indicators. Their file hashes, factor IDs, values, and limitations are recorded in [`SOURCE-RECORD.md`](services/api/data/carbonfact-v1.1.0/datasets/sources/SOURCE-RECORD.md). Transport is transport-only; the cited combustion and recycling factors cover transport to facility only, not treatment emissions or credits.

## Scope

A result covers only the process rows the user selects. It is not a complete or validated apparel or footwear product footprint. Missing stages, composition, supplier routes, and boundaries are not inferred. The calculator's product-input and mass checks are arithmetic aids; they do not validate a complete bill of materials.

A former USLCI climate-change mapping was exploratory and is not used by the current calculator. The source note retains its provenance; no USLCI factors are included in estimates.
