# Terms of use

**Last updated:** 10 October 2026

**Effective date:** This version takes effect when it is first published at the public Production URL; record the calendar date at launch.

**Status:** Draft for operator/legal review — confirm the operator/contact details, governing-law clause, live hosting configuration, and jurisdiction-specific requirements before public Production.

These draft terms describe use of the Environmental Impact Analyzer website and API (the **Service**). They are not legal advice. The person operating a public deployment must review these terms for the intended users, jurisdictions, and live hosting configuration before launch.

## Operator and contact

- **Service operator:** Kyama Anjan Kumar
- **Service contact:** [Contact the service operator](https://k-anjan25.github.io/portfolio/contact.html)
- **Governing law and venue:** These Terms and disputes arising out of or relating to the Service are governed by the laws of India. Subject to mandatory applicable law, courts of competent jurisdiction in India shall have jurisdiction.

## Service scope and limitations

The Service scales selected, published process factors by quantities entered in each factor's stated reference unit. It preserves individual process rows and their environmental indicators, and the browser may show indicator subtotals and an EF 3.1 single score for exactly the rows selected by the visitor. These calculations do **not** establish a complete product life-cycle footprint or product comparison; a single score is not a measure of data coverage or completeness. The Service also offers a flat, browser-local product-input worksheet, user-confirmed text-match suggestions, supported unit conversions, source-reported process-feed scaling, and a flat-BOM mass diagnostic. The mass diagnostic runs only after the visitor confirms every declared line is a product component for one functional unit. It is arithmetic only; it does not validate composition, a hierarchical BOM, suppliers, stage coverage, or environmental impacts from waste treatment.

Source boundaries, geographies, reference units, data quality, and coverage vary. Product-input suggestions do not prove material/process equivalence. Missing or unmapped inputs are not zero. The bundled source has no transport/distribution or waste-treatment/end-of-life factor rows and does not cover all possible product materials or stages. Results are estimates based on the identified published source and stated transformation; they may be incomplete, unsuitable for a particular decision, or different from another method. Check the selected factor, source notes, units, and limitations independently before relying on any result.

The Service is informational and is not legal, regulatory, engineering, investment, procurement, or professional life-cycle-assessment advice. It does not replace an independently scoped and reviewed assessment. Do not use a result alone to substantiate a regulated disclosure, environmental claim, product label, or compliance decision.

## Acceptable use and visitor inputs

Use the Service lawfully and do not interfere with its availability, security, or other users' access. Do not probe or exploit the service, bypass deployment protections, or send malware or unlawful material.

For manual process rows, the Service accepts factor identifiers and numeric quantities in the source reference units. Its optional product-input worksheet accepts user-entered labels, quantities, and unit text; visitors may confirm a text-match suggestion and use a declared quantity as process output or as mass feed where the published source provides the required coefficient. Supported mappings and the optional flat-BOM mass comparison run locally in browser memory and are not sent to the calculation API. These features do not infer product composition or validate the mapping. A CSV download may contain worksheet values, finished-product mass, mappings, and results, and the visitor is responsible for handling that file. Do not submit personal information, confidential business information, trade secrets, supplier secrets, or information about another person. The Service has no account or saved-history feature and is not designed to store such information.

## Website license

The original application code and project documentation are made available under the MIT License in [`LICENSE`](LICENSE).

The Service is not affiliated with or endorsed by Carbonfact, Vercel, or the publishers of the referenced datasets.

## Availability and changes

The Service may change, be unavailable, or be withdrawn. No uptime, support, backup, or continued-availability commitment is made by this draft. The current Vercel Container Runtime is Beta; its behavior and limits are subject to Vercel's terms and project configuration. Preview deployments may be access-protected and are not production service commitments.

The operator may update these terms. A production release should display or link the current terms and its effective date. The current UI does not implement click-through acceptance; the operator must decide whether a separate assent flow is required and implement it before launch if so.

## Disclaimer and liability

To the maximum extent permitted by applicable law, the Service is provided **as is** and **as available**, without warranties or guarantees of accuracy, completeness, fitness for a particular purpose, non-infringement, or uninterrupted availability. Nothing in these terms excludes a right or remedy that cannot legally be excluded.

To the maximum extent permitted by applicable law, the operator and contributors will not be liable for indirect, incidental, special, consequential, exemplary, or punitive loss arising from use of or inability to use the Service. This draft does not limit liability where the law does not permit that limitation. The operator must have this section reviewed for the jurisdictions in which the Service is offered.

## Governing law and contact

The operator must confirm that the selected law and venue are appropriate and obtain jurisdiction-specific legal review before public Production. For questions about these terms, use the service contact above. For privacy matters, see [`PRIVACY.md`](PRIVACY.md).
