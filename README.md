# EcoImpact Lab

A browser-based calculator for selected apparel and footwear processes. It shows the 16 EF 3.1 impact indicators for published process factors and totals only the rows you choose. It is not a complete product footprint.

## Run locally

Requirements: Python 3.11 and Node.js 22.

In the first terminal, start the API:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r services/api/requirements-dev.txt
cd services/api
../../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

In a second terminal, start the website:

```bash
npm ci --prefix apps/web
npm run dev --prefix apps/web -- --host 0.0.0.0
```

Open the URL printed by Vite. It proxies `/api` requests to the API on port 8000.

To run the app in one local container, use `docker compose up --build` from the repository root and open `http://localhost:8000`.

## Checks

```bash
npm test --prefix apps/web
npm run build --prefix apps/web
(cd services/api && ../../.venv/bin/python -m pytest)
```

## Data and privacy

The calculator uses 302 published process-score rows from Carbonfact's pinned v1.1.0 release. Source attribution and data limitations are in [`data-sources.md`](data-sources.md) and [`services/api/data/carbonfact-v1.1.0/SOURCE.md`](services/api/data/carbonfact-v1.1.0/SOURCE.md).

Product names, quantities, units, and mappings stay in the browser. The API receives selected factor IDs and quantities for process estimates; it does not store user inputs or calculation history. Results cover only the processes selected and should not be presented as a complete product footprint.

## Project and legal

- [Privacy notice](PRIVACY.md)
- [Terms of use](TERMS.md)
- [Contributing](CONTRIBUTING.md)
- [Root software license](LICENSE)
