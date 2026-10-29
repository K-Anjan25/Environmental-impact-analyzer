"""API integration tests for the open-data process estimator."""

from __future__ import annotations

import asyncio
from decimal import Decimal
from typing import Any

from httpx import ASGITransport, AsyncClient, Response

from app.factor_catalog import ALL_FACTORS, FACTOR_BY_ID
from app.main import app


def _send(method: str, path: str, payload: dict[str, Any] | None = None) -> Response:
    async def make_request() -> Response:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://testserver"
        ) as client:
            return await client.request(method, path, json=payload)

    return asyncio.run(make_request())


def test_health_methodology_and_security_headers_are_production_oriented() -> None:
    response = _send("GET", "/healthz")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "factor_records": 302,
        "source_version": "1.1.0",
    }
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "x-frame-options" not in response.headers
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"

    methodology_response = _send("GET", "/api/v1/methodology")
    assert methodology_response.status_code == 200
    methodology = methodology_response.json()
    assert (
        methodology["formula"]
        == "source impact factor × user-entered quantity in the factor reference unit"
    )
    assert methodology["process_estimates_enabled"] is True
    assert methodology["product_footprint_enabled"] is False
    assert methodology["combined_score_enabled"] is True
    assert (
        methodology["combined_score_scope"]
        == "browser-calculated EF 3.1 single score for selected process rows only"
    )
    assert (
        methodology["aggregation"]
        == "the API returns independent rows; the browser sums only the selected rows"
    )
    assert methodology["indicator_count"] == 16
    assert methodology["factor_record_count"] == 302
    assert methodology["privacy"]["assessment_persistence"] is False
    assert methodology["privacy"]["request_body_logging"] is False

    assert "complete product footprint" in methodology["scope_note"]


def test_openapi_exposes_only_the_process_estimator_api() -> None:
    response = _send("GET", "/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert set(paths) == {
        "/healthz",
        "/api/v1/methodology",
        "/api/v1/factors",
        "/api/v1/process-estimates",
    }
    assert set(paths["/api/v1/process-estimates"]) == {"post"}
    assert not any("product" in path or "assessment" in path for path in paths)



def test_factor_catalog_contains_only_loaded_rows_and_all_16_separate_indicators() -> None:
    response = _send("GET", "/api/v1/factors?limit=500")
    assert response.status_code == 200
    catalog = response.json()
    assert catalog["total_records"] == 302
    assert catalog["offset"] == 0
    assert catalog["limit"] == 500
    assert len(catalog["factors"]) == 302
    assert len(catalog["families"]) == 12  # Sneaker and women's-boots units are separate variants.
    assert {factor["family_id"] for factor in catalog["factors"]} == {
        family["id"] for family in catalog["families"]
    }

    factor = catalog["factors"][0]
    assert (
        factor["id"]
        == "MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING/OPEN_END#SYNTHETIC_FIBERS/ACRYLIC?DTEX=200@WORLD"
    )
    assert factor["family_id"] == "spinning"
    assert factor["geography_code"] == "WORLD"
    assert factor["reference_unit"] == "1 kg yarn"
    assert len(factor["indicator_factors"]) == 16
    assert {item["code"] for item in factor["indicator_factors"]} == {
        "ACD",
        "ETF",
        "FRU",
        "FWE",
        "GHG",
        "HTC",
        "HTN",
        "IOR",
        "LDU",
        "MRU",
        "OZD",
        "PCO",
        "PMA",
        "SWE",
        "TRE",
        "WTU",
    }
    assert factor["input_required_kg_per_reference_unit"] == 1.1386
    assert factor["data_quality"]["precision"] == 2.02
    assert factor["data_quality"]["temporal_representativeness"] == 2.02
    assert factor["data_quality"]["technological_representativeness"] == 2.02
    assert factor["data_quality"]["geographical_representativeness"] == 3


def test_factor_catalog_search_filter_and_pagination() -> None:
    response = _send("GET", "/api/v1/factors?family=natural-rubber&q=Thailand&limit=10")
    assert response.status_code == 200
    catalog = response.json()
    assert catalog["total_records"] == 1
    assert len(catalog["factors"]) == 1
    assert catalog["factors"][0]["activity"] == "STR production [TH]"
    assert catalog["factors"][0]["reference_unit"] == "1 kg STR natural rubber"
    assert catalog["factors"][0]["input_required_kg_per_reference_unit"] is None
    assert catalog["factors"][0]["data_quality"] is None

    page = _send("GET", "/api/v1/factors?family=spinning&offset=4&limit=3")
    assert page.status_code == 200
    assert page.json()["total_records"] == 159
    assert page.json()["offset"] == 4
    assert len(page.json()["factors"]) == 3
    assert all(factor["family_id"] == "spinning" for factor in page.json()["factors"])

    unknown_family = _send("GET", "/api/v1/factors?family=unknown")
    assert unknown_family.status_code == 404


