# Coding Rules — Environmental Impact Analyzer

> **Status:** Proposed engineering conventions for future implementation.
> **Note:** The repository now contains an initial web/API prototype. Apply these conventions to the prototype and future implementation, while respecting any later agreed project tooling.

## 1. Principles

1. **Correctness before confidence:** never replace missing evidence with a guessed fact, factor, or zero.
2. **Traceability by default:** every environmental number must be reproducible from versioned inputs, sources, units, and methodology.
3. **AI assists; domain logic decides:** model output is untrusted input and cannot calculate or authoritatively state an impact result.
4. **Make uncertainty visible:** label user-provided, extracted, estimated, and verified information separately.
5. **Keep it boring:** prefer small modules, explicit types, and direct control flow over premature abstractions or infrastructure.
6. **Accessible and private by default:** keyboard use, readable errors, and data minimization are part of correctness.

## 2. Repository and change management

- Keep frontend, API, domain calculations, data imports, and tests in clear boundaries; follow the proposed architecture unless an ADR changes it.
- Keep documentation close to the behavior it governs. Update `prd.md`, `architecture.md`, `design.md`, `task.md`, or `memory.md` when a user-visible scope or technical decision changes.
- Do not commit real secrets, personal assessment text, licensed source datasets, model weights, or generated artifacts. Use placeholders and synthetic fixtures where appropriate.
- Add dependencies only for a concrete need. Review maintenance status, license, transitive dependencies, and deployment impact.
- Use small changes with focused tests. Suggested commit style: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

## 3. Python API and domain code

- Use type annotations for public functions and domain objects. Validate external payloads at the API boundary with explicit schemas; do not pass raw dictionaries deep into calculation code.
- Separate routing/HTTP concerns from product, extraction, sourcing, impact, and scoring logic.
- Keep configuration in typed settings/environment variables. Fail clearly for missing required production configuration; never hard-code keys, database passwords, model credentials, or origins.
- Use structured, stable API errors with safe messages. Do not return stack traces or internal source/licensing details that are not intended for users.
- Use transactions for related database writes. Add reviewed migrations for schema changes; never edit an already-applied migration to alter production history.
- Recommended tooling when the service is created: Ruff for lint/format, a static type checker, and pytest. Match the chosen tools in CI and locally.

## 4. Environmental calculations and data

- Use named units and dimensional conversions at explicit boundaries. Store canonical values; round only for presentation.
- Each factor must carry source ID/version, geography, year, process/material, boundary, impact method, unit, license/attribution, and quality metadata before it can be used in a user-visible assessment.
- **Open data only:** require an explicit, item-specific, versioned open license for every dataset and each dependency actually used. Public availability, an “open-source” label, an academic-paper license, or an old repository-wide submission rule is not enough. Record rights scope, attribution, ShareAlike, redistribution, and downstream-user conditions. Do not use non-open, proprietary, or unclear-license background data; do not substitute a paid/commercial license. A pending rights review blocks ingestion and scoring.
- Treat license terms as release gates, not citations alone: implement required on-screen attribution/notices and downstream-user conditions, mark adaptations, and verify rights for derived outputs. If an openly licensed published result uses a non-open background inventory, use only the specific openly licensed published content (if otherwise approved), disclose the limitation, and do not access or reconstruct the restricted inventory.
- A process-mapping checklist is descriptive, not a score or factor match. Keep “missing,” “partial,” “not collected,” “boundary not selected,” and “not in candidate” distinct; none may be converted to zero or environmental eligibility.
- Reject incompatible unit, geography, time, method, functional-unit, or boundary matches. Do not select a “nearest” factor without a recorded matching rule and visible assumption.
- Missing, unverified, or ambiguous facts remain unknown. Do not use zero as a missing-value sentinel or infer that an absent certification means a product is uncertified.
- Keep factor versions and reference distributions immutable once used. Give each method update an explicit version; preserve the version on historical results.
- Keep each indicator contribution inspectable. Test unit conversion, aggregation, bounds, rounding, and missing-data branches independently. Do not implement the withdrawn percentile/equal-weight score concept without a new approved method.
- The user selected multiple separate indicators and no combined score. Never calculate or display an aggregate score/ranking; it is outside product scope unless the user explicitly changes direction. Do not show PEFCR v3.1 single scores or representative-product comparisons in B2C communication.
- Do not make marketing phrases, sentiment labels, certifications, or one impact indicator stand in for total sustainability.
- Record methodological assumptions in domain code/config and documentation; avoid hidden weights and magic constants.

