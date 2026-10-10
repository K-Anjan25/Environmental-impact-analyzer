# Environmental Impact Analyzer

A browser-first **process and selected-BOM-input estimator** for apparel and footwear manufacturing and use-phase activities. It preserves each of the 16 EF 3.1 indicators per process row, can subtotal selected rows by indicator, and calculates the EF 3.1 normalised-and-weighted single score for those selected rows.

Product-input names, quantities, units, and associations remain in browser memory. Users can confirm word-match suggestions, map a declared quantity as a factor's output or its mass feed, and use supported unit conversions. Mapped-input calculations run locally in the browser; those product-input values and derived quantities are not sent to the API.

## What is included

- **302 published factor rows** from 11 documented process categories in Carbonfact's pinned v1.1.0 release. The UI presents 12 selectable factor groups because sneaker assembly (per pair) and women's boots assembly (per kg) have different reference units.
- Filter the catalog by process family and exact source geography. Geography choices preserve published codes and row counts; unstated geography stays explicitly unstated, with no inferred default.
- **Product-input worksheet:** record up to 25 user-declared lines locally. Word-overlap factor suggestions require user confirmation; the selected input can be treated as process output or as a mass feed where the published factor has an input-required value.
- **Flat-BOM mass diagnostic:** after confirming that every declared line is a product component for the same functional unit, optionally compare supported input masses with finished-product mass. Adding or removing an input resets that confirmation. The check reports arithmetic differences or unit gaps; it does not validate BOM hierarchy/composition/completeness or calculate impacts for the difference.
- Supported unit conversion covers common mass units (kg, g, mg, metric tonnes, lb, oz), selected area units, time units, and pair/count units where the dimensions match. Incompatible, unknown, or compound units such as `kg per pair` are rejected rather than silently converted.
- Source-reported `Input required (kg)` can convert a declared process-feed mass into the factor's reference-unit output quantity. Where the source reference unit is a mass unit, the app also shows the source-derived input/output mass difference. This is a mass diagnostic only; no waste-treatment impact is added.
- Apparel/textile processes: spinning, knitting, weaving, dyeing, finishing, printing, and textile assembly.
- Footwear and material processes: sneaker and women's boots assembly, synthetic PU leather, and natural rubber. Use-phase laundry, drying, ironing, and detergent factors are included where published.
- The results preserve all process-by-indicator rows, add selected-row indicator subtotals, and show each EF 3.1 normalisation factor, weighting percentage, and weighted contribution. Normalisation values are transcribed from the [JRC EF 3.1 workbook](https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx); weights are the recommended all-category final factors (including robustness), scaled to 100%, in the [JRC EF weighting report](https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf). A downloadable CSV includes process rows, subtotals, single score, source attribution, method provenance, and input-mapping status.
- No account, database, analytics, or result history. Inputs and mappings stay in page memory and are not sent to the API. For manual process quantities, only factor IDs and explicit reference-unit quantities are sent; mapped calculations use the already-loaded catalog locally. API request-body logging is disabled.

## Important scope limits

- This is **not a complete or validated product BOM or whole-product life-cycle footprint**. The optional flat-BOM arithmetic runs only after the user confirms every declared line is a product component for one functional unit. It does not establish product composition, hierarchy, all required life-cycle stages, transport, distribution, end of life, or source coverage. Text suggestions are not scientifically validated equivalencies. Users must check process boundaries and avoid double-counting.
- Cross-process totals and the EF 3.1 single score cover only rows the user selected. Missing or unassociated inputs are shown as not calculated, not zero. A score is not a completeness indicator or environmental claim.
- Process reference units, boundaries, and geography vary. Select only a row that matches the intended activity and reference unit. `WORLD`/`GLO` and country-specific factors are distinct source choices, not a claim of complete global representativeness.
- EF 3.1 WTU is measured in m³ world-equivalent. It is a water-use impact indicator, not physical water volume in litres.
- The source says its full Brightway/Activity Browser inventories use ecoinvent 3.12 and are not distributed. Published scores may reflect those modeled background contributions. This app bundles only the published score files and process-family notes; it does not include, query, or reconstruct the underlying inventories. No ecoinvent acquisition or reconstruction is included without lawful access and redistribution rights.
- The source's top-level documentation says 304 datasets; the rows from its documented families included here total 302. No placeholder or inferred factors are added to make the count match. The source's non-woven folder is excluded because it is listed as forthcoming and its CSV conflicts with its stated two-record summary.

## Data and licensing

The included source files are pinned to Carbonfact tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`, released 2026-07-01. Its published scores and included process-family notes are distributed under **CC BY-SA 4.0**. Attribution, the pinned release link, transformation note, and background-data note are available in the app’s Method, source and reuse dialog; CSV exports include provenance and license details. Dataset-derived results are offered under CC BY-SA 4.0. See [`services/api/data/carbonfact-v1.1.0/SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md) and its included `LICENSE`.

