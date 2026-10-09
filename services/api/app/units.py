"""Explicit unit normalization helpers for user-provided product facts."""

from decimal import Decimal
from typing import Final

MAX_ITEM_MASS_G: Final[Decimal] = Decimal(100000)

_MASS_UNIT_TO_GRAMS: Final[dict[str, Decimal]] = {
    "mg": Decimal("0.001"),
    "milligram": Decimal("0.001"),
    "milligrams": Decimal("0.001"),
    "g": Decimal(1),
    "gram": Decimal(1),
    "grams": Decimal(1),
    "kg": Decimal(1000),
    "kilogram": Decimal(1000),
    "kilograms": Decimal(1000),
    "oz": Decimal("28.349523125"),
    "ounce": Decimal("28.349523125"),
    "ounces": Decimal("28.349523125"),
    "lb": Decimal("453.59237"),
    "lbs": Decimal("453.59237"),
    "pound": Decimal("453.59237"),
    "pounds": Decimal("453.59237"),
}


def normalize_mass_to_grams(value: Decimal, unit: str) -> Decimal:
    """Convert a positive mass to grams, rejecting unsupported or implausible input."""

    normalized_unit = unit.strip().casefold()
    try:
        factor = _MASS_UNIT_TO_GRAMS[normalized_unit]
    except KeyError as error:
        raise ValueError(f"Unsupported mass unit: {unit!r}.") from error

    if not value.is_finite() or value <= 0:
        raise ValueError("Mass must be a finite value greater than zero.")

    mass_g = value * factor
    if not mass_g.is_finite() or mass_g > MAX_ITEM_MASS_G:
        raise ValueError("Normalized item mass must not exceed 100,000 g.")
    return mass_g
