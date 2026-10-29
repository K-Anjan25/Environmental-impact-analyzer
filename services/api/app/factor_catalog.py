"""Load the pinned Carbonfact v1.1.0 process factor files."""

from __future__ import annotations

import csv
from collections import Counter
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Final, Literal

from .factor_schemas import (
    DataQualityScores,
    FactorCatalogResponse,
    IndicatorCalculation,
    IndicatorDefinition,
    IndicatorFactor,
    ProcessEstimateLine,
    ProcessEstimateRequest,
    ProcessEstimateResponse,
    ProcessFactor,
    ProcessFamilySummary,
)

SOURCE_ID: Final = "carbonfact-apparel-footwear-v1.1.0"
SOURCE_NAME: Final = "The Open Source LCA Database for Footwear & Apparel"
SOURCE_VERSION: Final = "1.1.0"
SOURCE_URL: Final = (
    "https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0"
)
METHODOLOGY_VERSION: Final = "published-process-factor-scaling-v1.0"
DATA_ROOT: Final = Path(__file__).resolve().parents[1] / "data" / "carbonfact-v1.1.0"


INDICATORS: Final[tuple[IndicatorDefinition, ...]] = (
    IndicatorDefinition(code="ACD", name="Acidification", unit="mol H⁺ eq"),
    IndicatorDefinition(code="ETF", name="Ecotoxicity, freshwater", unit="CTUe"),
    IndicatorDefinition(code="FRU", name="Fossil resource use", unit="MJ"),
    IndicatorDefinition(code="FWE", name="Eutrophication, freshwater", unit="kg P eq"),
    IndicatorDefinition(code="GHG", name="Climate change", unit="kg CO₂ eq"),
    IndicatorDefinition(
        code="HTC", name="Human toxicity, cancer", unit="CTUhtc", note="Cancer effects"
    ),
    IndicatorDefinition(
        code="HTN", name="Human toxicity, non-cancer", unit="CTUhtn", note="Non-cancer effects"
    ),
    IndicatorDefinition(code="IOR", name="Ionising radiation", unit="kBq U-235 eq"),
    IndicatorDefinition(code="LDU", name="Land use", unit="Pt"),
    IndicatorDefinition(code="MRU", name="Mineral resource use", unit="kg Sb eq"),
    IndicatorDefinition(code="OZD", name="Ozone depletion", unit="kg CFC-11 eq"),
    IndicatorDefinition(code="PCO", name="Photochemical ozone formation", unit="kg NMVOC eq"),
    IndicatorDefinition(code="PMA", name="Particulate matter", unit="disease incidence"),
    IndicatorDefinition(code="SWE", name="Eutrophication, marine", unit="kg N eq"),
    IndicatorDefinition(code="TRE", name="Eutrophication, terrestrial", unit="mol N eq"),
    IndicatorDefinition(
        code="WTU",
        name="Water use",
        unit="m³ world-eq",
        note="Water-use impact indicator; not a physical volume of water.",
    ),
)
INDICATOR_BY_CODE: Final = {indicator.code: indicator for indicator in INDICATORS}


@dataclass(frozen=True)
class DatasetSpec:
    family_id: str
    family_label: str
    group: Literal[
        "material-production",
        "textile-manufacturing",
        "garment-assembly",
        "footwear-assembly",
        "use-phase",
    ]
    path: str
    default_reference_unit: str | None
    reference_unit_note: str


