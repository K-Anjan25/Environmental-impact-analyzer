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
    license_clarification_contact: str
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
        license_terms_url="https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/README.md#if-you-integrate-this-database-into-a-product-or-platform",
        license_review_status="pending",
        method_review_status="pending",
        review_gates=[
            SourceReviewGate(
                id="license-and-distribution",
                title="Confirm open-license scope and obligations",
                details=(
                    "Confirm which published v1.1.0 content is covered by CC BY-SA 4.0, "
                    "whether current same-screen and ShareAlike guidance applies, and "
                    "whether the service can meet those open-license obligations. Exclude "
                    "the source if open terms are insufficient or unclear."
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
            "The pinned v1.1.0 release states CC BY-SA 4.0 for its published impact scores and "
            "documented foreground parameters. The publisher's current product-integration "
            "guidance calls for linked same-screen attribution, retaining notices and informing "
            "users about reuse obligations, marking changes, and distributing adapted or "
            "recalculated dataset values served through a product under CC BY-SA 4.0 or compatible "
            "open terms. Confirm that this guidance and license scope apply to the pinned release "
            "before use. If the open terms cannot be verified or met, exclude this source."
        ),
        attribution_text=(
            "Data source: The Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0, "
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
            "Only the release's published impact-score CSVs and covered foreground parameters "
            "are candidates under its stated open license. Full Brightway / Activity Browser "
            "inventories are not distributed and use ecoinvent 3.12 in the background. Those "
            "inventories are not open under this release and will not be accessed or reconstructed."
        ),
        license_clarification_contact="science@carbonfact.com",
        scope_summary=(
            "Candidate open-licensed published process-level footwear/textile impact scores "
            "and foreground parameters (304 datasets in release v1.1.0) with EF 3.1 indicators "
            "and data-quality metadata; not a full open inventory, ready-made product footprint, "
            "or category reference distribution."
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
            "Full background inventory files are not distributed and use ecoinvent 3.12; do not access, reconstruct, or describe them as open. Only the specifically published, CC BY-SA-covered output content may be considered.",
            "If the open-license scope or ShareAlike obligations cannot be verified or met, exclude this source rather than seeking a non-open license.",
            "No product-level reference distribution or approved analyzer scoring method is supplied by this registry entry.",
            "CSV input-required mass fields vary in naming/spacing; loss and waste modeling needs schema normalization and expert review before scaling factors.",
        ],
        active_for_scoring=False,
    ),
)
