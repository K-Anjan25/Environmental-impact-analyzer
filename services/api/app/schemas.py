"""Validated API contracts for the documentation-first prototype."""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MappingRequirementStatus = Literal[
    "provided",
    "partial",
    "missing",
    "not_collected",
    "not_selected",
    "not_in_candidate",
]


class Category(str, Enum):
    APPAREL = "apparel"
    FOOTWEAR = "footwear"


class FactProvenance(str, Enum):
    USER_PROVIDED = "user_provided"
    USER_CONFIRMED_EXTRACTION = "user_confirmed_extraction"


class ProcessStage(str, Enum):
    MATERIAL_PRODUCTION = "material_production"
    SPINNING = "spinning"
    KNITTING = "knitting"
    WEAVING = "weaving"
    DYEING = "dyeing"
    PRINTING = "printing"
    FINISHING = "finishing"
    TEXTILE_ASSEMBLY = "textile_assembly"
    SHOE_ASSEMBLY = "shoe_assembly"
    OTHER = "other"


class MaterialShare(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    material: str = Field(min_length=1, max_length=80)
    share_percent: float = Field(gt=0, le=100)
    provenance: FactProvenance = FactProvenance.USER_PROVIDED


class ComponentBOMEntry(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    component: str = Field(min_length=1, max_length=80)
    material: str = Field(min_length=1, max_length=80)
    share_percent_of_item: float = Field(gt=0, le=100)
    source_reference: str | None = Field(default=None, max_length=500)
    provenance: FactProvenance = FactProvenance.USER_PROVIDED


class ProcessStageEvidence(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    stage: ProcessStage
    process_description: str | None = Field(default=None, max_length=160)
    reference_unit: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, min_length=1, max_length=100)
    year: int | None = Field(default=None, ge=1900, le=2100)
    source_reference: str | None = Field(default=None, max_length=500)
    loss_waste_notes: str | None = Field(default=None, max_length=300)
    waste_treatment: str | None = Field(default=None, max_length=160)
    provenance: FactProvenance = FactProvenance.USER_PROVIDED

    @model_validator(mode="after")
    def at_least_one_detail_is_present(self) -> ProcessStageEvidence:
        if not any(
            (
                self.process_description,
                self.reference_unit,
                self.country,
                self.year is not None,
                self.source_reference,
                self.loss_waste_notes,
                self.waste_treatment,
            )
        ):
            raise ValueError(
                "Add a process detail, location, year, source reference, or loss/waste note."
            )
        return self


class ProductAttributes(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    material_composition: list[MaterialShare] = Field(default_factory=list, max_length=20)
    mass_g: float | None = Field(default=None, gt=0, le=100_000)
    mass_provenance: FactProvenance = FactProvenance.USER_PROVIDED
    manufacturing_country: str | None = Field(default=None, min_length=1, max_length=100)
    manufacturing_country_provenance: FactProvenance = FactProvenance.USER_PROVIDED
    certification_claims: list[str] = Field(default_factory=list, max_length=20)
    certification_claims_provenance: FactProvenance = FactProvenance.USER_PROVIDED
    component_bom: list[ComponentBOMEntry] = Field(default_factory=list, max_length=100)
    process_evidence: list[ProcessStageEvidence] = Field(default_factory=list, max_length=50)

    @field_validator("certification_claims")
    @classmethod
    def trim_claims(cls, claims: list[str]) -> list[str]:
        cleaned = [claim.strip() for claim in claims if claim.strip()]
        if any(len(claim) > 100 for claim in cleaned):
            raise ValueError("Certification claims must be 100 characters or fewer.")
        return cleaned

    @model_validator(mode="after")
    def composition_must_not_exceed_100_percent(self) -> ProductAttributes:
        total = sum(item.share_percent for item in self.material_composition)
        if total > 100.000001:
            raise ValueError("Known material percentages cannot total more than 100%.")
        return self

    @model_validator(mode="after")
    def component_bom_shares_must_not_exceed_item(self) -> ProductAttributes:
        total = sum(item.share_percent_of_item for item in self.component_bom)
        if total > 100.000001:
            raise ValueError("Component BOM shares cannot total more than 100% of the item.")
        return self


class ProductInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    category: Category
    subtype: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=120)
    attributes: ProductAttributes = Field(default_factory=ProductAttributes)

    @model_validator(mode="after")
    def category_must_match_subtype(self) -> ProductInput:
        apparel_subtypes = {
            "t_shirt",
            "shirt",
            "jeans",
            "sweater",
            "jacket",
            "dress",
            "other",
        }
        footwear_subtypes = {"shoes", "other"}
        allowed = apparel_subtypes if self.category == Category.APPAREL else footwear_subtypes
        if self.subtype not in allowed:
            raise ValueError("Item type must belong to the selected category.")
        return self


class ExtractionPreviewRequest(BaseModel):
    category: Category
    description: str = Field(min_length=1, max_length=5_000)


class ExtractionCandidate(BaseModel):
    field: Literal[
        "material_composition",
        "mass_g",
        "manufacturing_country",
        "certification_claim",
    ]
    value: dict[str, str | float]
    evidence_span: str
    match_quality: Literal["clear", "possible"] = "clear"
    note: str = "Pattern match only; this claim has not been independently verified."


class ExtractionPreviewResponse(BaseModel):
    extractor_version: str
    candidates: list[ExtractionCandidate]
    message: str


class IndicatorResult(BaseModel):
    name: Literal["climate", "water"]
    label: str
    unit: str
    status: Literal["unavailable"]
    value: None = None
    reason: str


class ConfidenceResult(BaseModel):
    level: Literal["not_assessed"]
    drivers: list[str]


class KnownFact(BaseModel):
    label: str
    value: str
    provenance: FactProvenance


class ProcessMappingRequirement(BaseModel):
    id: str
    label: str
    status: MappingRequirementStatus
    details: str
    next_step: str


class ProcessMappingReadiness(BaseModel):
    source_id: str
    source_version: str
    source_url: str
    status: Literal["not_ready"]
    scoring_enabled: Literal[False]
    note: str
    requirements: list[ProcessMappingRequirement]


class AssessmentResponse(BaseModel):
    assessment_id: str
    product_name: str
    category: Category
    subtype: str
    status: Literal["not_scored"]
    methodology_version: str
    score: None = None
    score_explanation: str
    functional_unit: str
    boundary: str
    confidence: ConfidenceResult
    indicators: list[IndicatorResult]
    process_mapping_readiness: ProcessMappingReadiness
    known_facts: list[KnownFact]
    data_gaps: list[str]
    limitations: list[str]
    next_steps: list[str]