The root [`LICENSE`](LICENSE) applies the MIT License to original project code and documentation; it does **not** relicense Carbonfact data, dataset-derived results, or other third-party material. No non-open inventory files are bundled. Review [`data-sources.md`](data-sources.md) for the data license boundary.

## Run locally

### API

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade "pip>=26.2" "setuptools>=83.0.0"
python -m pip install -r services/api/requirements-dev.txt
cd services/api
../../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log
```

The API serves its documentation at `http://localhost:8000/api/docs` and health at `http://localhost:8000/healthz`.

### Web development server

In another terminal:

```bash
npm ci --prefix apps/web
npm run dev --prefix apps/web -- --host 0.0.0.0
```

Open the Vite URL. Browser requests use relative `/api` paths; Vite proxies them to the API.

### Local container acceptance test

From the repository root:

```bash
docker compose up --build
```

Compose builds the React app and API into one image and serves them from the same origin. It includes a health check whose status is visible in `docker compose ps`. Open `http://localhost:8000`; stop it with `docker compose down`. To use another host port, run `ANALYZER_PORT=8001 docker compose up --build`.

The standalone image can also be built and run with `docker build -f services/api/Dockerfile -t environmental-impact-analyzer .` and `docker run --rm -p 8000:8000 environmental-impact-analyzer`. The runtime is non-root and disables Uvicorn access logging.

### Deployment target

The standard and Vercel-targeted images pass CI smoke tests. Vercel is the selected deployment platform; its Container Runtime is Beta. The operator's build log confirms a repository-root container build, `PORT=8000`, a 300-second timeout, and deployment completion. Vercel reports deployment success for the source-geography app commit `0775d5d` and the v2 app-code commit `2bf2130`. The operator's authenticated Preview acceptance on `ccb75f9` predates both changes, so the geography filter and v2 input worksheet still need a quick authenticated check. The Preview is SSO-protected from external probes. The candidate default alias `environmentalimpactanalyzer.vercel.app` last returned 404 unauthenticated; do not advertise it until Vercel attaches and serves an alias. The operator selected a no-SLA early beta and no custom domain. `Dockerfile.vercel` avoids a Docker `HEALTHCHECK` instruction that Vercel's OCI build ignores; `/healthz` remains covered by HTTP smoke tests. See the [official Container Runtime guide](https://vercel.com/docs/functions/runtimes/container) and the [release readiness and version roadmap](roadmap.md). Local Compose verifies an image only; it does not validate Vercel routing, limits, protection, or project settings.

## API

- `GET /api/v1/factors` — versioned factor catalog, optionally filtered with `family`, `q`, `offset`, and `limit`.
- `POST /api/v1/process-estimates` — accepts 1–25 `{factor_id, quantity}` selections and returns each selected process separately with 16 indicators. It receives no product-input labels, quantities, units, associations, or browser-derived mapped quantities.
- `GET /api/v1/sources` — active source, license, attribution, dependencies, and scope.
- `GET /api/v1/methodology` — API calculation, browser subtotal/single-score scope, privacy behavior, and completeness limits.
- `GET /api/docs` — interactive OpenAPI documentation.

Example request:

```json
{
  "processes": [
    {
      "factor_id": "MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING/OPEN_END#SYNTHETIC_FIBERS/ACRYLIC?DTEX=200@WORLD",
      "quantity": 0.18
    }
  ]
}
```

`quantity: 0.18` means 0.18 units of the factor's displayed reference unit (`1 kg yarn` in this example). Each indicator returns both the source factor per reference unit and the quantity-scaled result. The API keeps process rows independent; the browser separately summarizes the selected set and computes the EF 3.1 weighted single score.

## Checks

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm test --prefix apps/web
npm run build --prefix apps/web
```

## License, privacy, and contributing

The application code/documentation license is separate from the bundled data license. The app footer links to Privacy, Terms, and Software License pages; Vite generates those pages from the root Markdown/license sources during development and production builds. The privacy notice and terms now include the operator details, linked contact page, and a proposed India-law/India-venue clause at the operator's direction; confirm identity, contact monitoring, legal suitability, and live Vercel processing before public Production. See [`roadmap.md`](roadmap.md).

- [MIT License for original project code and documentation](LICENSE)
- [Privacy notice](PRIVACY.md)
- [Terms of use](TERMS.md)
- [Contributing guide](CONTRIBUTING.md)
- [Product scope and requirements](prd.md)
- [Data-source record](data-sources.md)
- [Architecture](architecture.md)
- [Design](design.md)
- [Implementation and release record](task.md)
- [Release readiness and version roadmap](roadmap.md)
- [v2 product-input discovery and scope record](v2-discovery.md)
- [v2 open-data and licensing audit](v2-source-audit.md)
- [Coding and calculation rules](rules.md)
- [Project memory](memory.md)
