"""Active, licensed data-source disclosure for process-only estimates."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from .factor_catalog import (
    ATTRIBUTION,
    BACKGROUND_DATABASE_NOTE,
    LICENSE_URL,
    SOURCE_LICENSE,
    SOURCE_NAME,
    SOURCE_URL,
)


class DataSourceLink(BaseModel):
    model_config = ConfigDict(frozen=True)

    label: str
    url: str


class DataSourceRecord(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    version: str
    release_date: str
    publisher: str
    source_url: str
    repository_url: str
    changelog_url: str
    license_name: str
    license_url: str
    license_terms_url: str
    license_status: Literal["applied"]
    method_basis: str
    use_terms_summary: str
    attribution_text: str
    attribution_links: list[DataSourceLink]
    share_alike_required: Literal[True]
    result_license: str
    background_database_note: str
    scope_summary: str
    factor_count: int
    family_count: int
    impact_indicators: list[str]
    limitations: list[str]
    active_for_process_estimates: Literal[True]


ACTIVE_SOURCES: tuple[DataSourceRecord, ...] = (
    DataSourceRecord(
        id="carbonfact-apparel-footwear-v1.1.0",
        name=SOURCE_NAME,
        version="1.1.0",
        release_date="2026-07-01",
        publisher="Carbonfact",
        source_url="https://zenodo.org/records/21102756",
        repository_url=SOURCE_URL,
        changelog_url=(
            "https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/CHANGELOG.md"
        ),
        license_name=SOURCE_LICENSE,
        license_url=LICENSE_URL,
        license_terms_url=(
            "https://github.com/carbonfact/lca-database-footwear-apparel/blob/"
            "v.1.1.0/README.md#license"
        ),
        license_status="applied",
        method_basis=(
            "The published process-level impact scores use EF 3.1 characterization across "
            "16 indicators. This application scales each source value by the quantity entered "
            "for the same source reference unit; it does not calculate or approve a product LCA."
        ),
        use_terms_summary=(
            "The pinned v1.1.0 source release identifies its published scores and documented "
            "foreground parameters as CC BY-SA 4.0. Source attribution is displayed on the "
            "calculation screen. Dataset-derived calculation outputs are offered under CC BY-SA "
            "4.0, and the source license notice is included with the data files."
        ),
        attribution_text=ATTRIBUTION,
        attribution_links=[
            DataSourceLink(label="Pinned source repository", url=SOURCE_URL),
            DataSourceLink(
                label="Zenodo release record", url="https://zenodo.org/records/21102756"
            ),
            DataSourceLink(
                label="CC BY-SA 4.0 license",
                url=LICENSE_URL,
            ),
        ],
        share_alike_required=True,
        result_license="CC BY-SA 4.0",
        background_database_note=BACKGROUND_DATABASE_NOTE,
        scope_summary=(
            "302 published score rows loaded from 11 documented process families in the pinned "
            "v1.1.0 release: material production, textile manufacturing, garment and footwear "
            "assembly, and use phase. Each selected process is reported separately."
        ),
        factor_count=302,
        family_count=11,
        impact_indicators=[
            "ACD — Acidification (mol H⁺ eq)",
            "ETF — Ecotoxicity, freshwater (CTUe)",
            "FRU — Fossil resource use (MJ)",
            "FWE — Eutrophication, freshwater (kg P eq)",
            "GHG — Climate change (kg CO₂ eq)",
            "HTC — Human toxicity, cancer (CTUhtc)",
            "HTN — Human toxicity, non-cancer (CTUhtn)",
            "IOR — Ionising radiation (kBq U-235 eq)",
            "LDU — Land use (Pt)",
            "MRU — Mineral resource use (kg Sb eq)",
            "OZD — Ozone depletion (kg CFC-11 eq)",
            "PCO — Photochemical ozone formation (kg NMVOC eq)",
            "PMA — Particulate matter (disease incidence)",
            "SWE — Eutrophication, marine (kg N eq)",
            "TRE — Eutrophication, terrestrial (mol N eq)",
            "WTU — Water use (m³ world-equivalent; not physical water volume)",
        ],
        limitations=[
            "Results apply only to the selected published process factor and entered reference-unit quantity; selected rows are not added into a product total.",
            "This is not a full product footprint or a substitute for a product-specific life-cycle assessment. Product composition, unselected stages, distribution, and end of life are not inferred.",
            "Process reference units, modeled boundaries, and geography differ by source dataset. Select the factor that matches the intended process; no country or material route is inferred.",
            "The source-reported Input required (kg) parameter is displayed but not used to add upstream material burdens or waste-treatment flows.",
            "WTU is an EF 3.1 water-use impact indicator in m³ world-equivalent; it is not litres or a direct water-volume measurement.",
            "Use-phase records describe representative European consumer behavior even where a descriptor carries a GLO tag.",
            "The source's top-level documentation says 304 datasets; the included rows from the documented v1.1.0 families total 302. The non-woven folder is excluded because it is marked forthcoming and its CSV does not match its stated two-dataset summary.",
            "Some source datasets have no published DQR fields; no quality rating is inferred when it is absent.",
        ],
        active_for_process_estimates=True,
    ),
)
