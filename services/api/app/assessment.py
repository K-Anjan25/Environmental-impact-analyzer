"""Assessment response assembly with an explicit no-score safety gate."""

from __future__ import annotations

from uuid import uuid4

from .schemas import (
    AssessmentResponse,
    ConfidenceResult,
    IndicatorResult,
    KnownFact,
    MappingRequirementStatus,
    ProcessMappingReadiness,
    ProcessMappingRequirement,
    ProductInput,
)

METHODOLOGY_VERSION = "prototype-no-score-v0.4"
CANDIDATE_SOURCE_ID = "carbonfact-apparel-footwear-v1.1.0"
CANDIDATE_SOURCE_VERSION = "1.1.0"
CANDIDATE_SOURCE_URL = (
    "https://github.com/carbonfact/lca-database-footwear-apparel/blob/"
    "v.1.1.0/README.md#whats-included"
)
NO_DATA_REASON = (
    "No reviewed, open-licensed environmental factors with compatible product coverage "
    "are configured. This indicator was not calculated."
)
WATER_NO_DATA_REASON = (
    "The product-level water method and unit are unresolved. A candidate EF 3.1 WTU "
    "factor is in m³ world-equivalent per process reference unit, not physical litres; "
    "no water value was calculated."
)


def _known_facts(product: ProductInput) -> list[KnownFact]:
    facts: list[KnownFact] = []
    for material in product.attributes.material_composition:
        facts.append(
            KnownFact(
                label="Material composition",
                value=f"{material.material}: {material.share_percent:g}%",
                provenance=material.provenance,
            )
        )
    if product.attributes.mass_g is not None:
        facts.append(
            KnownFact(
                label="Item mass",
                value=f"{product.attributes.mass_g:g} g",
                provenance=product.attributes.mass_provenance,
            )
        )
    if product.attributes.manufacturing_country:
        facts.append(
            KnownFact(
                label="Manufacturing location",
                value=product.attributes.manufacturing_country,
                provenance=product.attributes.manufacturing_country_provenance,
            )
        )
    for claim in product.attributes.certification_claims:
        facts.append(
            KnownFact(
                label="Certification wording (unverified)",
                value=claim,
                provenance=product.attributes.certification_claims_provenance,
            )
        )
    for entry in product.attributes.component_bom:
        facts.append(
            KnownFact(
                label="Component BOM entry (unverified)",
                value=(
                    f"{entry.component}: {entry.material}, "
                    f"{entry.share_percent_of_item:g}% of item mass"
                    + (f" · Reference: {entry.source_reference}" if entry.source_reference else "")
                ),
                provenance=entry.provenance,
            )
        )
    for evidence in product.attributes.process_evidence:
        details = [
            detail
            for detail in (
                f"Process: {evidence.process_description}"
                if evidence.process_description
                else None,
                f"Supplier reference unit: {evidence.reference_unit}"
                if evidence.reference_unit
                else None,
                f"Location: {evidence.country}" if evidence.country else None,
                f"Year: {evidence.year}" if evidence.year is not None else None,
                f"Reference: {evidence.source_reference}" if evidence.source_reference else None,
                f"Loss/waste note: {evidence.loss_waste_notes}"
                if evidence.loss_waste_notes
                else None,
                f"Waste treatment: {evidence.waste_treatment}"
                if evidence.waste_treatment
                else None,
            )
            if detail
        ]
        facts.append(
            KnownFact(
                label=f"Process evidence · {evidence.stage.value.replace('_', ' ')} (unverified)",
                value=" · ".join(details),
                provenance=evidence.provenance,
            )
        )
    return facts


