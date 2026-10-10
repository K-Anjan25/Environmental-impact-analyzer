# Open-data source record

> **Implemented scope:** process-level estimates from explicitly CC BY-SA 4.0-published score rows. The app does not calculate or claim a whole-product footprint.

## Data policy

- Use only version-pinned, openly licensed data and preserve its attribution, license notice, and ShareAlike obligations.
- Use only published scores and notes covered by the source license. Do not access, reconstruct, or imply open availability of proprietary or unlicensed background inventories.
- Show every indicator separately. Do not create a combined score, cross-process sum, ranking, product comparison, or unsupported environmental claim.
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
| Product scope | A selected process activity multiplied by a user-entered quantity expressed in that factor's reference unit; every selected activity is returned independently |

### Attribution and ShareAlike

The source attribution displayed beside results and embedded in CSV exports is:

> Data source: The Open Source LCA Database for Footwear & Apparel, Carbonfact, version 1.1.0. https://github.com/carbonfact/lca-database-footwear-apparel, CC BY-SA 4.0.

The app identifies its quantity-scaling transformation and offers dataset-derived results under CC BY-SA 4.0. The bundled source `LICENSE` and [reuse record](services/api/data/carbonfact-v1.1.0/SOURCE.md) travel with the published score files. This notice applies to source-derived data and results; it does not assign a license to the application code.

### Background inventory boundary

The Carbonfact release states that its full Brightway/Activity Browser inventories are not distributed and use ecoinvent 3.12. Published impact-score values may reflect those modeled background contributions. This application uses the licensed, already-published score rows as supplied. It does not bundle, query, or reconstruct ecoinvent or the source's full inventory model. Therefore the estimator is **not** an open, independently reproducible full-inventory LCA.

### Coverage and handling

- The source process categories cover material production, textile manufacturing, footwear assembly, garment assembly, and use phase. Units include kg yarn/fabric/product, pair of footwear, square metre PU leather, minutes of ironing, and kg detergent.
- `WORLD`, `GLO`, and country-specific descriptors are displayed as supplied. A source geography tag does not establish full coverage of a market or the specific origin of a user product.
- `Input required (kg)` is source metadata for material input/loss handling. The estimator shows the source value but does not add upstream-material burdens or waste-treatment flows.
- Source DQR fields (P, TiR, TeR, GR) are mapped and displayed as data-quality metadata; they are never combined with impacts or turned into an environmental score.
- WTU is EF 3.1 water use in m³ world-equivalent; it is not a physical volume measurement. Use-phase records describe representative European consumer behaviour even where a row descriptor is tagged `GLO`.
- The source describes v1.1.0 as an early release. The app pins the version and does not silently update its scores from the main branch.

### Count reconciliation and exclusions

The upstream top-level documentation states 304 datasets. The data rows loaded from the named documented families total 302; the source's weaving CSV contains 17 rows, and the sum of actual CSV rows is used. The application's bundled `SOURCE.md` records this discrepancy. No synthetic or placeholder factors are added. The source's non-woven folder is excluded: the v1.1.0 top-level catalog calls it forthcoming, its family README says two datasets, and its CSV contains 19 rows. No undocumented non-woven rows are activated.

## Considered but not imported

- [Textile Exchange LCI Library](https://textileexchange.org/lci-library/): individual entries do not have a single blanket license; no raw-material records are bundled without record-specific open rights.
- [Federal LCA Commons / USLCI](https://www.lcacommons.gov/quick-start-guide): a repository with item-specific terms and uneven scopes. A CC0 US economy-wide record is not a global apparel process factor. No record is imported.
- Cotton Incorporated published reports, the Apparel & Footwear PEFCR, and other public method/reference documents: no suitable combination of explicit open data rights, global process coverage, and compatible product scope was established for this estimator. PEFCR single-score and representative-product comparisons are not used.

## Scope decision

A complete global apparel/footwear product footprint cannot be supported responsibly by the bundled published score tables alone. The shipped product is therefore a process-factor calculator: useful for exploring source-published activity impacts, but not a full product LCA. This boundary is explicit in the interface and API; unsupported totals remain outside the product rather than appearing as unresolved or zero-valued results.
