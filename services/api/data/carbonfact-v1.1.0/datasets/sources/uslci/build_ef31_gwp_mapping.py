"""Build a GHG-only EF 3.1 climate-change (GWP100) mapping for USLCI elementary flows.

Scope: emission-to-air flows whose CAS matches CO2, CH4 or N2O.
Values:
  - CO2 fossil 1, CO2 biogenic 0, CH4 fossil 29.8, CH4 biogenic 27: JRC-2023 (EUR 31414 EN), Table 3, EF3.1.
  - N2O 273: IPCC AR6 Table 7.15 GWP100 (with feedbacks), the basis of EF3.1 climate change.
Out of scope: all other 15 EF 3.1 categories; resource-side flows; CO2 land-use-change flows.
"""

import glob
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = [
    # (CAS, flow name, CF in kg CO2 eq per kg, label)
    ("124-38-9", "Carbon dioxide", 1.0, "CO2 fossil"),
    ("124-38-9", "Carbon dioxide, biogenic", 0.0, "CO2 biogenic"),
    ("74-82-8", "Methane", 29.8, "CH4 fossil"),
    ("74-82-8", "Methane, biogenic", 27.0, "CH4 biogenic"),
    ("10024-97-2", "Nitrous oxide", 273.0, "N2O"),
]
rule_map = {(c, n): (cf, lbl) for c, n, cf, lbl in RULES}

out = []
for path in sorted(glob.glob(os.path.join(HERE, "flows", "*.json"))):
    with open(path, encoding="utf-8") as fh:
        f = json.load(fh)
    if f.get("flowType") != "ELEMENTARY_FLOW":
        continue
    cat = f.get("category", "")
    if not cat.startswith("Elementary flows/emission/"):
        continue
    key = (f.get("cas"), f.get("name"))
    if key in rule_map:
        cf, lbl = rule_map[key]
        out.append(
            {
                "flowId": f["@id"],
                "name": f["name"],
                "cas": f["cas"],
                "category": cat,
                "cf_kgCO2eq_per_kg": cf,
                "basis": lbl,
            }
        )

out.sort(key=lambda r: (r["basis"], r["flowId"]))
doc = {
    "method": "EF 3.1 Climate change (GWP100), GHG subset",
    "source_db": "USLCI v1.2026-03 JSON-LD (FLCAC-admin/uslci-content, MIT) in this folder",
    "cf_sources": ["JRC EUR 31414 EN (2023), Table 3", "IPCC AR6 WG1 Table 7.15 (N2O)"],
    "scope_note": "GHG flows only (CO2, CH4, N2O to air). Covers the climate-change category alone, not the other 15 EF 3.1 categories.",
    "mapped_flows": len(out),
    "flows": out,
}
with open(os.path.join(HERE, "ef31-climate-change-ghg-mapping.json"), "w", encoding="utf-8") as fh:
    json.dump(doc, fh, indent=1)
print("mapped", len(out))
