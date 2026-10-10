# Carbonfact v1.1.0 published impact-score data

This directory contains the published `impact-scores.csv` files and process-family README files from the Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0. The source snapshot is pinned to repository tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`, published on 2026-07-01.

## Attribution

> Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.

The published impact scores, process-family notes, and this dataset extraction are distributed under CC BY-SA 4.0. The application displays the attribution beside each calculation and provides the dataset-derived output under the same license. Changes or transformations are identified in the application. See [LICENSE](LICENSE) and <https://creativecommons.org/licenses/by-sa/4.0/>.

## Included data

The application loads 302 rows from the following 11 process families: spinning, knitting, weaving, dyeing, finishing, printing, textile assembly, footwear assembly, synthetic PU leather, natural rubber, and use phase. Rows and indicator values are loaded directly from the included CSVs. The source's non-woven folder is not included because the v1.1.0 top-level catalog lists non-woven as forthcoming and its CSV contents do not match that folder's stated two-dataset summary.

The source's top-level documentation states 304 datasets, while the included CSV rows from its currently listed families add up to 302 (including 17 weaving rows). This product reports the actual number of rows it loads and does not create placeholder or inferred factors to match the headline count.

No full Brightway/Activity Browser inventories, ecoinvent database, or other background inventory files are included, queried, or reconstructed. The source states that its inventories use ecoinvent 3.12, so the published impact-score values may reflect those modeled background contributions. This application uses only the source-published score values as supplied; it is not an open or independently reproducible full-inventory LCA model.

## Use in this application

- The source supplies 16 EF 3.1 impact indicators per process reference unit. Results are scaled only by the quantity the user enters for that same reference unit.
- Results are reported separately for each selected process. The application does not sum process rows, infer missing stages, select a product boundary, or present a whole-product footprint.
- Source-provided `Input required (kg)` values are shown as metadata but are not used to add upstream material impacts or waste-treatment flows.
- Process reference units and modeled boundaries vary by dataset. Use-phase data describe representative European consumer behavior even where the descriptor is tagged `GLO`.
- Source DQR fields, where present, are relayed as data-quality metadata; they are not an environmental score.

## Source links

- Pinned release: <https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0>
- Zenodo record: <https://zenodo.org/records/21102756>
- License: <https://creativecommons.org/licenses/by-sa/4.0/>
