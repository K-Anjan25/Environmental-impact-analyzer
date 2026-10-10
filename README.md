# Environmental Impact Analyzer

A working, open-data **process-impact estimator** for apparel and footwear manufacturing and use-phase activities. It reports all 16 EF 3.1 indicators separately, scales published source factors by an entered quantity in the factor's reference unit, and never creates a combined score or sums different process rows.

This is the deliberately narrow, supportable product scope: the available openly licensed scores are process-level factors, not a complete open product inventory. The app therefore calculates process results—not whole-product footprints, product comparisons, or environmental claims.

## What is included

- **302 published factor rows** from 11 documented process categories in Carbonfact's pinned v1.1.0 release. The UI presents 12 selectable factor groups because sneaker assembly (per pair) and women's boots assembly (per kg) have different reference units.
- Apparel/textile processes: spinning, knitting, weaving, dyeing, finishing, printing, and textile assembly.
- Footwear and material processes: sneaker and women's boots assembly, synthetic PU leather, and natural rubber.
- Use-phase laundry, drying, ironing, and detergent factors where published.
- Source geography, reference unit, source-reported input requirement, and DQR fields are shown when supplied. The quantity formula is `published impact factor × entered quantity`.
- A downloadable CSV contains a separate row for each process and indicator, with the source citation, background-data note, and linked CC BY-SA 4.0 result license.
- No account, database, analytics, or result history. The API handles calculations in memory and disables request access logging.

## Important scope limits

- A selection is **not** a product BOM or life-cycle model. The app never sums process rows, fills in missing stages, infers product composition or geography, or presents a product total.
- Process reference units, boundaries, and geography vary. Select only the row that matches the intended activity and reference unit. `WORLD`/`GLO` and country-specific factors are distinct source choices, not a claim of complete global representativeness.
- Source `Input required (kg)` values are displayed as published but are not applied to upstream material burdens or waste-treatment flows.
- EF 3.1 WTU is measured in m³ world-equivalent. It is a water-use impact indicator, not physical water volume in litres.
- The source says its full Brightway/Activity Browser inventories use ecoinvent 3.12 and are not distributed. Published scores may reflect those modeled background contributions. This app bundles only the published score files and process-family notes; it does not include, query, or reconstruct the underlying inventories.
- The source's top-level documentation says 304 datasets; the rows from its documented families included here total 302. No placeholder or inferred factors are added to make the count match. The source's non-woven folder is excluded because it is listed as forthcoming and its CSV conflicts with its stated two-record summary.

## Data and licensing

The included source files are pinned to Carbonfact tag `v.1.1.0`, commit `fa063ecac17ab36691a0d5c7326fedaa2e9d4ab8`, released 2026-07-01. Its published scores and included process-family notes are distributed under **CC BY-SA 4.0**. Attribution is shown next to on-screen results; CSV exports include the attribution and license. Dataset-derived results are offered under CC BY-SA 4.0. See [`services/api/data/carbonfact-v1.1.0/SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md) and its included `LICENSE`.

No non-open inventory files are bundled. The project code is not assigned the source dataset's license by this notice.

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

The local Compose run built the standard image and reported the API container healthy. Vercel is the selected deployment platform; the Vercel project and custom domain are not finalized. The root [`Dockerfile.vercel`](Dockerfile.vercel) is a Vercel Container Runtime entrypoint, and [`vercel.json`](vercel.json) pins the Container framework preset so the intended container route is generated. The runtime is currently Beta; configure the Vercel project environment variable `PORT=8000` for the non-root app process, then validate a Preview before production. A feature-branch deployment completed, but its root URL returned Vercel's `404 NOT_FOUND`; the preset has now been made explicit and needs a fresh Preview verification. You can locally preflight the image with `docker compose --profile vercel up --build analyzer-vercel` (host port 8001). See the [official Container Runtime guide](https://vercel.com/docs/functions/runtimes/container) and the [release readiness and version roadmap](roadmap.md). Local Compose verifies an image only; it does not validate Vercel routing, limits, or deployment configuration.

## API

- `GET /api/v1/factors` — versioned factor catalog, optionally filtered with `family`, `q`, `offset`, and `limit`.
- `POST /api/v1/process-estimates` — accepts 1–25 `{factor_id, quantity}` selections and returns each selected process separately with 16 indicators.
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

## Project notes

- [Product scope and requirements](prd.md)
- [Data-source record](data-sources.md)
- [Architecture](architecture.md)
- [Design](design.md)
- [Implementation and release record](task.md)
- [Release readiness and version roadmap](roadmap.md)
- [Coding and calculation rules](rules.md)
- [Project memory](memory.md)
