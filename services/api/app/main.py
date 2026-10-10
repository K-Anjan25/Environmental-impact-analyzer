"""FastAPI entry point for Environmental Impact Analyzer."""

from fastapi import FastAPI

from .assessment import METHODOLOGY_VERSION, build_assessment
from .extraction import EXTRACTOR_VERSION, extract_candidates
from .schemas import (
    AssessmentResponse,
    ExtractionPreviewRequest,
    ExtractionPreviewResponse,
    ProductInput,
)
from .sources import CANDIDATE_SOURCES, DataSourceRecord

app = FastAPI(
    title="Environmental Impact Analyzer API",
    description=(
        "Prototype API for reviewing product attributes. Only explicitly open-licensed "
        "data are eligible; separate indicators remain disabled until reviewed data and "
        "methods are available. Combined scores are outside product scope."
    ),
    version="0.1.0",
)


@app.get("/healthz", tags=["operations"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/methodology", tags=["methodology"])
def methodology() -> dict[str, object]:
    return {
        "version": METHODOLOGY_VERSION,
        "scoring_enabled": False,
        "reason": "Separate indicators require reviewed open-licensed factors, compatible methods, and product/geography coverage. Combined scores are outside the selected product scope.",
        "extractor_version": EXTRACTOR_VERSION,
        "raw_descriptions_persisted": False,
        "candidate_source_count": len(CANDIDATE_SOURCES),
        "active_source_count": sum(source.active_for_scoring for source in CANDIDATE_SOURCES),
        "source_registry": "/api/v1/sources",
        "data_policy": {
            "mode": "open_only",
            "active_source_count": 0,
            "note": "Only versioned data with explicit, item-specific open terms are eligible; non-open or unclear-license sources and dependencies are excluded.",
        },
    }


@app.get("/api/v1/sources", response_model=list[DataSourceRecord], tags=["sources"])
def list_candidate_sources() -> list[DataSourceRecord]:
    """List documented candidates; registry entries are not active factors."""

    return list(CANDIDATE_SOURCES)


@app.post(
    "/api/v1/extractions/preview",
    response_model=ExtractionPreviewResponse,
    tags=["extractions"],
)
def preview_extraction(request: ExtractionPreviewRequest) -> ExtractionPreviewResponse:
    """Suggest candidate product attributes without storing the source text."""

    return extract_candidates(request.description)


@app.post(
    "/api/v1/assessments",
    response_model=AssessmentResponse,
    tags=["assessments"],
)
def create_assessment(product: ProductInput) -> AssessmentResponse:
    """Return confirmed facts and a safe no-score result until data is reviewed."""

    return build_assessment(product)
