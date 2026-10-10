# Open-data source record

> **Implemented scope:** 302 explicitly CC BY-SA 4.0-published process-score rows, with selected-row indicator subtotals and a JRC EF 3.1 single score. The app does not calculate or claim a complete product footprint.

## Data policy

- Use version-pinned, openly licensed data and preserve attribution, license notices, and ShareAlike obligations.
- Use only published scores and notes covered by the source license. Access or reconstruction of a proprietary background inventory requires a license that expressly permits the proposed use; do not bypass or imply open availability of restricted data.
- Preserve each indicator per process. Selected-row totals and a combined score are authorized only for the user-selected set; do not present them as a complete product footprint, ranking, product comparison, or unsupported environmental claim.
- Show the exact factor activity, geography tag, reference unit, and source version. Do not infer missing product composition, process routes, geography, or life-cycle stages.
- If a selected factor has no source-published DQR field, report that no rating is available; do not invent one.

## Active source

| Field | Record |
|---|---|
| Source | [The Open Source LCA Database for Footwear & Apparel](https://github.com/carbonfact/lca-database-footwear-apparel) |
| Version | v1.1.0, tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8` |
| Release date | 2026-07-01; [Zenodo record](https://zenodo.org/records/21102756) |
| License | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with the source `LICENSE` bundled in `services/api/data/carbonfact-v1.1.0/` |
| App use | Published impact-score CSV rows and associated process-family README files only |
| Loaded coverage | 302 rows from 11 documented source categories; 12 selectable factor groups because sneaker/pair and women's-boots/kg units are separate |
| Indicators | 16 EF 3.1 indicators: ACD, ETF, FRU, FWE, GHG, HTC, HTN, IOR, LDU, MRU, OZD, PCO, PMA, SWE, TRE, WTU |
| Product scope | Process rows are returned independently; the browser may subtotal the selected rows by indicator and calculate an EF 3.1 single score. The selected set is not a complete product footprint. |

### Attribution and ShareAlike

The source attribution is available in the app’s Method, source and reuse dialog and is embedded in CSV exports:

> Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.

The app identifies its quantity-scaling transformation and offers dataset-derived results under CC BY-SA 4.0. The bundled source `LICENSE` and [reuse record](services/api/data/carbonfact-v1.1.0/SOURCE.md) travel with the published score files. This notice applies to source-derived data and results; original project code and documentation are separately licensed under the root [MIT License](LICENSE). Neither license overrides the other or changes any third-party terms.

### Selected-row aggregation and EF 3.1 single score

The browser sums compatible per-indicator results across exactly the process rows selected by the user. It then computes `Σ((selected-row indicator total / normalisation factor) × weighting percentage/100)` across all 16 EF 3.1 midpoint categories. Global normalisation factors are transcribed from the [official JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx), which reports them to three significant figures. The weights are the JRC report's recommended final factors **including robustness**, scaled to 100%; the all-category table lists the exact final percentages, which sum to 100%. The report also presents a distinct set excluding three toxicity categories; this implementation deliberately uses the reported all-category set to match its 16-indicator score, and that choice is visible in the factor table. The UI and CSV show normalised category values, weights, contributions, and both method sources. Mixed units or missing categories suppress the score. The JRC's [2023 Member States Consumption Footprint Tool guide](https://eplca.jrc.ec.europa.eu/uploads/JRC132621_MS_guide.pdf) independently describes the 16-category single score as using EF 3.1 normalisation factors and EF weighting factors proposed by Sala et al. (2018). The single score summarizes only selected rows and does not establish product coverage.

| Code | EF 3.1 category | Global normalisation factor (unit/person) | Final weighting factor (including robustness; scaled to 100%) |
|---|---|---:|---:|
| ACD | Acidification | 55.6 mol H+ eq/person | 6.20% |
| ETF | Ecotoxicity, freshwater | 56,700 CTUe/person | 1.92% |
| FRU | Resource depletion, fossils | 65,000 MJ/person | 8.32% |
| FWE | Eutrophication, freshwater | 1.61 kg P eq/person | 2.80% |
| GHG | Climate change | 7,550 kg CO2 eq/person | 21.06% |
| HTC | Human toxicity, cancer | 0.0000173 CTUh/person | 2.13% |
| HTN | Human toxicity, non-cancer | 0.000129 CTUh/person | 1.84% |
| IOR | Ionising radiation | 4,220 kBq U-235 eq/person | 5.01% |
| LDU | Land use | 819,000 Pt/person | 7.94% |
| MRU | Resource depletion, minerals and metals | 0.0636 kg Sb eq/person | 7.55% |
| OZD | Ozone depletion | 0.0523 kg CFC-11 eq/person | 6.31% |
| PCO | Photochemical ozone formation | 40.9 kg NMVOC eq/person | 4.78% |
| PMA | Particulate matter | 0.000595 disease incidences/person | 8.96% |
| SWE | Eutrophication, marine | 19.5 kg N eq/person | 2.96% |
| TRE | Eutrophication, terrestrial | 177 mol N eq/person | 3.71% |
| WTU | Water use | 11,500 m3 water eq of deprived water/person | 8.51% |

The app maps its category-coded source output labels `CTUhtc`/`CTUhtn` to the JRC `CTUh` normalisation dimension for the corresponding cancer/non-cancer category, and `m³ world-eq` to the JRC water-use normalisation label. Those explicit code/unit mappings are checked before scoring; other unit labels are not silently coerced.

### Background inventory boundary

The Carbonfact release states that its full Brightway/Activity Browser inventories are not distributed and use ecoinvent 3.12. Published impact-score values may reflect those modeled background contributions. This application uses the licensed, already-published score rows as supplied. It does not bundle, query, or reconstruct ecoinvent or the source's full inventory model. Therefore the estimator is **not** an open, independently reproducible full-inventory LCA.

### Coverage and handling

- The source process categories cover material production, textile manufacturing, footwear assembly, garment assembly, and use phase. Units include kg yarn/fabric/product, pair of footwear, square metre PU leather, minutes of ironing, and kg detergent.
- `WORLD`, `GLO`, and country-specific descriptors are displayed as supplied. A source geography tag does not establish full coverage of a market or the specific origin of a user product.
- `Input required (kg)` can be used by a user-confirmed, browser-local mapping to convert a declared mass feed into a process output reference quantity. Where the reference unit is a mass, the app shows a source-derived input/output mass difference. An optional flat-BOM check runs only after the user confirms every declared line is a product component for the same functional unit; it compares supported declared masses with a user-entered finished-product mass and marks unconvertible lines as incomplete. Both diagnostics are arithmetic/mass-flow only: they do not add upstream-material burdens or waste-treatment impacts, validate product composition, or establish complete mass balance.
- Source DQR fields (P, TiR, TeR, GR) are preserved in CSV exports when published; they are never combined with impacts or turned into an environmental score.
- WTU is EF 3.1 water use in m³ world-equivalent; it is not a physical volume measurement. Use-phase records describe representative European consumer behaviour even where a row descriptor is tagged `GLO`.
- The source describes v1.1.0 as an early release. The app pins the version and does not silently update its scores from the main branch.

### Count reconciliation and exclusions

The upstream top-level documentation states 304 datasets. The data rows loaded from the named documented families total 302; the source's weaving CSV contains 17 rows, and the sum of actual CSV rows is used. The application's bundled `SOURCE.md` records this discrepancy. No synthetic or placeholder factors are added. The source's non-woven folder is excluded: the v1.1.0 top-level catalog calls it forthcoming, its family README says two datasets, and its CSV contains 19 rows. No undocumented non-woven rows are activated.

## Considered but not imported

- [USDA LCA Commons field-crop unit processes, version 2](https://agdatacommons.nal.usda.gov/articles/dataset/Unit_process_data_for_field_crop_production_version_1/25012439): a direct U.S. cotton LCI candidate labeled U.S. Public Domain, but not a ready-made EF 3.1 factor set. Its full provider graph and an openly licensed compatible characterization method still need review. The separate [version-1 crosswalk](https://data.nal.usda.gov/dataset/crosswalk-datasets-unit-process-data-field-crop-production-version-1) points to ecoinvent 2.2 providers and is excluded. No crop archive or factor values are bundled. See [v2-source-audit.md](v2-source-audit.md).
- [Textile Exchange LCI Library](https://textileexchange.org/lci-library/): individual entries do not have a single blanket license; no raw-material records are bundled without record-specific open rights.
- [Textile Exchange/Sphera 2026 cotton LCA](https://textileexchange.org/knowledge-center/reports/cotton-life-cycle-assessment/) and the [2026 U.S. Cotton fiber LCA](https://cottonworks.com/cotton-sustainability/life-cycle-assessment-of-cotton/): potentially relevant studies, but no factor data are integrated. Exact redistribution rights, compatible factor files, methods, and ecoinvent-free provider graphs have not been cleared.
- [Federal LCA Commons / USLCI](https://www.lcacommons.gov/quick-start-guide): a repository with item-specific terms and uneven scopes. A CC0 U.S. economy-wide record is not a global apparel process factor. No other record is imported.
- [AGRIBALYSE 3.2](https://www.data.gouv.fr/datasets/agribalyse-detail-par-etape/): Open Licence 2.0 but focused on French agricultural and food products. The standard openLCA database includes ecoinvent; the separate Core release removes those backgrounds but leaves some supply chains incomplete. Neither is a textile factor source for this increment.
- Cotton Incorporated published reports, the Apparel & Footwear PEFCR, and other public method/reference documents: no suitable combination of explicit open data rights, global process coverage, and compatible product scope was established for this estimator. PEFCR single-score and representative-product comparisons are not used.

## Scope decision

A complete apparel/footwear product footprint cannot be supported responsibly by the bundled published score tables alone. The shipped product can produce source-based process rows, a selected-row subtotal, and an EF 3.1 weighted score for the selected set, but not a full product LCA. The flat input organizer, arithmetic-only BOM mass check, word-match suggestions, and local unit/yield conversions do not validate composition, a hierarchical BOM, stage coverage, or non-overlapping boundaries. Unsupported, unconvertible, and unmapped inputs remain explicit rather than appearing as zero-valued results.