def _process_mapping_readiness(product: ProductInput) -> ProcessMappingReadiness:
    attributes = product.attributes
    composition_total = sum(material.share_percent for material in attributes.material_composition)
    composition_status: MappingRequirementStatus
    if not attributes.material_composition and attributes.component_bom:
        composition_status = "partial"
        composition_details = (
            "Aggregate material shares are absent; component/material BOM rows are present but "
            "not normalized or reconciled against a product specification."
        )
        composition_next_step = (
            "Reconcile component rows to the product's aggregate material composition."
        )
    elif not attributes.material_composition:
        composition_status = "missing"
        composition_details = "No material shares were provided."
        composition_next_step = "Record each declared material and percentage, then verify it against a product specification."
    elif abs(composition_total - 100.0) <= 1e-6:
        composition_status = "provided"
        composition_details = (
            "Reported shares total 100%, but the claim is not independently verified and does not "
            "identify a component-level bill of materials."
        )
        composition_next_step = "Confirm the material shares and obtain component-level composition before selecting factors."
    else:
        composition_status = "partial"
        unreported_share = 100.0 - composition_total
        composition_details = (
            f"Reported shares total {composition_total:g}%; {unreported_share:g}% remains "
            "unreported and is unknown, not zero."
        )
        composition_next_step = "Resolve the unreported material share and verify the composition."

    mass_status: MappingRequirementStatus = (
        "provided" if attributes.mass_g is not None else "missing"
    )
    mass_details = (
        "An item mass is recorded, but its evidence still needs review and it is not a process input amount."
        if attributes.mass_g is not None
        else "No finished-item mass is recorded."
    )
    mass_next_step = (
        "Confirm net finished-item mass and distinguish it from packaging or shipping mass."
    )

    origin_status: MappingRequirementStatus = (
        "provided" if attributes.manufacturing_country else "missing"
    )
    origin_details = (
        "One product-origin country is recorded; it is not verified and does not locate every supply-chain stage."
        if attributes.manufacturing_country
        else "No product-origin country is recorded."
    )

    bom_share_total = sum(entry.share_percent_of_item for entry in attributes.component_bom)
    bom_status: MappingRequirementStatus
    if not attributes.component_bom:
        bom_status = "not_collected"
        bom_details = "No component-level material entries are recorded."
        bom_next_step = "Add component/material rows with shares of total item mass when source evidence is available."
    elif abs(bom_share_total - 100.0) <= 1e-6:
        bom_status = "provided"
        bom_details = (
            "Reported component/material shares total 100%, but remain unverified and are not "
            "cross-checked against the aggregate composition."
        )
        bom_next_step = "Verify each component row against a product specification or supplier BOM."
    else:
        bom_status = "partial"
        unreported_bom_share = 100.0 - bom_share_total
        bom_details = (
            f"Reported component/material shares total {bom_share_total:g}%; "
            f"{unreported_bom_share:g}% remains unreported and unknown, not zero."
        )
        bom_next_step = "Resolve the missing component share and verify the BOM."

    route_records = [entry for entry in attributes.process_evidence if entry.process_description]
    route_status: MappingRequirementStatus = "partial" if route_records else "not_collected"
    route_details = (
        f"{len(route_records)} process description(s) are recorded; the list is not verified "
        "or confirmed complete for the selected boundary."
        if route_records
        else "No supplier process descriptions are recorded."
    )
    route_next_step = (
        "Use supplier or product-spec evidence to identify applicable technologies and archetypes; "
        "do not infer a route from the product label."
    )

    stage_location_records = [
        entry for entry in attributes.process_evidence if entry.country or entry.year is not None
    ]
    if stage_location_records:
        geography_status: MappingRequirementStatus = "partial"
        geography_details = (
            f"Stage-level location/year details are recorded for {len(stage_location_records)} "
            "entry/entries, but the required stages, geography match, and coverage have not been reviewed."
        )
    elif attributes.manufacturing_country:
        geography_status = "partial"
        geography_details = "The form records one product-origin country, not stage-specific locations or data years."
    else:
        geography_status = "missing"
        geography_details = (
            "No product-origin country or stage-specific location/year evidence is recorded."
        )

    reference_unit_records = [
        entry for entry in attributes.process_evidence if entry.reference_unit
    ]
    if reference_unit_records:
        reference_unit_status: MappingRequirementStatus = "partial"
        reference_unit_details = (
            f"Supplier-declared reference units are recorded for {len(reference_unit_records)} "
            "stage entry/entries, but no exact candidate-factor unit match, quantity basis, or "
            "conversion has been reviewed."
        )
    else:
        reference_unit_status = "not_collected"
        reference_unit_details = (
            "No supplier-declared stage output/reference units are recorded; the candidate uses "
            "different bases such as kilograms of yarn or fabric and pairs of shoes."
        )
    reference_unit_next_step = (
        "Compare each supplier-declared output and quantity basis with the exact factor reference "
        "unit; do not convert units without an approved method."
    )

    loss_waste_records = [
        entry
        for entry in attributes.process_evidence
        if entry.loss_waste_notes or entry.waste_treatment
    ]
    if loss_waste_records:
        loss_waste_status: MappingRequirementStatus = "partial"
        loss_waste_details = (
            f"Loss/waste notes are recorded for {len(loss_waste_records)} stage entry/entries, "
            "but evidence, quantities, factor-specific input requirements, coverage, and "
            "treatment routes have not been reviewed."
        )
    else:
        loss_waste_status = "not_collected"
        loss_waste_details = (
            "No stage-level loss or waste-treatment notes are recorded. The source says its "
            "Input required (kg) factors are applied externally: upstream inputs must be scaled "
            "and the lost material's waste treatment added separately."
        )

    loss_waste_next_step = (
        "After factor mapping is reviewed, verify stage-specific input/loss quantities and a "
        "justified waste-treatment route to prevent omissions or double counting."
    )

    requirements = [
        ProcessMappingRequirement(
            id="material-composition",
            label="Material composition",
            status=composition_status,
            details=composition_details,
            next_step=composition_next_step,
        ),
        ProcessMappingRequirement(
            id="item-mass",
            label="Finished-item mass",
            status=mass_status,
            details=mass_details,
            next_step=mass_next_step,
        ),
        ProcessMappingRequirement(
            id="component-bom",
            label="Component-level bill of materials",
            status=bom_status,
            details=bom_details,
            next_step=bom_next_step,
        ),
        ProcessMappingRequirement(
            id="product-origin",
            label="Product-origin claim",
            status=origin_status,
            details=origin_details,
            next_step=(
                "Verify what the label's 'made in' country represents; do not treat it as a "
                "verified origin for every upstream process."
            ),
        ),
        ProcessMappingRequirement(
            id="process-route",
            label="Fiber, textile, and assembly process route",
            status=route_status,
            details=(
                f"{route_details} The source has process-specific factors and reference units "
                "(for example, yarn, fabric, dyed textile, and assembled product); product subtype "
                "alone does not identify a matching route."
            ),
            next_step=route_next_step,
        ),
        ProcessMappingRequirement(
            id="stage-geography",
            label="Stage-specific geography and data year",
            status=geography_status,
            details=geography_details,
            next_step=(
                "Record the documented country/region and year for each included material and "
                "manufacturing stage; do not copy the final 'made in' country upstream."
            ),
        ),
        ProcessMappingRequirement(
            id="process-reference-unit",
            label="Stage output / reference unit",
            status=reference_unit_status,
            details=reference_unit_details,
            next_step=reference_unit_next_step,
        ),
        ProcessMappingRequirement(
            id="loss-and-waste",
            label="Process losses and waste treatment",
            status=loss_waste_status,
            details=loss_waste_details,
            next_step=loss_waste_next_step,
        ),
        ProcessMappingRequirement(
            id="use-phase",
            label="Use-phase scenario",
            status="not_selected",
            details=(
                "The product boundary is not selected. The candidate's use-phase datasets represent "
                "European consumer behavior and are not a universal care profile."
            ),
            next_step=(
                "Select whether use phase belongs in the approved boundary; if so, document the "
                "applicable care, frequency, lifetime, and geography scenario."
            ),
        ),
        ProcessMappingRequirement(
            id="end-of-life",
            label="End-of-life treatment",
            status="not_in_candidate",
            details=(
                "End-of-life treatment is not listed among the v1.1.0 process families recorded for "
                "this candidate source. No end-of-life factor is selected."
            ),
            next_step=(
                "If the approved boundary includes end of life, identify a separately reviewed source "
                "or document the limitation and exclusion."
            ),
        ),
    ]
    return ProcessMappingReadiness(
        source_id=CANDIDATE_SOURCE_ID,
        source_version=CANDIDATE_SOURCE_VERSION,
        source_url=CANDIDATE_SOURCE_URL,
        status="not_ready",
        scoring_enabled=False,
        note=(
            "This checklist reports mapping inputs only; it is not an LCA result, does not estimate "
            "impact, and cannot activate the candidate source. License and method gates remain separate."
        ),
        requirements=requirements,
    )


