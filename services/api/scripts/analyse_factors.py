"""Clean, group, and summarise the published process factors.

Standard library only. Reads the 12 impact-scores CSV files the API loads, writes:
  docs/data/factors-clean.csv   one tidy row per process factor
  docs/data/factor-summary.md   a plain-language summary of groups, gaps, and checks

Run from the repository root:  python3 services/api/scripts/analyse_factors.py
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "services/api/data/carbonfact-v1.1.0/datasets"
OUT = ROOT / "docs/data"

INDICATORS = ["ACD", "ETF", "FRU", "FWE", "GHG", "HTC", "HTN", "IOR", "LDU", "MRU", "OZD", "PCO", "PMA", "SWE", "TRE", "WTU"]
INDICATOR_NAMES = {
    "ACD": "Acidification", "ETF": "Freshwater ecotoxicity", "FRU": "Fossil resource use",
    "FWE": "Freshwater eutrophication", "GHG": "Climate change", "HTC": "Human toxicity, cancer",
    "HTN": "Human toxicity, non-cancer", "IOR": "Ionising radiation", "LDU": "Land use",
    "MRU": "Mineral and metal resource use", "OZD": "Ozone depletion", "PCO": "Photochemical ozone formation",
    "PMA": "Particulate matter", "SWE": "Marine eutrophication", "TRE": "Terrestrial eutrophication",
    "WTU": "Water use",
}
FAMILY_LABEL = {
    "spinning": "Spinning (fibre to yarn)", "knitting": "Knitting", "weaving": "Weaving",
    "dyeing": "Dyeing", "finishing": "Finishing", "printing": "Printing",
    "textile-assembly": "Garment assembly", "shoe-assembly/sneaker": "Sneaker assembly",
    "shoe-assembly/womens-boots": "Boot assembly", "synthetic-pu-leather": "Synthetic leather",
    "natural-rubber": "Natural rubber", "use-phase": "Use phase (washing at home)",
}
GEO_LABEL = {"WORLD": "World average", "GLO": "Global average", "VN": "Vietnam", "CN": "China", "TH": "Thailand", "ID": "Indonesia", "CI": "Côte d'Ivoire"}


def clean(value: str | None) -> str:
    return (value or "").replace("\r", "").strip()


def number(value: str | None) -> float | None:
    text = clean(value)
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def geography(descriptor: str) -> str:
    match = re.search(r"@([A-Z]+)$", descriptor)
    return match.group(1) if match else "UNKNOWN"


def dtex(activity: str, descriptor: str) -> str:
    match = re.search(r"DTEX=(\d+)", descriptor) or re.search(r"(\d+)\s*dtex", activity)
    return match.group(1) if match else ""


def plain_group(descriptor: str, activity: str) -> str:
    """A short group label from the path after the first ':' (for example YARN_FORMATION/SPINNING/OPEN_END)."""
    path = descriptor.split(":", 1)[-1].split("#", 1)[0]
    parts = [p.replace("_", " ").lower() for p in path.split("/")]
    return " › ".join(parts[1:]) if len(parts) > 1 else (parts[0] if parts else activity)


def load() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for path in sorted(DATA.glob("**/impact-scores.csv")):
        family = str(path.parent.relative_to(DATA))
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            header_input = next((h for h in reader.fieldnames or [] if h.lower().startswith("input")), "")
            for raw in reader:
                descriptor = clean(raw.get("descriptor"))
                activity = clean(raw.get("Activity"))
                if not descriptor:
                    continue
                record: dict[str, object] = {
                    "family": family,
                    "family_label": FAMILY_LABEL.get(family, family),
                    "process_name": activity,
                    "group": plain_group(descriptor, activity),
                    "geography": geography(descriptor),
                    "geography_label": GEO_LABEL.get(geography(descriptor), geography(descriptor)),
                    "dtex": dtex(activity, descriptor),
                    "input_required_kg": number(raw.get(header_input)),
                    "descriptor_code": descriptor,
                    "dq_pedigree": clean(raw.get("P_dqr")),
                    "dq_temporal": clean(raw.get("TiR_dqr")),
                    "dq_technology": clean(raw.get("TeR_dqr")),
                    "dq_geography": clean(raw.get("GR_dqr")),
                }
                missing = []
                for code in INDICATORS:
                    value = number(raw.get(code))
                    record[code] = value
                    if value is None:
                        missing.append(code)
                record["missing_indicators"] = len(missing)
                record["negative_indicators"] = sum(1 for c in INDICATORS if (record[c] or 0) < 0)
                rows.append(record)
    return rows


def write_clean(rows: list[dict[str, object]]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    fields = [
        "family", "family_label", "process_name", "group", "geography", "geography_label", "dtex",
        "input_required_kg", *INDICATORS, "missing_indicators", "negative_indicators",
        "dq_pedigree", "dq_temporal", "dq_technology", "dq_geography", "descriptor_code",
    ]
    with (OUT / "factors-clean.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: ("" if row.get(k) is None else row.get(k)) for k in fields})


def summarise(rows: list[dict[str, object]]) -> str:
    lines: list[str] = []
    add = lines.append
    add("# Process factor summary")
    add("")
    add("Plain-language summary of the published process factors the calculator uses. Generated by `services/api/scripts/analyse_factors.py`; do not edit by hand.")
    add("")
    add(f"- Total process factors: **{len(rows)}**")
    add(f"- Process families: **{len({r['family'] for r in rows})}**")
    add(f"- Indicators per factor: **{len(INDICATORS)}** (the EF 3.1 categories)")
    add(f"- Factors with a missing indicator value: **{sum(1 for r in rows if r['missing_indicators'])}**")
    add(f"- Factors with a negative indicator value: **{sum(1 for r in rows if r['negative_indicators'])}**")
    add(f"- Duplicate process codes: **{len(rows) - len({r['descriptor_code'] for r in rows})}**")
    add("")

    add("## 1. Process families")
    add("")
    add("| Family | Factors | Geographies | Typical input per unit (kg) |")
    add("|---|---:|---|---|")
    by_family: dict[str, list[dict[str, object]]] = defaultdict(list)
    for r in rows:
        by_family[str(r["family"])].append(r)
    for family, items in sorted(by_family.items(), key=lambda kv: -len(kv[1])):
        geos = sorted({str(i["geography_label"]) for i in items})
        inputs = sorted(float(i["input_required_kg"]) for i in items if i["input_required_kg"] is not None)
        typical = f"{inputs[len(inputs) // 2]:g}" if inputs else "not given"
        add(f"| {FAMILY_LABEL.get(family, family)} | {len(items)} | {', '.join(geos)} | {typical} |")
    add("")

    add("## 2. Geographies (where the factor applies)")
    add("")
    geo_counts = Counter(str(r["geography_label"]) for r in rows)
    for geo, count in geo_counts.most_common():
        add(f"- {geo}: {count} " + ("factor" if count == 1 else "factors"))
    add("")

    add("## 3. Groups inside each family")
    add("")
    for family, items in sorted(by_family.items(), key=lambda kv: -len(kv[1])):
        groups = Counter(str(i["group"]) for i in items)
        add(f"### {FAMILY_LABEL.get(family, family)}")
        add("")
        for group, count in groups.most_common(12):
            add(f"- {group} ({count})")
        if len(groups) > 12:
            more = len(groups) - 12
            add(f"- and {more} more " + ("group" if more == 1 else "groups"))
        add("")

    add("## 4. Fibre fineness (dtex) where given")
    add("")
    dtex_counts = Counter(str(r["dtex"]) for r in rows if r["dtex"])
    add(", ".join(f"{d} dtex ({c})" for d, c in sorted(dtex_counts.items(), key=lambda kv: int(kv[0]))) or "None given.")
    add("")

    add("## 5. Data-quality ratings")
    add("")
    add("The four ratings (pedigree, temporal, technology, geography) describe how good each source is. They are kept in the clean file and not shown to users yet.")
    add("")
    for field, label in [("dq_pedigree", "Pedigree"), ("dq_temporal", "Temporal"), ("dq_technology", "Technology"), ("dq_geography", "Geography")]:
        values = Counter(str(r[field]) for r in rows if r[field])
        add(f"- {label}: " + (", ".join(f"{k} ({v})" for k, v in values.most_common()) or "not given"))
    add("")

    add("## 6. Checks and warnings")
    add("")
    if any(r["missing_indicators"] for r in rows):
        add("- Some factors are missing indicator values. The API still returns them; check the clean file for blanks.")
    if any(r["negative_indicators"] for r in rows):
        add("- Some indicator values are negative. These are allowed for some categories (for example credits), but they should be reviewed.")
    no_input = sum(1 for r in rows if r["input_required_kg"] is None)
    if no_input:
        add(f"- {no_input} factors have no input-mass value, so the mass check cannot use them.")
    add("- Dyeing and finishing use different mass conventions. Do not add their rows without a stated convention.")
    add("- No cotton growing, ginning, or transport factors are included. A whole-product total cannot be built from these rows alone.")
    add("- The 330 dtex spinning-to-knitting link is a stated assumption, not a published factor.")
    add("")
    return "\n".join(lines)


def main() -> None:
    rows = load()
    write_clean(rows)
    (OUT / "factor-summary.md").write_text(summarise(rows), encoding="utf-8")
    print(f"{len(rows)} factors written to {OUT}")


if __name__ == "__main__":
    main()
