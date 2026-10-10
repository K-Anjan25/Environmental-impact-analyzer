# Product Requirements — Environmental Impact Analyzer

> **Status:** Draft MVP proposal
> **Last updated:** 2026-10-10
> **Product stage:** Documentation / discovery; no production score or dataset exists yet.

## 1. Product summary

Environmental Impact Analyzer helps people in a global market understand separate environmental-impact indicators for apparel and footwear and the evidence behind them. A user enters product details or a description; the system suggests candidate facts for review, then may return separately reported, method-specific indicators with data-quality notes and practical next steps. A combined score is not part of the selected product scope.

The product must prefer an honest **“not enough evidence”** result over an unsupported score. It is a decision-support tool, not a certification, regulatory disclosure, or substitute for a complete life-cycle assessment (LCA).

## 2. Problem and opportunity

Environmental product information is fragmented, expressed in inconsistent units, and often presented as marketing claims without comparable evidence. Consumers need a quick way to understand what is known, what is estimated, and where meaningful choices may exist. Businesses may later use the same foundation to review product portfolios, but the first release is optimized for individual consumers.

## 3. Product goals

1. Make an initial product assessment understandable in under two minutes.
2. Show the impact dimensions, scope, sources, assumptions, and uncertainty—not just a single number.
3. Distinguish user-provided and model-extracted facts from verified or reference data.
4. Offer useful, evidence-aligned actions without implying that a product is “green” or “sustainable” overall.
5. Create an auditable, versioned foundation for improving data coverage and methodology.

### Non-goals for the MVP

- A certified, ISO-conformant, or full cradle-to-grave LCA.
- Claims that a brand, product, or certification is independently verified unless an approved source establishes that fact.
- General-purpose assessments across food, electronics, buildings, and all other categories.
- Automated scraping of arbitrary retailer pages, barcode scanning, or retailer integrations.
- A business analytics dashboard, user accounts, social features, or a public prediction API.
- Treating sentiment, “eco-friendly” wording, or an LLM response as evidence of environmental performance.

## 4. Initial scope and assumptions

| Decision | MVP direction |
|---|---|
| First product category | Apparel and footwear; begin with a narrow set of garment types for which comparable factors can be reviewed. |
| Primary audience | Consumers comparing an item or learning what product information matters. |
| Secondary audience | Sustainability practitioners who can review a pilot; not a separate product persona yet. |
| Target market | Global. Actual product and stage geographies must come from evidence or remain unknown; do not apply a default production geography. |
| Assessment input | Structured fields and/or pasted product text. No automatic URL fetching in the initial release. |
| Life-cycle boundary | Target a clearly stated, consistently supported production boundary (raw-material supply through finished item at the factory gate). Include distribution only when route and data are available and disclose it separately. Use phase and end of life are excluded by default. |
| Result | Evidence-backed product facts and multiple method-specific indicators shown separately where supportable. **No combined score.** Individual indicator values remain disabled until open-data rights, method, coverage, validation, privacy, and legal/claims gates are resolved. |
| Data rights | **Open data only:** use version-pinned data with explicit, item-specific open terms that permit the intended use. Verify the rights scope for every dataset and background dependency; exclude non-open or unclear-license inputs. Public access, an “open-source” label, or a method/paper license is not a blanket data license. No separate commercial-license fallback. |
| Accounts and privacy | No account required. Do not retain raw pasted text by default. Retention and deletion rules for saved assessment snapshots must be configured before a public pilot. |

These are planning assumptions, not verified facts about available data. The scoring method and reference set must be reviewed before user-facing numeric results are enabled.

## 5. Target users and needs

### Consumer making a purchase decision

- Wants to compare similar items without needing to understand LCA terminology.
- Needs to see what facts came from a product description and what was inferred.
- Wants actionable information such as material, durability, repair, or care considerations, with the limits of each suggestion made clear.

### Sustainability reviewer (pilot partner)

- Needs reproducible calculations, source/version traceability, and a way to identify weak or missing data.
- Must be able to flag incorrect factors, assumptions, or product mappings before the system scales.

## 6. Core user journeys

