# Open Data Source Register — Environmental Impact Analyzer

> **Status:** Research register only; no dataset is active or imported.
> **Last reviewed:** 2026-10-10
> **Decision:** Use only verifiably open, version-pinned data. This file records candidate rights and coverage; it is not legal advice or LCA-method approval.

## Open-data acceptance policy

A source is eligible for further review only when all data actually used have a clear, item-specific, versioned license that permits the intended use. Record attribution, adaptation, ShareAlike, redistribution, and downstream-user requirements. Verify licenses for datasets, methods/characterization factors, background databases, and any added reference distributions separately. A website calling a library “open source,” a public download link, an academic article license, or an older repository-wide submission policy is not by itself proof that every included record can be reused.

Do not access, import, reconstruct, or silently depend on proprietary, non-open, or unclear-license data. If an open-licensed published result relies on a non-open background database, it may only be considered as the specifically published and licensed result—not as an open full inventory. Disclose the limitation; if a use case requires an open, reproducible inventory, exclude that source. No alternate paid/commercial-license path is in scope.

The product remains global-market, multi-indicator, and has no combined score. Source availability does not approve a method, geography, functional unit, product boundary, privacy/retention policy, validation set, consumer claim, or score. All numeric assessment and environmental-claims gates remain closed.

## Reviewed sources

| Source and version | Rights evidence | What is potentially reusable | Coverage and material limitations | Project disposition |
|---|---|---|---|---|
| [Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0](https://zenodo.org/records/21102756), [pinned repository release](https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0) | The release identifies CC BY-SA 4.0. The current repository guidance describes attribution, license notices, change marking, and ShareAlike for adapted/recalculated values distributed through a product. Confirm that the current integration guidance applies to the pinned snapshot before use; do not assume it changes the application's code license. | Only the published impact-score CSVs and documented foreground parameters that are covered by the release license. If used, show linked attribution on the same result screen and make dataset-derived adaptations/recalculated values available under the required open ShareAlike terms. | 300+ process datasets and 16 EF 3.1/PEF indicators, not a complete global product inventory or reference distribution. The release's full Brightway/Activity Browser inventories are not distributed and use ecoinvent 3.12 in the background; those underlying inventories are not available under this dataset license. Do not obtain/reconstruct them or describe the full model as open. Regional production coverage and end-of-life/product mapping remain incomplete. | **Open-licensed-output candidate only; inactive.** Do not import or calculate until license scope/ShareAlike display, method, product mapping, indicator units, coverage, and independent validation are reviewed. If an assessment requires a fully open underlying inventory, exclude this candidate. |
| [Textile Exchange LCI Library](https://textileexchange.org/lci-library/) | The library describes itself as open source, but its page does not establish a blanket license for every included source record. Verify source-specific copyright/license and redistribution rights for each item. | Potential raw-material and initial-processing LCI records only, once each source record's open reuse license is established. | LCI inputs, not ready-made LCIA scores; raw-material production and initial processing only. Textile Exchange says it does not verify or endorse included data. | **Not eligible yet.** Do not download/import/use records with unverified or non-open item-level terms. |
| [Federal LCA Commons / USLCI](https://www.lcacommons.gov/quick-start-guide) | A repository, not a single uniform dataset license. Check the metadata and license of each selected record. The older 2018 submission-guideline PDF is a draft, not proof that all existing records share CC0. An example: [EPA USEEIO v1.1](https://lcacommons.gov/lca-collaboration/US_Environmental_Protection_Agency/USEEIO/datasets/Processes/31-33:%20Manufacturing/3116:%20Animal%20Slaughtering%20and%20Processing) explicitly states CC0 1.0. | Individual records explicitly released under CC0 or another compatible open license. | The cited USEEIO model represents the U.S. economy through input-output commodities; it is not a disaggregated global apparel product route. Dataset coverage and quality vary across the repository. | **Future candidate, record by record.** No dataset imported; the repository's public/open label is not sufficient. |
| [Cotton Incorporated 2016 LCA/LCI update](https://cottontoday.cottoninc.com/wp-content/uploads/2019/11/2016-LCA-Full-Report-Update.pdf) | The report is publicly reachable, but no explicit open data license for the report's underlying tables was verified during this scan. | None under the current open-only policy until the data license and redistribution rights are explicit. | Useful published background about cotton fibre/fabric and garment stages, but older data and not a reusable global apparel database by itself. | **Excluded pending rights.** Public access is not treated as open-data permission. |
| [Apparel & Footwear PEFCR v3.1](https://www.carbonfact.com/hubfs/A%26FW_PEFCR_v3.1.pdf) | A methodology/reference document, not an LCI dataset or a blanket license for underlying EF characterization/background data. Its document license does not automatically license datasets used by studies that follow it. | Method text for research/review only, subject to its own terms; no environmental factors imported from it. | EU-27, UK, and EFTA scope; full life cycle. Its B2C single score and representative-product comparisons must not be repurposed for this consumer service. | **Method reference only; not selected or approved.** |

## Source-specific notes

### Carbonfact v1.1.0

- Zenodo records CC BY-SA 4.0 for v1.1.0. The release publishes process-level impact scores and foreground parameters; it does not distribute full Brightway/Activity Browser inventories. The full-inventory dependency on ecoinvent 3.12 is a separate rights and reproducibility issue.
- The current repository's integration guidance calls for linked same-screen attribution, retaining notices and informing users about reuse obligations, marking changes, and sharing adapted/recalculated dataset values served through a product under CC BY-SA 4.0 or compatible terms. Verify applicability to the pinned v1.1.0 release before any reuse. Do not seek a separate non-open license as a workaround; exclude the source if the open terms cannot be met.
- Its 16 indicators are EF 3.1 / PEF indicators and use method-specific units. For example, WTU is m³ world-equivalent, not litres of physical water. The dataset's indicators and published values do not themselves approve a global consumer method.
- Pin the immutable release. The current main-branch changelog records post-v1.1.0 changes, so main must not be treated as the v1.1.0 snapshot.

### Textile Exchange and LCA Commons

- Textile Exchange's library is a discovery location for existing LCI material; the source page says raw materials and initial processing only and warns that included data are not verified/endorsed. Treat each item as a separate rights record.
- LCA Commons aggregates sources and repositories. Some entries explicitly state CC0, but access to the commons does not create a blanket license. Store the item URL/DOI, version, license text, geography, year, unit, boundary, and source lineage for each record.

## Operational status

- External datasets downloaded or imported: **none**.
- Factor matching or impact calculation performed: **none**.
- Numeric scoring and environmental claims: **disabled**.
- Candidate registry: Carbonfact v1.1.0, open-licensed published outputs only, all activation gates pending.

## Next review checklist

1. Verify the exact license scope for each dataset record and every underlying dependency that the service will actually use.
2. Define which open-licensed published scores may be reused without accessing their non-open background inventory, and document any resulting reproducibility limits.
3. Confirm attribution, ShareAlike, change-marking, and same-screen display obligations for the pinned Carbonfact release; if they cannot be met, exclude it.
4. Determine whether any source coverage supports the chosen global-market product scope, indicators, geography, boundaries, and reference unit without unsupported defaults.
5. Have LCA and legal/claims reviewers approve any calculation method and consumer-facing wording. Keep scores disabled until all other privacy, validation, and release gates are also closed.
