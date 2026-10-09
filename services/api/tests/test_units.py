from decimal import Decimal

import pytest

from app.units import normalize_mass_to_grams


@pytest.mark.parametrize(
    ("value", "unit", "expected_g"),
    [
        ("180", "g", "180"),
        ("0.18", "kg", "180.00"),
        ("200000", "mg", "200.000"),
        ("4", "oz", "113.398092500"),
        ("1", "lb", "453.59237"),
        ("1", "pounds", "453.59237"),
    ],
)
def test_mass_normalization_is_explicit_and_dimensional(
    value: str, unit: str, expected_g: str
) -> None:
    assert normalize_mass_to_grams(Decimal(value), unit) == Decimal(expected_g)


@pytest.mark.parametrize(
    ("value", "unit"),
    [
        (Decimal(0), "g"),
        (Decimal(-1), "kg"),
        (Decimal("NaN"), "g"),
        (Decimal(101), "kg"),
        (Decimal(1), "litre"),
    ],
)
def test_mass_normalization_rejects_invalid_values_and_units(value: Decimal, unit: str) -> None:
    with pytest.raises(ValueError):
        normalize_mass_to_grams(value, unit)