1. **Assess an item:** open the assessor → choose apparel/footwear subtype → enter known product facts or paste a description → review and correct extracted fields → request assessment → inspect confirmed facts, any supported indicators, assumptions, sources, or an explicit no-score explanation.
2. **Compare items:** assess or select two sufficiently similar items → confirm their functional unit and boundary match → compare only eligible, method-compatible indicators → review the evidence differences. If they are not comparable, explain why and do not present a misleading ranking or PEFCR representative-product comparison.
3. **Improve an assessment:** edit a missing or incorrect fact → recalculate → see which parts of the result changed.
4. **Give feedback:** report an incorrect extraction, source, or result without submitting unnecessary personal information.

## 7. Functional requirements

### Assessment input and extraction

- **FR-01 — Product details:** Accept a product name, apparel/footwear subtype, optional brand, description, aggregate material composition, item mass, and product-origin claim. Allow optional component/material shares and supplier process notes (route, stage output/reference unit, geography, year, process-input/loss note, waste-treatment note, and text evidence reference) for future mapping. Label these entries user-provided/unverified, do not fetch references, do not persist them in the prototype, and never interpret unknown as zero.
- **FR-02 — Text extraction:** Identify candidate product attributes (for example, material names, composition percentages, mass, origin, and certification language) from pasted text. Extraction is assistive only.
- **FR-03 — Human confirmation:** Show each extracted fact with its evidence span and allow the user to edit, reject, or mark it unknown before scoring.
- **FR-04 — Validation:** Validate percentages, units, length limits, and supported category values. Explain invalid input inline and preserve valid form entries.

### Assessment and results

- **FR-05 — Reproducible calculation:** Calculate supported impact indicators from versioned factors and documented assumptions. Record the factor/source IDs and method version used for each result.
- **FR-06 — Transparent result:** Show the functional unit, life-cycle boundary, indicators and units, data coverage, evidence classes, estimate/range when available, and the major exclusions. When factor matching is not approved, show missing process-mapping inputs as a plain-language checklist (not a score, confidence rating, or factor-match claim).
- **FR-07 — No combined score:** Never calculate or present an aggregate environmental score or ranking. The selected output is multiple separate indicators only. Keep each indicator unavailable until its open-licensed factors, method, geography/coverage, and validation are approved. Do not use a PEFCR-derived single score or representative-product comparisons in B2C communication.
- **FR-08 — Confidence and coverage:** Provide a separate qualitative evidence/confidence label and explain its drivers. Do not present it as a statistical probability unless it has been calibrated as one.
- **FR-09 — Alternatives and actions:** Offer practical, conditional advice tied to supported information (for example, care/repair guidance or a lower-impact material option where data supports the comparison). Label generic advice as generic; do not invent a product alternative.
- **FR-10 — Comparison:** Compare only products with matching category, functional unit, boundary, and method version, or clearly flag mismatches and suppress an overall rank. Do not present PEFCR representative-product benchmarks as consumer product comparisons.
- **FR-11 — Feedback:** Accept structured feedback for extraction, data, methodology, and usability. Do not require name, email, or account.
- **FR-12 — Method page:** Provide a plain-language explanation of score meaning, scope, sources, limitations, and methodology version.

## 8. Scoring and evidence policy

### Indicators and functional unit

The intended quantitative indicators are **climate impact** and a specifically defined **water-use impact** where the source method supports a product-level result. Their units, characterization method, and system boundary must be selected before scoring; do not assume all “water” indicators mean physical litres. For example, a candidate EF 3.1 WTU source reports m³ world-equivalent per process reference unit, which is not interchangeable with litres of water consumed and cannot be relabelled as such. Store calculations in canonical source-compatible units and convert only when dimensionally valid. Material durability, recycled content, repairability, and certifications may be shown as separate evidence-backed facts; they are not converted into environmental-impact numbers or combined into an aggregate score.

“One finished item” is only a proposed screening reference unit; it must not be described as PEFCR-compliant without applying the category-specific functional-unit and duration-of-service requirements. The Apparel & Footwear PEFCR v3.1 is a full cradle-to-grave method with EU-27, UK, and EFTA geographic validity, while this prototype’s proposed factory-gate boundary is narrower. A product type and mass alone do not establish comparability; any independent screening method must document its functional unit, reference population, boundary, and geography.

