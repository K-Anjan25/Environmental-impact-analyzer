"""Disclose candidate datasets without activating them for calculations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class DataSourceLink(BaseModel):
    model_config = ConfigDict(frozen=True)

    label: str
    url: str


class SourceReviewGate(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    title: str
    details: str
    status: Literal["pending"]


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
    license_review_status: Literal["pending"]
    method_review_status: Literal["pending"]
    review_gates: list[SourceReviewGate]
    use_terms_summary: str
    attribution_text: str
    attribution_links: list[DataSourceLink]
    share_alike_required: Literal[True]
    background_database_note: str
    commercial_license_contact: str
    scope_summary: str
    impact_indicators: list[str]
    limitations: list[str]
    active_for_scoring: Literal[False]


CANDIDATE_SOURCES: tuple[DataSourceRecord, ...] = (
    DataSourceRecord(
        id="carbonfact-apparel-footwear-v1.1.0",
        name="Carbonfact Open Source LCA Database for Footwear & Apparel",
        version="1.1.0",
        release_date="2026-07-01",
        publisher="Carbonfact",
        source_url="https://zenodo.org/records/21102756",
        repository_url="https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0",
        changelog_url="https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/CHANGELOG.md",
        license_name="CC BY-SA 4.0 (as stated by the source repository)",
        license_url="https://creativecommons.org/licenses/by-sa/4.0/",
        license_terms_url="https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/README.md#license",
        license_review_status="pending",
        method_review_status="pending",
        review_gates=[
            SourceReviewGate(
                id="license-and-distribution",
                title="Confirm reuse and distribution terms",
                details=(
                    "Ask whether current product-integration guidance applies to v1.1.0 "
                    "and whether an adapted product result can be served under compatible terms."
                ),
                status="pending",
            ),
            SourceReviewGate(
                id="product-process-mapping",
                title="Map product BOM to process factors",
                details=(
                    "Review component-level composition, process route, geography, process "
                    "reference units, input-required losses, and waste treatment."
                ),
                status="pending",
            ),
            SourceReviewGate(
                id="boundary-and-indicator-method",
                title="Approve boundary and indicator interpretation",
                details=(
                    "Define the product study boundary and method. EF 3.1 WTU is "
                    "m³ world-equivalent, not a physical water-volume measure."
                ),
                status="pending",
            ),
            SourceReviewGate(
                id="reference-and-validation",
                title="Review coverage and validation",
                details=(
                    "The candidate is not a product reference distribution; define a "
                    "supported indicator-only use and independent validation plan."
                ),
                status="pending",
            ),
        ],
        use_terms_summary=(
            "The v1.1.0 release states CC BY-SA 4.0 and permits commercial use subject to "
            "attribution and ShareAlike. The publisher's current product-integration guidance "
            "requires linked, same-screen attribution; retaining the license notice and telling "
            "customers about reuse obligations; marking changes; and releasing adapted or "
            "recalculated values served through a product under CC BY-SA 4.0 (or a compatible "
            "license). Confirm whether this guidance applies to pinned v1.1.0 with the publisher "
            "and legal counsel before integration."
        ),
        attribution_text=(
            "Data source: The Carbonfact Open Source LCA Database for Footwear & Apparel, "
            "CC BY-SA 4.0."
        ),
        attribution_links=[
            DataSourceLink(
                label="Carbonfact source repository",
                url="https://github.com/carbonfact/lca-database-footwear-apparel",
            ),
            DataSourceLink(
                label="Carbonfact database page",
                url="https://www.carbonfact.com/database",
            ),
        ],
        share_alike_required=True,
        background_database_note=(
            "The repository openly shares pre-calculated impact-score CSVs; full Brightway / "
            "Activity Browser inventories are not distributed. Reproducing or using those "
            "full inventories requires separate ecoinvent 3.12 rights, which this dataset "
            "license does not grant."
        ),
        commercial_license_contact="science@carbonfact.com",
        scope_summary=(
            "Candidate process-level footwear/textile LCA factors (304 datasets in "
            "release v1.1.0) with EF 3.1 indicator scores and data-quality metadata; "
            "not a ready-made product footprint or category reference distribution."
        ),
        impact_indicators=[
            "GHG — climate change (kg CO₂e per process reference unit)",
            "WTU — water use (m³ world-equivalent per process reference unit)",
            "Other EF 3.1 impact indicators are present in the source dataset.",
        ],
        limitations=[
            "Process factors require reviewed product/BOM and process-route modeling; units and boundaries vary by process.",
            "WTU is a water-use impact indicator, not a direct volume of physical water in litres.",
            "The source describes the release as early/evolving. Its current main-branch changelog includes post-v1.1.0 score updates and withdrawn inventory/contribution files; use the pinned Zenodo/tag snapshot for any reproducible review.",
            "The source says full background inventory files are not distributed and identifies ecoinvent 3.12 as background data; verify downstream use and redistribution rights for this application.",
            "No product-level reference distribution or approved analyzer scoring method is supplied by this registry entry.",
            "CSV input-required mass fields vary in naming/spacing; loss and waste modeling needs schema normalization and expert review before scaling factors.",
        ],
        active_for_scoring=False,
    ),
)
