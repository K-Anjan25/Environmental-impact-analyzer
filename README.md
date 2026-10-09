# Environmental Impact Analyzer

A consumer-facing prototype for making product-impact information easier to understand. The current interactive MVP focuses on apparel and footwear, helps users review product facts, and deliberately withholds environmental scores because no reviewed product-level factors, compatible reference set, or approved consumer-score method is connected.

## Current prototype

- React + TypeScript + Vite + Material UI frontend, with an original surrealist-inspired visual direction and hand-authored inline SVG vector art. The artwork is decorative, captioned as non-data, and does not encode a footprint or score.
- Python + FastAPI backend with a rule-based description parser and validated assessment contract.
- Users can review suggested product facts, optionally record component/material shares and supplier-stage process, output/reference-unit, input/loss, and waste-treatment notes, and see which details remain unknown. These added fields are unverified and used only in the stateless no-score response.
- Climate and water indicators are explicitly marked **not calculated**; no water method/unit is selected. The API never invents a score or converts missing data to zero. The app has no assessment-record persistence, but deployment-level logging/retention has not been reviewed; do not enter confidential supplier details.
- Carbonfact’s pinned v1.1.0 apparel/footwear process dataset is listed as a candidate only. Its stated CC BY-SA 4.0 terms and a separate commercial-license contact provide two possible reuse paths; the registry records attribution, ShareAlike, separate ecoinvent inventory-rights conditions, and pending activation gates. The UI can prepare a version-specific licensing email but does not send it. Assessment responses include a non-scoring mapping-readiness checklist to expose missing BOM, process-route, geography, loss/waste, use-phase, and end-of-life information. Legal review and product/method validation remain open, so no factor data is loaded or active for scoring.
- No database, active factor set, transformer model, product catalogue, user accounts, or product-history storage is connected yet.

## Project documents

- [Product requirements](prd.md)
- [Architecture](architecture.md)
- [Coding rules](rules.md)
- [UI/UX design](design.md)
- [Tasks and roadmap](task.md)
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

This is a functioning product-input and evidence-review prototype, **not an environmental-impact calculator yet**. Overall consumer scores are not enabled by default; any separate screening index would require appropriately licensed data, expert-approved LCA method, independent validation, and legal/claims approval. Do not repurpose PEFCR v3.1 single scores or comparisons against representative products for B2C communication. See [task.md](task.md) for open source, method, and release gates.
