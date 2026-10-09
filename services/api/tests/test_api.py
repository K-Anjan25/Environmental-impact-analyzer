import asyncio
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient, Response

from app.main import app


def _send(method: str, path: str, payload: dict[str, Any] | None = None) -> Response:
    async def make_request() -> Response:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://testserver"
        ) as client:
            return await client.request(method, path, json=payload)

    return asyncio.run(make_request())


def test_health_and_methodology_disclose_disabled_scoring() -> None:
    assert _send("GET", "/healthz").json() == {"status": "ok"}
    response = _send("GET", "/api/v1/methodology")
    assert response.status_code == 200
    assert response.json()["scoring_enabled"] is False
    assert response.json()["version"] == "prototype-no-score-v0.4"
    assert response.json()["raw_descriptions_persisted"] is False
    assert response.json()["active_source_count"] == 0
    assert response.json()["candidate_source_count"] == 1


def test_candidate_source_registry_is_not_used_for_scoring() -> None:
    response = _send("GET", "/api/v1/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) == 1
    assert sources[0]["id"] == "carbonfact-apparel-footwear-v1.1.0"
    assert sources[0]["release_date"] == "2026-07-01"
    assert sources[0]["repository_url"].endswith("/v.1.1.0")
    assert sources[0]["license_review_status"] == "pending"
    assert sources[0]["method_review_status"] == "pending"
    assert {gate["id"] for gate in sources[0]["review_gates"]} == {
        "license-and-distribution",
        "product-process-mapping",
        "boundary-and-indicator-method",
        "reference-and-validation",
    }
    assert all(gate["status"] == "pending" for gate in sources[0]["review_gates"])
    assert sources[0]["changelog_url"].endswith("/CHANGELOG.md")
    assert sources[0]["active_for_scoring"] is False
    assert sources[0]["share_alike_required"] is True
    assert "same-screen attribution" in sources[0]["use_terms_summary"]
    assert sources[0]["attribution_text"].startswith("Data source:")
    assert {link["label"] for link in sources[0]["attribution_links"]} == {
        "Carbonfact source repository",
        "Carbonfact database page",
    }
    assert sources[0]["commercial_license_contact"] == "science@carbonfact.com"
    assert "ecoinvent 3.12" in sources[0]["background_database_note"]
    assert any("not a direct volume" in note for note in sources[0]["limitations"])


def test_extraction_suggests_facts_with_exact_evidence_spans() -> None:
    response = _send(
        "POST",
        "/api/v1/extractions/preview",
        {
            "category": "apparel",
            "description": "100% organic cotton T-shirt, 180 g. Made in India. GOTS certified.",
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["extractor_version"] == "rules-v0.2"
    candidates = result["candidates"]
    assert any(
        item["field"] == "material_composition"
        and item["value"] == {"material": "Organic Cotton", "share_percent": 100.0}
        and item["evidence_span"] == "100% organic cotton"
        for item in candidates
    )
    assert any(item["field"] == "mass_g" and item["value"]["mass_g"] == 180 for item in candidates)
    assert any(
        item["field"] == "manufacturing_country"
        and item["value"]["manufacturing_country"] == "India"
        for item in candidates
    )
    assert any(
        item["field"] == "certification_claim" and item["value"]["claim"] == "GOTS"
        for item in candidates
    )
    assert all(
        "not been independently verified" in item["note"]
        or "not been verified" in item["note"]
        or "not a certification verification" in item["note"]
        or "verify the item mass" in item["note"]
        for item in candidates
    )


def test_extraction_normalizes_supported_mass_units() -> None:
    for phrase, expected_mass_g in (("0.18 kg", 180.0), ("4 oz", 113.3980925), ("1 lb", 453.59237)):
        response = _send(
            "POST",
            "/api/v1/extractions/preview",
            {"category": "apparel", "description": f"Cotton shirt, {phrase}."},
        )
        assert response.status_code == 200
        candidates = response.json()["candidates"]
        mass = next(candidate for candidate in candidates if candidate["field"] == "mass_g")
        assert mass["value"]["mass_g"] == pytest.approx(expected_mass_g)
        assert mass["evidence_span"] == phrase


def test_extraction_rejects_ambiguous_or_non_item_mass_units() -> None:
    for description in ("Item mass 1,000 g.", "Fabric is 180 gsm.", "Item weighs 200 kg."):
        response = _send(
            "POST",
            "/api/v1/extractions/preview",
            {"category": "apparel", "description": description},
        )
        assert response.status_code == 200
        assert not any(item["field"] == "mass_g" for item in response.json()["candidates"])


def test_unrecognized_description_returns_no_candidates() -> None:
    response = _send(
        "POST",
        "/api/v1/extractions/preview",
        {"category": "apparel", "description": "A soft everyday essential."},
    )
    assert response.status_code == 200
    assert response.json()["candidates"] == []


def test_assessment_withholds_score_and_does_not_turn_missing_data_into_zero() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "t_shirt",
            "name": "Everyday tee",
            "attributes": {
                "material_composition": [
                    {
                        "material": "Cotton",
                        "share_percent": 100,
                        "provenance": "user_confirmed_extraction",
                    }
                ],
                "mass_g": 180,
                "mass_provenance": "user_provided",
                "manufacturing_country": None,
                "certification_claims": ["GOTS"],
                "certification_claims_provenance": "user_confirmed_extraction",
            },
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "not_scored"
    assert result["methodology_version"] == "prototype-no-score-v0.4"
    assert result["score"] is None
    assert result["confidence"]["level"] == "not_assessed"
    mapping = result["process_mapping_readiness"]
    assert mapping["source_id"] == "carbonfact-apparel-footwear-v1.1.0"
    assert mapping["source_version"] == "1.1.0"
    assert mapping["source_url"].endswith("README.md#whats-included")
    assert mapping["status"] == "not_ready"
    assert mapping["scoring_enabled"] is False
    requirements = {item["id"]: item for item in mapping["requirements"]}
    assert requirements["material-composition"]["status"] == "provided"
    assert requirements["item-mass"]["status"] == "provided"
    assert requirements["component-bom"]["status"] == "not_collected"
    assert requirements["process-route"]["status"] == "not_collected"
    assert requirements["process-reference-unit"]["status"] == "not_collected"
    assert requirements["stage-geography"]["status"] == "missing"
    assert requirements["loss-and-waste"]["status"] == "not_collected"
    assert requirements["use-phase"]["status"] == "not_selected"
    assert requirements["end-of-life"]["status"] == "not_in_candidate"
    assert result["product_name"] == "Everyday tee"
    assert {indicator["name"] for indicator in result["indicators"]} == {
        "climate",
        "water",
    }
    assert all(
        indicator["status"] == "unavailable" and indicator["value"] is None
        for indicator in result["indicators"]
    )
    water = next(indicator for indicator in result["indicators"] if indicator["name"] == "water")
    assert water["unit"] == "Not selected"
    assert "m³ world-equivalent" in water["reason"]
    assert "not physical litres" in water["reason"]
    assert result["data_gaps"] == ["manufacturing location"]
    assert "Cotton: 100%" in [fact["value"] for fact in result["known_facts"]]
    certification_fact = next(
        fact
        for fact in result["known_facts"]
        if fact["label"] == "Certification wording (unverified)"
    )
    assert certification_fact["provenance"] == "user_confirmed_extraction"


def test_mapping_readiness_keeps_unreported_composition_unknown() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Partial facts",
            "attributes": {"material_composition": [{"material": "Cotton", "share_percent": 70}]},
        },
    )

    assert response.status_code == 200
    result = response.json()
    requirements = {
        item["id"]: item for item in result["process_mapping_readiness"]["requirements"]
    }
    assert requirements["material-composition"]["status"] == "partial"
    assert "30% remains unreported" in requirements["material-composition"]["details"]
    assert "unknown, not zero" in requirements["material-composition"]["details"]
    assert requirements["item-mass"]["status"] == "missing"
    assert result["score"] is None
    assert result["process_mapping_readiness"]["scoring_enabled"] is False


def test_mapping_readiness_uses_unverified_component_and_stage_evidence() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Structured evidence fixture",
            "attributes": {
                "component_bom": [
                    {
                        "component": "Main fabric",
                        "material": "Cotton",
                        "share_percent_of_item": 90,
                        "source_reference": "Synthetic test fixture: supplier BOM",
                    }
                ],
                "process_evidence": [
                    {
                        "stage": "spinning",
                        "process_description": "Ring spinning",
                        "reference_unit": "1 kg yarn",
                        "country": "India",
                        "year": 2024,
                        "source_reference": "Synthetic test fixture: supplier record",
                        "loss_waste_notes": "Supplier notes cutting losses; unit not stated.",
                        "waste_treatment": "Supplier reports textile waste reuse; not verified.",
                    }
                ],
            },
        },
    )

    assert response.status_code == 200
    result = response.json()
    requirements = {
        item["id"]: item for item in result["process_mapping_readiness"]["requirements"]
    }
    assert requirements["component-bom"]["status"] == "partial"
    assert "10% remains unreported" in requirements["component-bom"]["details"]
    assert requirements["process-route"]["status"] == "partial"
    assert requirements["process-reference-unit"]["status"] == "partial"
    assert requirements["stage-geography"]["status"] == "partial"
    assert requirements["loss-and-waste"]["status"] == "partial"
    assert "quantities" in requirements["loss-and-waste"]["details"]
    assert any(
        fact["label"] == "Component BOM entry (unverified)"
        and "Synthetic test fixture" in fact["value"]
        for fact in result["known_facts"]
    )
    assert any(
        fact["label"] == "Process evidence · spinning (unverified)"
        and "Process: Ring spinning" in fact["value"]
        and "Supplier reference unit: 1 kg yarn" in fact["value"]
        and "Loss/waste note: Supplier notes cutting losses" in fact["value"]
        and "Waste treatment: Supplier reports textile waste reuse" in fact["value"]
        for fact in result["known_facts"]
    )
    assert result["score"] is None
    assert result["process_mapping_readiness"]["scoring_enabled"] is False


