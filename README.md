# Environmental Impact Analyzer

A working, open-data **process-impact estimator** for apparel and footwear manufacturing and use-phase activities, with an optional v2 worksheet for user-declared product inputs. It reports all 16 EF 3.1 indicators separately, scales published source factors by an entered quantity in the factor's reference unit, and never creates a combined score or sums different process rows.

The worksheet keeps user-entered input labels, quantities, and unit text in browser memory and lets users manually associate an input with a selected process row as context only. It does not calculate from the declared input amount, infer a complete BOM, or turn process rows into whole-product footprints, comparisons, or environmental claims.

## What is included

- **302 published factor rows** from 11 documented process categories in Carbonfact's pinned v1.1.0 release. The UI presents 12 selectable factor groups because sneaker assembly (per pair) and women's boots assembly (per kg) have different reference units.
- Filter the catalog by process family and exact source geography. Geography choices preserve published codes and row counts; unstated geography stays explicitly unstated, with no inferred default.
- **Optional v2 product-input worksheet:** record up to 25 user-declared inputs (name, quantity, free-text unit) locally; manually associate a line with a selected process as context only. Input quantities are not converted or sent to the API; the process quantity remains separately entered in the factor's exact reference unit. Unassociated input lines are exported as not calculated, not zero.
- Apparel/textile processes: spinning, knitting, weaving, dyeing, finishing, printing, and textile assembly.
- Footwear and material processes: sneaker and women's boots assembly, synthetic PU leather, and natural rubber.
- Use-phase laundry, drying, ironing, and detergent factors where published.
- Source geography, reference unit, source-reported input requirement, and DQR fields are shown when supplied. The quantity formula is `published impact factor × entered quantity`.
- A downloadable CSV contains a separate row for each process and indicator, with the source citation, background-data note, and linked CC BY-SA 4.0 result license. When using the v2 worksheet, it adds manual context fields and marks unassociated input lines as not calculated, not zero.
- No account, database, analytics, or result history. Product-input notes stay in page memory and are not sent to the API; the API handles factor IDs and separately entered reference-unit quantities in memory and disables request access logging.

## Important scope limits

- The worksheet is not an inferred or validated product BOM or life-cycle model. Manual links are context only; the app never maps materials to processes, fills in missing stages, infers composition or geography, propagates mass/losses, sums process rows, or presents a product total.
- Process reference units, boundaries, and geography vary. Select only the row that matches the intended activity and reference unit. `WORLD`/`GLO` and country-specific factors are distinct source choices, not a claim of complete global representativeness.
- Source `Input required (kg)` values are displayed as published but are not applied to upstream material burdens or waste-treatment flows.
- EF 3.1 WTU is measured in m³ world-equivalent. It is a water-use impact indicator, not physical water volume in litres.
- The source says its full Brightway/Activity Browser inventories use ecoinvent 3.12 and are not distributed. Published scores may reflect those modeled background contributions. This app bundles only the published score files and process-family notes; it does not include, query, or reconstruct the underlying inventories.
- The source's top-level documentation says 304 datasets; the rows from its documented families included here total 302. No placeholder or inferred factors are added to make the count match. The source's non-woven folder is excluded because it is listed as forthcoming and its CSV conflicts with its stated two-record summary.

## Data and licensing

The included source files are pinned to Carbonfact tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`, released 2026-07-01. Its published scores and included process-family notes are distributed under **CC BY-SA 4.0**. Attribution is shown next to on-screen results; CSV exports include the attribution and license. Dataset-derived results are offered under CC BY-SA 4.0. See [`services/api/data/carbonfact-v1.1.0/SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md) and its included `LICENSE`.

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
- `POST /api/v1/process-estimates` — accepts 1–25 `{factor_id, quantity}` selections and returns each selected process separately with 16 indicators. The optional product-input notes and their manual associations are not part of this API request.
- `GET /api/v1/sources` — active source, license, attribution, dependencies, and scope.
- `GET /api/v1/methodology` — formula, privacy behavior, and product-footprint/no-combined-score limits.
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

`quantity: 0.18` means 0.18 units of the factor's displayed reference unit (`1 kg yarn` in this example). Each indicator returns both the source factor per reference unit and the quantity-scaled result. Process rows are never aggregated.

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