## 5. NLP and model use

- Return structured candidate attributes with an evidence span, normalized value, model/extractor version, and confidence. A user must confirm extracted values before assessment.
- Treat all model output as untrusted. Validate it against schemas, allowed categories, and sensible bounds; handle malformed or missing output safely.
- Never let a model create life-cycle factors, calculate a composite score, verify a brand claim, or fabricate a citation or source.
- Pin model identifier and immutable revision; document model and dataset license, language/coverage limitations, and update procedure.
- Provide deterministic fallback behavior for model unavailable/low-confidence cases. Do not block manual entry when extraction fails.
- Do not send user text to a third-party model service without an explicit privacy review and user-facing disclosure.

## 6. Frontend and UX implementation

- Use strict TypeScript. Prefer small, typed components and explicit props; isolate API calls in a service/query layer instead of scattering fetch logic across screens.
- Use same-origin relative API paths (for example, `/api/v1/assessments`). Never hard-code `localhost` or a sandbox/production hostname into browser code.
- Every async view must handle loading, success, partial-data, empty, and error states. Preserve user input after recoverable errors.
- Forms must have visible labels, field-level help and errors, keyboard-operable controls, and clear “unknown/not provided” options.
- Do not communicate score, confidence, or warning by color alone. Provide text, accessible names, focus visibility, and chart/table alternatives.
- Follow semantic HTML and the design document’s WCAG 2.2 AA target. Test responsive states at narrow and wide viewports.
- Present extracted values as editable suggestions with their source text; never render them as verified facts by default.

## 7. Security and privacy

- Validate and bound text length, collection sizes, numeric ranges, and enum values on the server even if the UI validates them too.
- Escape user-controlled content and avoid unsafe HTML rendering. Use parameterized ORM/query operations.
- Do not log raw descriptions, optional feedback, tokens, or unnecessary identifiers. Redact sensitive fields before error reporting.
- Apply rate limits and request-size limits to public endpoints. Review CORS and host/origin configuration for the deployment environment.
- If URL import is ever introduced, treat it as an SSRF-sensitive feature: allowlist schemes/domains, resolve and block private/loopback/link-local addresses, re-check redirects, and cap time/size.
- Have a documented retention/deletion policy before storing assessment or feedback data beyond transient processing.

## 8. Testing and quality gates

- Unit-test all pure scoring, normalization, conversion, evidence classification, and comparability logic.
- Use fixtures with synthetic or properly licensed data; never put restricted production data in tests.
- Add regression tests for each discovered wrong score, misleading fallback, invalid unit, or extraction bug.
- Test that missing data never becomes zero, that incompatible products cannot be compared per indicator, that no combined score is produced, and that individual indicators remain withheld without every approved open-data, LCA, legal/claims, privacy, and validation gate.
- Test API validation and stable error contracts, migration behavior, and frontend loading/error/partial states.
- Recommended initial target: at least 80% branch coverage for the pure impact/scoring domain, with explicit tests for every eligibility and failure path. Coverage does not replace review of environmental validity.
- CI must run formatting/lint, type checks, unit/integration tests, and a production frontend build before merge.

## 9. Definition of done

A change is done when:

- The user or API behavior matches an agreed requirement and has no hidden assumptions.
- Environmental results are traceable, unit-safe, versioned, and accompanied by the right boundary/evidence labels.
- Tests cover normal, missing-data, invalid, and failure cases.
- Accessibility and responsive behavior are checked for affected UI.
- Privacy/security implications are reviewed for new data collection or external calls.
- Relevant docs and task status are updated; no secrets or restricted datasets are included.