DATASET_SPECS: Final[tuple[DatasetSpec, ...]] = (
    DatasetSpec(
        "spinning",
        "Yarn spinning",
        "textile-manufacturing",
        "datasets/spinning/impact-scores.csv",
        "1 kg yarn",
        "Per 1 kg of yarn; the activity may identify the fibre and spinning technology.",
    ),
    DatasetSpec(
        "knitting",
        "Knitting",
        "textile-manufacturing",
        "datasets/knitting/impact-scores.csv",
        "1 kg fabric",
        "Per 1 kg of knitted fabric or garment, as specified by the activity.",
    ),
    DatasetSpec(
        "weaving",
        "Weaving",
        "textile-manufacturing",
        "datasets/weaving/impact-scores.csv",
        "1 kg fabric",
        "Per 1 kg of woven fabric; input-loss metadata is displayed separately.",
    ),
    DatasetSpec(
        "dyeing",
        "Dyeing",
        "textile-manufacturing",
        "datasets/dyeing/impact-scores.csv",
        "1 kg dyed textile",
        "Per 1 kg of dyed textile; source methodology excludes pre-treatment.",
    ),
    DatasetSpec(
        "finishing",
        "Finishing and pre-treatment",
        "textile-manufacturing",
        "datasets/finishing/impact-scores.csv",
        "1 kg finished fabric",
        "Per 1 kg of finished fabric.",
    ),
    DatasetSpec(
        "printing",
        "Textile and garment printing",
        "textile-manufacturing",
        "datasets/printing/impact-scores.csv",
        "1 kg printed output",
        "Per 1 kg of printed fabric or garment, according to the activity.",
    ),
    DatasetSpec(
        "textile-assembly",
        "Textile / garment assembly",
        "garment-assembly",
        "datasets/textile-assembly/impact-scores.csv",
        "1 kg assembled product",
        "Per 1 kg of assembled apparel, accessory, or home-textile product.",
    ),
    DatasetSpec(
        "shoe-assembly-sneaker",
        "Sneaker assembly",
        "footwear-assembly",
        "datasets/shoe-assembly/sneaker/impact-scores.csv",
        "1 pair of footwear",
        "Per pair of sneakers.",
    ),
    DatasetSpec(
        "shoe-assembly-womens-boots",
        "Women's boots assembly",
        "footwear-assembly",
        "datasets/shoe-assembly/womens-boots/impact-scores.csv",
        "1 kg assembled footwear",
        "Per 1 kg of assembled women's boots.",
    ),
    DatasetSpec(
        "synthetic-pu-leather",
        "Synthetic PU leather",
        "material-production",
        "datasets/synthetic-pu-leather/impact-scores.csv",
        "1 m² PU leather",
        "Per 1 m² of synthetic PU leather (source description: 1.5–2 mm, approximately 1 kg).",
    ),
    DatasetSpec(
        "natural-rubber",
        "Natural rubber",
        "material-production",
        "datasets/natural-rubber/impact-scores.csv",
        "1 kg STR natural rubber",
        "Per 1 kg of technically specified rubber (STR), with source country codes.",
    ),
    DatasetSpec(
        "use-phase",
        "Garment use phase",
        "use-phase",
        "datasets/use-phase/impact-scores.csv",
        None,
        "Reference unit is supplied per activity (for example, 1 kg textile or 1 min ironing).",
    ),
)

GEOGRAPHY_LABELS: Final[dict[str, str]] = {
    "WORLD": "World",
    "GLO": "Global average",
    "VN": "Vietnam",
    "CN": "China",
    "IT": "Italy",
    "TH": "Thailand",
    "ID": "Indonesia",
    "CI": "Côte d’Ivoire",
    "EU": "Europe",
}


def _decimal(
    value: str | None, *, field_name: str, source_file: str, row_number: int
) -> Decimal | None:
    if value is None or not value.strip():
        return None
    try:
        parsed = Decimal(value.strip())
    except InvalidOperation as error:
        raise ValueError(
            f"Invalid numeric value for {field_name} in {source_file} row {row_number}."
        ) from error
    if not parsed.is_finite():
        raise ValueError(
            f"Non-finite numeric value for {field_name} in {source_file} row {row_number}."
        )
    return parsed


def _find_value(row: dict[str, str], *names: str) -> str | None:
    for name in names:
        value = row.get(name)
        if value is not None and value.strip():
            return value
    return None


def _geography(descriptor: str) -> tuple[str | None, str | None]:
    if "@" not in descriptor:
        return None, None
    code = descriptor.rsplit("@", maxsplit=1)[1].strip()
    if not code:
        return None, None
    return code, GEOGRAPHY_LABELS.get(code, code)


def _load_spec(spec: DatasetSpec) -> list[ProcessFactor]:
    path = DATA_ROOT / spec.path
    if not path.is_file():
        raise FileNotFoundError(f"Required factor file is missing: {path}")

    factors: list[ProcessFactor] = []
    with path.open("r", encoding="utf-8-sig", newline="") as source_file:
        reader = csv.DictReader(source_file)
        headers = set(reader.fieldnames or ())
        required_headers = {"descriptor", "Activity", *(item.code for item in INDICATORS)}
        missing_headers = required_headers - headers
        if missing_headers:
            raise ValueError(
                f"{spec.path} is missing columns: {', '.join(sorted(missing_headers))}"
            )

        for row_number, row in enumerate(reader, start=2):
            descriptor = (row.get("descriptor") or "").strip()
            activity = (row.get("Activity") or "").strip()
            if not descriptor or not activity:
                raise ValueError(f"Missing descriptor or Activity in {spec.path} row {row_number}.")

            reference_unit = _find_value(row, "Functional unit") or spec.default_reference_unit
            if not reference_unit:
                raise ValueError(f"No reference unit is defined for {spec.path} row {row_number}.")

            indicator_factors: list[IndicatorFactor] = []
            for definition in INDICATORS:
                value = _decimal(
                    row.get(definition.code),
                    field_name=definition.code,
                    source_file=spec.path,
                    row_number=row_number,
                )
                if value is None:
                    raise ValueError(
                        f"Missing {definition.code} factor in {spec.path} row {row_number}."
                    )
                indicator_factors.append(
                    IndicatorFactor(
                        code=definition.code,
                        name=definition.name,
                        unit=definition.unit,
                        source_factor_value=value,
                    )
                )

            quality_fields = {
                "precision": "P_dqr",
                "temporal_representativeness": "TiR_dqr",
                "technological_representativeness": "TeR_dqr",
                "geographical_representativeness": "GR_dqr",
            }
            quality_values = {
                target: _decimal(
                    row.get(column),
                    field_name=column,
                    source_file=spec.path,
                    row_number=row_number,
                )
                for target, column in quality_fields.items()
            }
            data_quality = (
                DataQualityScores(**quality_values)
                if any(value is not None for value in quality_values.values())
                else None
            )
            geography_code, geography_label = _geography(descriptor)
            input_required_kg = _decimal(
                _find_value(row, "Input_required_kg", "Input required (kg)"),
                field_name="Input required (kg)",
                source_file=spec.path,
                row_number=row_number,
            )

            factors.append(
                ProcessFactor(
                    id=descriptor,
                    family_id=spec.family_id,
                    family_label=spec.family_label,
                    activity=activity,
                    source_descriptor=descriptor,
                    geography_code=geography_code,
                    geography_label=geography_label,
                    reference_unit=reference_unit,
                    indicator_factors=indicator_factors,
                    data_quality=data_quality,
                    input_required_kg_per_reference_unit=input_required_kg,
                    source_file=spec.path,
                )
            )
    return factors


