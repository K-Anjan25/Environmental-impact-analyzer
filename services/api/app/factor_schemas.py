"""Response and request contracts for open-data process-factor estimates."""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class NumericResponseModel(BaseModel):
    model_config = ConfigDict(frozen=True)

    @field_serializer("*", when_used="json")
    def serialize_decimal_values(self, value: object) -> object:
        if isinstance(value, Decimal):
            return float(value)
        return value


class IndicatorDefinition(NumericResponseModel):
    code: str
    name: str
    unit: str
    note: str | None = None


class IndicatorFactor(NumericResponseModel):
    code: str
    name: str
    unit: str
    source_factor_value: Decimal


class DataQualityScores(NumericResponseModel):
    precision: Decimal | None = None
    technological_representativeness: Decimal | None = None
    temporal_representativeness: Decimal | None = None
    geographical_representativeness: Decimal | None = None


class ProcessFamilySummary(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    label: str
    group: Literal[
        "material-production",
        "textile-manufacturing",
        "garment-assembly",
        "footwear-assembly",
        "use-phase",
    ]
    record_count: int
    reference_unit_note: str


class ProcessFactor(NumericResponseModel):
    id: str
    family_id: str
    family_label: str
    activity: str
    source_descriptor: str
    geography_code: str | None = None
    geography_label: str | None = None
    reference_unit: str
    indicator_factors: list[IndicatorFactor]
    data_quality: DataQualityScores | None = None
    input_required_kg_per_reference_unit: Decimal | None = None
    source_file: str


class FactorCatalogResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    source_id: str
    source_name: str
    source_version: str
    source_url: str
    license_name: str
    attribution_text: str
    license_url: str
    result_license: str
    background_database_note: str
    total_records: int
    offset: int
    limit: int
    families: list[ProcessFamilySummary]
    factors: list[ProcessFactor]


class ProcessSelection(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, frozen=True)

    factor_id: str = Field(min_length=1, max_length=500)
    quantity: Decimal = Field(gt=0, le=1_000_000_000, max_digits=20, decimal_places=8)


class ProcessEstimateRequest(BaseModel):
    model_config = ConfigDict(frozen=True)

    processes: list[ProcessSelection] = Field(min_length=1, max_length=25)


class IndicatorCalculation(NumericResponseModel):
    code: str
    name: str
    factor_value: Decimal
    factor_unit: str
    result_value: Decimal
    result_unit: str


class ProcessEstimateLine(NumericResponseModel):
    factor_id: str
    family_id: str
    family_label: str
    activity: str
    geography_code: str | None = None
    geography_label: str | None = None
    quantity: Decimal
    reference_unit: str
    input_required_kg_per_reference_unit: Decimal | None = None
    data_quality: DataQualityScores | None = None
    indicators: list[IndicatorCalculation]
    source_file: str


class ProcessEstimateResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    status: Literal["calculated"]
    methodology_version: str
    scope: str
    aggregation: Literal["none"]
    source_id: str
    source_name: str
    source_version: str
    source_url: str
    license_name: str
    attribution_text: str
    license_url: str
    background_database_note: str
    result_license: str
    results: list[ProcessEstimateLine]
