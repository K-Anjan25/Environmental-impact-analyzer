# Contributing

Thanks for helping improve the Environmental Impact Analyzer. Contributions must preserve the project's open-data boundary, careful attribution, and process-only calculation scope.

## Before proposing a change

- Read [`README.md`](README.md), [`prd.md`](prd.md), [`rules.md`](rules.md), and [`data-sources.md`](data-sources.md).
- For a behavior change, explain the user need, source/method assumptions, and how you will verify it.
- Keep changes focused. Do not commit credentials, `.env` files, personal data, build output, or generated datasets.

## Non-negotiable product and data rules

- Use only version-pinned, openly licensed data with documented attribution, provenance, and reuse terms. Include the actual source license and a source record for every new dataset.
- Do not download, bundle, query, infer, or reconstruct ecoinvent or another non-open inventory. Do not imply that a published score makes its underlying inventory open.
- Keep every selected process result and impact indicator visible separately. The supported selected-row subtotal and EF 3.1 single score are not complete-product results, coverage measures, rankings, or product comparisons. Do not add a complete-product claim without a defined boundary, validated BOM/coverage, non-overlapping factors, and cleared licenses.
- Respect source reference units, geography, process boundaries, and reported data-quality metadata. Supported unit conversions must be explicit and dimension-safe; reject ambiguous compound units, do not infer product composition or silently impute missing stages, and do not invent factors.
- Treat the flat-BOM mass check as arithmetic diagnostics only, and run it only after explicit confirmation that every declared line is a product component for the same functional unit. Do not turn a mass difference into waste-treatment impacts without a suitable, licensed, method-compatible factor and documented boundary.
- Keep user-entered product inputs, finished-product mass, mappings, and derived quantities in browser memory and out of API requests unless the privacy contract is explicitly reviewed and changed.
- Preserve attribution, the dataset's CC BY-SA 4.0 terms for source-derived material and results, and the distinction between that data license and the project's MIT-licensed code/docs.
- Keep the service stateless. Do not add user accounts, analytics, persistent estimate history, request-body logging, or collection of personal information without an explicit product and privacy review.

## Development setup

The API uses Python 3.11; the web app uses Node.js 22 and npm. Vite's `predev`/`prebuild` scripts generate the in-app legal HTML pages from the root Markdown, license, and source-record files. Edit those source files; do not edit generated `apps/web/public/legal/` output. From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade "pip>=26.2" "setuptools>=83.0.0"
python -m pip install -r services/api/requirements-dev.txt
npm ci --prefix apps/web
```

Run the checks before submitting:

```bash
(cd services/api && ../../.venv/bin/python -m ruff check app tests)
(cd services/api && ../../.venv/bin/python -m ruff format --check app tests)
(cd services/api && ../../.venv/bin/python -m mypy app)
(cd services/api && ../../.venv/bin/python -m pytest)
npm test --prefix apps/web
npm run build --prefix apps/web
```

For a container smoke test, run `docker compose up --build` and verify `/`, `/healthz`, `/api/docs`, the factor API, one estimate, and CSV export. The Vercel-targeted image can be checked locally with `docker compose --profile vercel up --build analyzer-vercel`; local Compose does not verify Vercel routing or project settings.

## Data-source changes

A dataset contribution must include, at minimum:

1. A fixed release/tag or immutable commit, source publication URL, publisher, version/date, and a checksum or reproducible extraction record.
2. The full applicable license text and an explanation of which files, derived values, and adaptations it covers.
3. Attribution, reference units, geographies, process boundaries, and relevant data-quality fields.
4. Reconciliation of source row counts and a documented list of exclusions or transformations.
5. Tests that load the data, validate schemas/numeric values, and check representative results.

Do not include data just because it is publicly downloadable. Confirm redistribution and derivative-work permission from the specific source license first.

## Pull requests

- Use a descriptive title and explain the motivation, behavior change, and any scope or methodology effects.
- Link related issues or source records when available.
- Add or update tests, accessibility checks, source notices, README/API documentation, and release notes as needed.
- For UI changes, check keyboard use, responsive layout, and accessibility tests.
- For calculations, test reference-unit arithmetic, validation, rounding/precision, separate indicators, and source lineage.
- For privacy/security changes, identify what new information is collected or retained and update `PRIVACY.md` and `TERMS.md` where appropriate.
- Do not merge a deployment or production configuration change solely because a CI build passes; verify the Preview routes and workflow.

## Licensing contributions

By submitting original code or documentation, you confirm you have the right to contribute it and agree that it may be distributed under the repository's MIT License. No separate contributor agreement is currently required. For third-party code or data, identify the copyright holder and exact license; do not submit material with unclear or incompatible terms. Data contributions remain subject to their source license and the project's attribution/share-alike obligations.

## Security reports

Please do not publish exploitable vulnerabilities, secrets, or private user information in a public issue. Use GitHub's private vulnerability reporting for this repository if enabled; otherwise contact the repository maintainer privately and include only the detail needed to investigate.
