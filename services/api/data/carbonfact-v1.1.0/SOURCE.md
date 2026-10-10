# Carbonfact v1.1.0 published impact-score data

This directory contains the published `impact-scores.csv` files and process-family README files from the Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0. The source snapshot is pinned to repository tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`, published on 2026-07-01.

## Attribution

> Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.

The published impact scores, process-family notes, and this dataset extraction are distributed under CC BY-SA 4.0. The application provides the attribution, pinned release link, transformation, and background-data note in its Method, source and reuse dialog and in CSV exports; dataset-derived outputs are offered under the same license. Source DQR metadata are retained in CSV when published. See [LICENSE](LICENSE) and <https://creativecommons.org/licenses/by-sa/4.0/>.

## Included data

The application loads 302 rows from the following 11 process families: spinning, knitting, weaving, dyeing, finishing, printing, textile assembly, footwear assembly, synthetic PU leather, natural rubber, and use phase. Rows and indicator values are loaded directly from the included CSVs. The source's non-woven folder is not included because the v1.1.0 top-level catalog lists non-woven as forthcoming and its CSV contents do not match that folder's stated two-dataset summary.

The source's top-level documentation states 304 datasets, while the included CSV rows from its currently listed families add up to 302 (including 17 weaving rows). This product reports the actual number of rows it loads and does not create placeholder or inferred factors to match the headline count.

No full Brightway/Activity Browser inventories, ecoinvent database, or other background inventory files are included, queried, or reconstructed. The source states that its inventories use ecoinvent 3.12, so the published impact-score values may reflect those modeled background contributions. This application uses only the source-published score values as supplied; it is not an open or independently reproducible full-inventory LCA model.

## Use in this application

- The source supplies 16 EF 3.1 impact indicators per process reference unit. Manually entered process quantities scale those values in the factor's own reference unit.
- The browser preserves each selected process separately and can also sum compatible indicator values across the selected set. It calculates an EF 3.1 single score from the official JRC global normalisation factors and EF weighting percentages. The normalisation factors are in the [JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx); the recommended all-category final weighting factors, including robustness and scaled to 100%, follow the [JRC EF weighting report](https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf). The method is consistent with the JRC [2023 single-score guide](https://eplca.jrc.ec.europa.eu/uploads/JRC132621_MS_guide.pdf), which describes combining the 16 EF 3.1 categories with normalisation and weighting. These selected-row summaries do not infer stages or establish a product boundary.
- User-confirmed product-input mappings can use the source-reported `Input required (kg)` value to convert a locally held input feed mass to process output reference units. Where the output reference unit is mass, a mass-difference diagnostic can be shown. The optional flat-BOM mass check runs only after the user confirms every declared line is a product component for the same functional unit; it compares supported declared masses with a user-entered finished-product mass. These are arithmetic/mass-flow diagnostics only; they do not validate composition or completeness, add new upstream material impacts, or calculate waste-treatment flows.
- Process reference units and modeled boundaries vary by dataset. Use-phase data describe representative European consumer behavior even where the descriptor is tagged `GLO`.
- Source DQR fields, where present, are relayed as data-quality metadata; they are not an environmental score.

## Source links

- Pinned release: <https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0>
- Zenodo record: <https://zenodo.org/records/21102756>
- License: <https://creativecommons.org/licenses/by-sa/4.0/>