def test_process_estimate_scales_source_factor_and_keeps_indicators_separate() -> None:
    factor = ALL_FACTORS[0]
    quantity = Decimal("0.18")
    response = _send(
        "POST",
        "/api/v1/process-estimates",
        {"processes": [{"factor_id": factor.id, "quantity": str(quantity)}]},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "calculated"
    assert result["methodology_version"] == "published-process-factor-scaling-v1.0"
    assert result["aggregation"] == "none"
    assert result["source_version"] == "1.1.0"
    assert len(result["results"]) == 1

    line = result["results"][0]
    assert line["factor_id"] == factor.id
    assert line["activity"] == factor.activity
    assert line["quantity"] == float(quantity)
    assert line["reference_unit"] == "1 kg yarn"
    assert line["input_required_kg_per_reference_unit"] == 1.1386
    assert len(line["indicators"]) == 16
    ghg = next(indicator for indicator in line["indicators"] if indicator["code"] == "GHG")
    source_ghg = factor.indicator_factors[4].source_factor_value
    assert ghg["factor_value"] == float(source_ghg)
    assert ghg["factor_unit"] == "kg CO₂ eq per 1 kg yarn"
    assert ghg["result_value"] == float(source_ghg * quantity)
    assert ghg["result_unit"] == "kg CO₂ eq"
    water = next(indicator for indicator in line["indicators"] if indicator["code"] == "WTU")
    assert water["result_unit"] == "m³ world-eq"
    assert water["name"] == "Water use"
    assert not any(key in result for key in ("overall_total", "combined_score", "indicator_totals"))


def test_multiple_processes_return_independent_lines_without_a_combined_total() -> None:
    spinning = next(factor for factor in ALL_FACTORS if factor.family_id == "spinning")
    use_phase = next(factor for factor in ALL_FACTORS if factor.family_id == "use-phase")
    response = _send(
        "POST",
        "/api/v1/process-estimates",
        {
            "processes": [
                {"factor_id": spinning.id, "quantity": "0.25"},
                {"factor_id": use_phase.id, "quantity": "2"},
            ]
        },
    )
    assert response.status_code == 200
    result = response.json()
    assert len(result["results"]) == 2
    assert [line["factor_id"] for line in result["results"]] == [spinning.id, use_phase.id]
    assert result["results"][0]["reference_unit"] == "1 kg yarn"
    assert result["results"][1]["reference_unit"] == "1 kg textile"
    assert result["aggregation"] == "none"
    assert not any(
        key in result for key in ("totals", "indicator_totals", "product_footprint", "score")
    )
    assert all(len(line["indicators"]) == 16 for line in result["results"])


def test_shoe_variants_and_use_phase_keep_their_source_reference_units() -> None:
    sneaker = next(factor for factor in ALL_FACTORS if factor.family_id == "shoe-assembly-sneaker")
    boots = next(
        factor for factor in ALL_FACTORS if factor.family_id == "shoe-assembly-womens-boots"
    )
    ironing = next(factor for factor in ALL_FACTORS if "Ironing" in factor.activity)

    assert sneaker.reference_unit == "1 pair of footwear"
    assert boots.reference_unit == "1 kg assembled footwear"
    assert ironing.reference_unit == "1 min ironing"
    assert FACTOR_BY_ID[sneaker.id].input_required_kg_per_reference_unit == Decimal("1.086949")


def test_unknown_factors_and_invalid_quantities_are_rejected() -> None:
    unknown = _send(
        "POST",
        "/api/v1/process-estimates",
        {"processes": [{"factor_id": "not-a-source-factor", "quantity": 1}]},
    )
    assert unknown.status_code == 422
    assert "not in this catalog" in unknown.json()["detail"]

    for quantity in (0, -1, "NaN", "Infinity", "0.000000001"):
        response = _send(
            "POST",
            "/api/v1/process-estimates",
            {"processes": [{"factor_id": ALL_FACTORS[0].id, "quantity": quantity}]},
        )
        assert response.status_code == 422


def test_process_estimate_requires_between_one_and_25_rows() -> None:
    assert _send("POST", "/api/v1/process-estimates", {"processes": []}).status_code == 422
    over_limit = [{"factor_id": ALL_FACTORS[0].id, "quantity": 1} for _ in range(26)]
    assert _send("POST", "/api/v1/process-estimates", {"processes": over_limit}).status_code == 422


def test_factor_files_and_runtime_catalog_have_the_same_unique_ids() -> None:
    assert len(ALL_FACTORS) == 302
    assert len(FACTOR_BY_ID) == 302
    assert all(len(factor.indicator_factors) == 16 for factor in ALL_FACTORS)
    assert all(factor.family_id != "non-woven" for factor in ALL_FACTORS)