ALL_FACTORS: Final[tuple[ProcessFactor, ...]] = tuple(
    factor for spec in DATASET_SPECS for factor in _load_spec(spec)
)
FACTOR_BY_ID: Final[dict[str, ProcessFactor]] = {factor.id: factor for factor in ALL_FACTORS}
if len(FACTOR_BY_ID) != len(ALL_FACTORS):
    raise ValueError("The pinned source snapshot contains duplicate factor identifiers.")

_family_counts = Counter(factor.family_id for factor in ALL_FACTORS)
FAMILY_SUMMARIES: Final[tuple[ProcessFamilySummary, ...]] = tuple(
    ProcessFamilySummary(
        id=spec.family_id,
        label=spec.family_label,
        group=spec.group,
        record_count=_family_counts[spec.family_id],
        reference_unit_note=spec.reference_unit_note,
    )
    for spec in DATASET_SPECS
)
FAMILY_BY_ID: Final = {family.id: family for family in FAMILY_SUMMARIES}


def query_factors(
    *,
    family_id: str | None = None,
    query: str | None = None,
    offset: int = 0,
    limit: int = 500,
) -> FactorCatalogResponse:
    """Filter and paginate the static catalog without mutating source records."""

    if family_id is not None and family_id not in FAMILY_BY_ID:
        raise KeyError(family_id)
    normalized_query = (query or "").strip().casefold()
    matches = [
        factor
        for factor in ALL_FACTORS
        if (family_id is None or factor.family_id == family_id)
        and (
            not normalized_query
            or normalized_query in factor.activity.casefold()
            or normalized_query in factor.family_label.casefold()
            or normalized_query in factor.source_descriptor.casefold()
            or normalized_query in (factor.geography_label or "").casefold()
        )
    ]
    return FactorCatalogResponse(
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        source_version=SOURCE_VERSION,
        source_url=SOURCE_URL,
        total_records=len(matches),
        offset=offset,
        limit=limit,
        families=list(FAMILY_SUMMARIES),
        factors=matches[offset : offset + limit],
    )


def build_process_estimate(request: ProcessEstimateRequest) -> ProcessEstimateResponse:
    """Scale each published factor separately; never aggregate different process rows."""

    result_lines: list[ProcessEstimateLine] = []
    for selection in request.processes:
        factor = FACTOR_BY_ID.get(selection.factor_id)
        if factor is None:
            raise KeyError(selection.factor_id)

        results = [
            IndicatorCalculation(
                code=indicator.code,
                name=indicator.name,
                factor_value=indicator.source_factor_value,
                factor_unit=f"{indicator.unit} per {factor.reference_unit}",
                result_value=indicator.source_factor_value * selection.quantity,
                result_unit=indicator.unit,
            )
            for indicator in factor.indicator_factors
        ]
        result_lines.append(
            ProcessEstimateLine(
                factor_id=factor.id,
                family_id=factor.family_id,
                family_label=factor.family_label,
                activity=factor.activity,
                geography_code=factor.geography_code,
                geography_label=factor.geography_label,
                quantity=selection.quantity,
                reference_unit=factor.reference_unit,
                input_required_kg_per_reference_unit=factor.input_required_kg_per_reference_unit,
                data_quality=factor.data_quality,
                indicators=results,
                source_file=factor.source_file,
            )
        )

    return ProcessEstimateResponse(
        status="calculated",
        methodology_version=METHODOLOGY_VERSION,
        scope=(
            "The API scales each selected factor independently and returns separate process rows. "
            "The browser may summarize selected rows, but no complete product boundary is established."
        ),
        aggregation="none",
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        source_version=SOURCE_VERSION,
        source_url=SOURCE_URL,
        results=result_lines,
    )
