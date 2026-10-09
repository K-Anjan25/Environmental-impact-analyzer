"""Conservative rule-based attribute suggestions; never environmental scoring."""

from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

from .schemas import ExtractionCandidate, ExtractionPreviewResponse
from .units import normalize_mass_to_grams

EXTRACTOR_VERSION = "rules-v0.2"

# Match only a short, explicit allowlist. Longer material names precede their
# components so that "organic cotton" is kept together.
MATERIALS = (
    "recycled polyester",
    "organic cotton",
    "recycled cotton",
    "recycled wool",
    "polyamide",
    "polyester",
    "elastane",
    "spandex",
    "viscose",
    "rayon",
    "lyocell",
    "leather",
    "linen",
    "wool",
    "cotton",
    "nylon",
)
_MATERIAL_PATTERN = "|".join(re.escape(material) for material in MATERIALS)
_PERCENT = r"(?P<percent>\d{1,3}(?:[.,]\d+)?)"
MATERIAL_PERCENT_PATTERNS = (
    re.compile(rf"{_PERCENT}\s*%\s*(?P<material>{_MATERIAL_PATTERN})\b", re.IGNORECASE),
    re.compile(rf"\b(?P<material>{_MATERIAL_PATTERN})\s*{_PERCENT}\s*%", re.IGNORECASE),
)
_MASS_PATTERN = re.compile(
    r"\b(?P<mass>\d{1,5}(?:[.,]\d{1,3})?)\s*"
    r"(?P<unit>kilograms?|kg|milligrams?|mg|pounds?|lbs?|ounces?|oz|grams?|g)\b",
    re.IGNORECASE,
)
_COUNTRY_PATTERN = re.compile(
    r"\b(?:made|manufactured|produced)\s+in\s+"
    r"(?P<country>India|Bangladesh|Vietnam|China|Turkey|Türkiye|Italy|Portugal|"
    r"Sri Lanka|Indonesia|Pakistan|Cambodia)\b",
    re.IGNORECASE,
)
_CERTIFICATIONS = {
    "GOTS": re.compile(r"\bGOTS\b", re.IGNORECASE),
    "OEKO-TEX": re.compile(r"\bOEKO[- ]TEX\b", re.IGNORECASE),
    "Fair Trade": re.compile(r"\bFair\s+Trade\b", re.IGNORECASE),
}


def _candidate_materials(description: str) -> list[ExtractionCandidate]:
    candidates: list[ExtractionCandidate] = []
    seen_spans: set[str] = set()

    for pattern in MATERIAL_PERCENT_PATTERNS:
        for match in pattern.finditer(description):
            evidence = match.group(0)
            if evidence.casefold() in seen_spans:
                continue
            try:
                share = float(match.group("percent").replace(",", "."))
            except ValueError:
                continue
            if not 0 < share <= 100:
                continue
            material = " ".join(match.group("material").split()).title()
            candidates.append(
                ExtractionCandidate(
                    field="material_composition",
                    value={"material": material, "share_percent": share},
                    evidence_span=evidence,
                )
            )
            seen_spans.add(evidence.casefold())

    return candidates


def _parse_mass_value(raw_value: str) -> Decimal:
    """Parse a simple decimal value; reject ambiguous thousands separators."""

    if raw_value.count(".") + raw_value.count(",") > 1:
        raise ValueError("Ambiguous mass number format.")
    separator = "." if "." in raw_value else "," if "," in raw_value else None
    if separator and len(raw_value.rsplit(separator, maxsplit=1)[1]) == 3:
        raise ValueError("Ambiguous thousands separator in mass value.")
    try:
        return Decimal(raw_value.replace(",", "."))
    except InvalidOperation as error:
        raise ValueError("Invalid mass value.") from error


def extract_candidates(description: str) -> ExtractionPreviewResponse:
    """Return edit-ready suggestions with the exact matching text span."""

    candidates = _candidate_materials(description)

    mass_match = _MASS_PATTERN.search(description)
    if mass_match:
        try:
            mass_g = normalize_mass_to_grams(
                _parse_mass_value(mass_match.group("mass")), mass_match.group("unit")
            )
        except ValueError:
            mass_g = None
        if mass_g is not None:
            candidates.append(
                ExtractionCandidate(
                    field="mass_g",
                    value={"mass_g": float(mass_g)},
                    evidence_span=mass_match.group(0),
                    note="Unit-normalized pattern match; verify the item mass.",
                )
            )

    country_match = _COUNTRY_PATTERN.search(description)
    if country_match:
        country = country_match.group("country")
        normalized_country = (
            "Türkiye" if country.casefold() in {"turkey", "türkiye"} else country.title()
        )
        candidates.append(
            ExtractionCandidate(
                field="manufacturing_country",
                value={"manufacturing_country": normalized_country},
                evidence_span=country_match.group(0),
                note="Country phrase found in the description; it has not been verified.",
            )
        )

    for label, pattern in _CERTIFICATIONS.items():
        claim_match = pattern.search(description)
        if claim_match:
            candidates.append(
                ExtractionCandidate(
                    field="certification_claim",
                    value={"claim": label},
                    evidence_span=claim_match.group(0),
                    note="Claim wording only; this is not a certification verification.",
                )
            )

    message = (
        "Review every suggestion and confirm or edit it before continuing."
        if candidates
        else "No supported attribute patterns were found. You can still enter details manually."
    )
    return ExtractionPreviewResponse(
        extractor_version=EXTRACTOR_VERSION,
        candidates=candidates,
        message=message,
    )