def test_process_evidence_requires_at_least_one_fact() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Empty process evidence",
            "attributes": {"process_evidence": [{"stage": "spinning"}]},
        },
    )
    assert response.status_code == 422


def test_process_evidence_year_is_bounded() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Out-of-range process year",
            "attributes": {
                "process_evidence": [{"stage": "spinning", "year": 2200}],
            },
        },
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    (
        ("reference_unit", "x" * 121),
        ("loss_waste_notes", "x" * 301),
        ("waste_treatment", "x" * 161),
    ),
)
def test_process_evidence_descriptions_are_bounded(field: str, value: str) -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Out-of-range process note",
            "attributes": {
                "process_evidence": [{"stage": "spinning", field: value}],
            },
        },
    )
    assert response.status_code == 422


def test_component_bom_shares_cannot_exceed_total_item_mass() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "shirt",
            "name": "Invalid component BOM",
            "attributes": {
                "component_bom": [
                    {"component": "Body", "material": "Cotton", "share_percent_of_item": 70},
                    {"component": "Trim", "material": "Polyester", "share_percent_of_item": 40},
                ]
            },
        },
    )
    assert response.status_code == 422


def test_category_and_subtype_must_match() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {"category": "apparel", "subtype": "shoes", "name": "A shoe"},
    )
    assert response.status_code == 422


def test_material_shares_above_100_percent_are_rejected() -> None:
    response = _send(
        "POST",
        "/api/v1/assessments",
        {
            "category": "apparel",
            "subtype": "t_shirt",
            "name": "Invalid example",
            "attributes": {
                "material_composition": [
                    {"material": "Cotton", "share_percent": 60},
                    {"material": "Polyester", "share_percent": 50},
                ]
            },
        },
    )
    assert response.status_code == 422
