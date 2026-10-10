"""FastAPI service for openly licensed, process-level impact estimates."""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

from .factor_catalog import (
    ALL_FACTORS,
    INDICATORS,
    METHODOLOGY_VERSION,
    SOURCE_ID,
    SOURCE_NAME,
    SOURCE_URL,
    SOURCE_VERSION,
    build_process_estimate,
    query_factors,
)
from .factor_schemas import FactorCatalogResponse, ProcessEstimateRequest, ProcessEstimateResponse
from .sources import ACTIVE_SOURCES, DataSourceRecord

app = FastAPI(
    title="Environmental Impact Analyzer API",
    description=(
        "Scales openly licensed published apparel and footwear process factors by user-entered "
        "reference-unit quantities. Reports 16 EF 3.1 indicators separately. It does not "
        "produce a whole-product footprint or combined score."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)


@app.middleware("http")
async def security_headers(request: Request, call_next: RequestResponseEndpoint) -> Response:
    """Apply conservative browser headers; request bodies are never logged here."""

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


@app.get("/healthz", tags=["operations"])
def healthcheck() -> dict[str, object]:
    """Return a readiness signal only when the bundled factor catalog loaded."""

    return {"status": "ok", "factor_records": len(ALL_FACTORS), "source_version": SOURCE_VERSION}


@app.get("/api/v1/methodology", tags=["methodology"])
def methodology() -> dict[str, object]:
    """Describe the implemented arithmetic, data boundary, and non-goals."""

    return {
        "version": METHODOLOGY_VERSION,
        "formula": "source impact factor × user-entered quantity in the factor reference unit",
        "process_estimates_enabled": True,
        "product_footprint_enabled": False,
        "combined_score_enabled": False,
        "aggregation": "none; every selected process is reported separately",
        "indicator_count": len(INDICATORS),
        "factor_record_count": len(ALL_FACTORS),
        "source_id": SOURCE_ID,
        "source_name": SOURCE_NAME,
        "source_version": SOURCE_VERSION,
        "source_url": SOURCE_URL,
        "active_source_count": len(ACTIVE_SOURCES),
        "factor_catalog": "/api/v1/factors",
        "source_registry": "/api/v1/sources",
        "privacy": {
            "assessment_persistence": False,
            "request_body_logging": False,
            "account_or_history": False,
        },
        "data_policy": {
            "mode": "open_only",
            "active_source_count": len(ACTIVE_SOURCES),
            "result_license": "CC BY-SA 4.0",
            "note": (
                "Only the pinned release's published impact-score files and process-family "
                "notes are bundled. The source's published scores may reflect ecoinvent 3.12 "
                "background contributions; the underlying inventories are not included, queried, "
                "or reconstructed."
            ),
        },
        "scope_note": (
            "Outputs are selected-process results, not a sum across life-cycle stages and not a "
            "complete product footprint. Source process boundaries and reference units vary."
        ),
    }


@app.get("/api/v1/sources", response_model=list[DataSourceRecord], tags=["sources"])
def list_active_sources() -> list[DataSourceRecord]:
    """List the open-licensed source currently used by the process estimator."""

    return list(ACTIVE_SOURCES)


@app.get("/api/v1/factors", response_model=FactorCatalogResponse, tags=["factors"])
def list_factors(
    family: str | None = Query(default=None, max_length=80),
    q: str | None = Query(default=None, max_length=120),
    offset: int = Query(default=0, ge=0, le=10_000),
    limit: int = Query(default=500, ge=1, le=500),
) -> FactorCatalogResponse:
    """Return the pinned factor catalog, optionally filtered and paginated."""

    try:
        return query_factors(family_id=family, query=q, offset=offset, limit=limit)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Unknown process family.") from error


@app.post(
    "/api/v1/process-estimates",
    response_model=ProcessEstimateResponse,
    tags=["calculations"],
)
def calculate_process_estimates(request: ProcessEstimateRequest) -> ProcessEstimateResponse:
    """Scale factors independently and keep all indicators and process rows separate."""

    try:
        return build_process_estimate(request)
    except KeyError as error:
        raise HTTPException(
            status_code=422, detail="One or more factor IDs are not in this catalog."
        ) from error


if "WEB_DIST" in os.environ:
    WEB_DIST = Path(os.environ["WEB_DIST"]).resolve()
else:
    WEB_DIST = Path(__file__).resolve().parents[3] / "apps" / "web" / "dist"
if (WEB_DIST / "assets").is_dir() and (WEB_DIST / "index.html").is_file():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="web-assets")

    @app.get("/{path:path}", include_in_schema=False)
    def serve_web_app(path: str) -> FileResponse:
        """Serve the built SPA while leaving API and health routes as API routes."""

        if path.startswith(("api/", "healthz")):
            raise HTTPException(status_code=404, detail="Not found.")
        requested_path = (WEB_DIST / path).resolve()
        if WEB_DIST not in requested_path.parents and requested_path != WEB_DIST:
            raise HTTPException(status_code=404, detail="Not found.")
        if requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(WEB_DIST / "index.html")