def build_assessment(product: ProductInput) -> AssessmentResponse:
    """Return a transparent partial result; no environmental values are fabricated."""

    missing: list[str] = []
    if not product.attributes.material_composition:
        missing.append("material composition")
    if product.attributes.mass_g is None:
        missing.append("item mass")
    if not product.attributes.manufacturing_country:
        missing.append("manufacturing location")

    return AssessmentResponse(
        assessment_id=str(uuid4()),
        product_name=product.name,
        category=product.category,
        subtype=product.subtype,
        status="not_scored",
        methodology_version=METHODOLOGY_VERSION,
        score=None,
        score_explanation=(
            "A combined score is not part of this product's scope. This prototype also does not "
            "calculate separate indicators yet because no reviewed open factors, compatible "
            "method, and product-coverage plan are configured."
        ),
        functional_unit="One finished item (input reference only; no result calculated)",
        boundary="Not assessed — no approved life-cycle dataset is configured",
        confidence=ConfidenceResult(
            level="not_assessed",
            drivers=[
                "Environmental factors and a reviewed category reference set are not configured."
            ],
        ),
        indicators=[
            IndicatorResult(
                name="climate",
                label="Climate impact",
                unit="kg CO₂e/item",
                status="unavailable",
                reason=NO_DATA_REASON,
            ),
            IndicatorResult(
                name="water",
                label="Water-use impact",
                unit="Not selected",
                status="unavailable",
                reason=WATER_NO_DATA_REASON,
            ),
        ],
        process_mapping_readiness=_process_mapping_readiness(product),
        known_facts=_known_facts(product),
        data_gaps=missing,
        limitations=[
            "This prototype does not calculate or estimate environmental impact.",
            "User-provided and extracted product claims are not independently verified.",
            "Separate indicator values require reviewed open-licensed factors, compatible methods, product coverage, and independent validation; a combined score is out of scope.",
            "This is not a PEFCR study; PEFCR v3.1 does not allow a single score for business-to-consumer communication or comparisons against its representative products.",
        ],
        next_steps=[
            "Review open-data rights, indicator boundaries, and product coverage before enabling any separate indicator values.",
            "Where known, add component/material shares and supplier process evidence; keep undocumented stages unknown.",
            "Confirm item mass and product-origin claims before any future source matching.",
        ],
    )
