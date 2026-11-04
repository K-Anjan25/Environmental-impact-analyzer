<div align="center">
  <img src="apps/web/public/brand/mark.svg" alt="EcoImpact Lab logo" width="88" />
  <h1>EcoImpact Lab</h1>
  <p>A browser-based calculator for selected apparel and footwear processes. It shows the 16 EF 3.1 impact indicators for published process factors and totals only the rows you choose. It is not a complete product footprint.</p>
</div>

## Run locally

Start the API in one terminal:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r services/api/requirements-dev.txt
cd services/api
../../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Start the website in another terminal:

```bash
npm ci --prefix apps/web
npm run dev --prefix apps/web -- --host 0.0.0.0
```
