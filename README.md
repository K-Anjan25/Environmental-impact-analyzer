# Environmental Impact Analyzer

A global-market, consumer-facing apparel/footwear prototype for reviewing product-impact information. The selected direction is multiple separate environmental indicators and no combined score. This prototype helps users review product facts but withholds indicator values until open-licensed factors, compatible methods, and product coverage are reviewed.

## Current prototype

- React + TypeScript + Vite + Material UI frontend, with original flat, poster-like landscape illustrations in hand-authored inline SVG. The art is decorative, captioned as non-data, and does not encode a footprint or score.
- Python + FastAPI backend with a rule-based description parser and validated assessment contract.
- Users can review suggested product facts, optionally record component/material shares and supplier-stage process, output/reference-unit, input/loss, and waste-treatment notes, and see which details remain unknown. These added fields are unverified and used only in the stateless no-score response.
- Climate and water indicators are explicitly marked **not calculated**; no water method/unit is selected. The API never invents a score or converts missing data to zero. The app has no assessment-record persistence, but deployment-level logging/retention has not been reviewed; do not enter confidential supplier details.
- **Open-data-only policy:** use only version-pinned data with explicit, item-specific open reuse terms; public access or an “open-source” label alone is not enough. Carbonfact v1.1.0 is an inactive candidate only for its published CC BY-SA 4.0 impact-score data and foreground parameters. Its full ecoinvent-backed inventory is not distributed and will not be accessed or reconstructed. Required attribution/ShareAlike and source/method review remain pending. There is no commercial-license fallback. Assessment responses include a non-scoring mapping-readiness checklist; no data are loaded and all scoring/claims remain disabled. See the [open data source register](data-sources.md).
- No database, active factor set, transformer model, product catalogue, user accounts, or product-history storage is connected yet.

## Project documents

- [Product requirements](prd.md)
- [Architecture](architecture.md)
- [Coding rules](rules.md)
- [UI/UX design](design.md)
- [Tasks and roadmap](task.md)
- [Open data source register](data-sources.md)
- [Project memory and learning resources](memory.md)

## Run locally

Use two terminals.

### 1. Start the API

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade "pip>=26.2" "setuptools>=83.0.0"
python -m pip install -r services/api/requirements-dev.txt
cd services/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API health check is at `http://localhost:8000/healthz`; interactive API docs are at `http://localhost:8000/docs`.

### 2. Start the web app

```bash
cd apps/web
npm install
npm run dev -- --host 0.0.0.0
```

Open the URL printed by Vite. The web app calls relative `/api` paths; the Vite development server proxies them to the API.

## Run checks

From the repository root:

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm --prefix apps/web test
npm --prefix apps/web run build
```

## Important limitation

This is a product-input and evidence-review prototype, **not an environmental-impact calculator yet**. The product direction is global-market, multiple separate indicators, and no combined score. No indicator values are calculated until open-data rights, method, coverage, validation, privacy, and legal/claims gates are resolved. Do not repurpose PEFCR v3.1 single scores or representative-product comparisons for B2C communication. See [data-sources.md](data-sources.md) and [task.md](task.md) for open-data, method, and release gates.