### Combined-score policy — excluded from selected scope

The user selected multiple separate indicators with **no combined score**. Do not implement percentile rankings, equal-weight composites, an aggregate index, or a ranked product badge. Results may show method-specific indicators separately and must withhold unsupported indicators; missing data is never zero. A future scope change would require an explicit user decision before any other review.

The Apparel & Footwear PEFCR v3.1 report describes the method as voluntary and states that it does not allow a single score for business-to-consumer communication or comparisons against its representative products. Do not repurpose its single-score or representative-product benchmark results for this consumer app, and do not claim PEF/PEFCR conformity for this prototype. The report states validity through 31 December 2027, while the European Commission’s July 2026 transitional guidance says existing PEFCRs remain valid until EF 4.0 is implemented and directs valid-PEFCR studies to a separate data hierarchy. Confirm current Commission guidance and EF database rights before any compliance-related use; this transition does not grant rights to candidate datasets.

Do not reconsider a combined index unless the user explicitly changes the product direction. Individual indicator values still require open-data rights, a reviewed method and boundary, fit-for-purpose coverage, independent validation, and legal/claims review. If a gate is unmet, withhold that indicator. Missing data is never zero burden.

### Evidence classes

1. **Product-specific evidence:** a source tied to this item, with its date and verification status.
2. **User-provided:** entered or confirmed by the user; not independently verified.
3. **Model-extracted:** candidate fact derived from text; user confirmation required.
4. **Dataset estimate:** matched to a documented background factor or category reference.
5. **Unknown / unsupported:** no eligible evidence; never silently imputed as zero.

Confidence is based on evidence quality, completeness, geographic/temporal fit, and source/method coverage. It is displayed separately from the impact score. Any category-average imputation must be disclosed and reduce confidence.

## 9. Non-functional requirements

- **Clarity:** Plain language, named units, and an explanation for every score or missing score.
- **Performance:** Target a warm-request p95 below 5 seconds for a standard assessment during pilot conditions; measure before setting a production SLA.
- **Accessibility:** Keyboard-operable UI, screen-reader labels, non-color-only status, and WCAG 2.2 AA as the design target.
- **Privacy:** Minimize collection; no account requirement; do not store pasted raw text by default; define retention, deletion, and consent behavior before deployment.
- **Security:** Validate input, protect against injection/SSRF if URL import is added, limit request size/rate, and keep secrets out of source control.
- **Auditability:** Preserve method/factor/source versions needed to reproduce an assessment.
- **Reliability:** If reference data or an assessment dependency is unavailable, return a helpful partial/error response—not a fabricated estimate.

## 10. Success measures

Establish a baseline during moderated pilot tests, then track:

- Assessment completion rate and median time to a result.
- Percentage of users who understand that no combined score is provided by design and can interpret each separate indicator’s unit, boundary, and evidence; indicator values remain withheld until their gates pass.
- Percentage of assessments with complete, traceable source and method metadata.
- Extraction correction rate by field and category.
- User-reported usefulness of the breakdown and actions.
- Rate of unsupported or misleading score incidents (target: zero known unresolved incidents).

Do not optimize for score positivity, number of products rated, or user engagement at the expense of accuracy and transparency.

## 11. Release gates and open questions

Before exposing scores publicly:

- Select and license a suitable factor/reference dataset; record reuse, attribution, storage, and redistribution terms.
- Recruit an LCA reviewer to approve boundaries, factors, normalization, reference cohort, uncertainty handling, and comparison rules.
- Complete legal/claims review for any intended consumer-facing score or comparison. Do not use PEFCR v3.1 single-score or representative-product results in B2C communication.
- Test calculations against independently reviewed examples and document error/coverage limits.
- Finalize retention, deletion, and feedback-consent behavior.
- Validate that all UI states communicate scope and evidence accessibly.

Open questions: Which garment/footwear subtypes and separate indicators have adequate open data and comparable global coverage? Should water be represented as physical water consumption or a method-specific water-use impact indicator, and in which unit/boundary? What pilot cohort, languages, and stage-geography coverage are supportable without defaulting unknown locations?
