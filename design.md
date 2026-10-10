# UI/UX Design — Environmental Impact Analyzer

> **Status:** Product design direction for the MVP
> **Last updated:** 2026-10-10

## 1. Design intent

Make separate environmental indicators calm, understandable, and honest. The interface should help someone learn what matters and decide what to do next—not reward a brand with a simplistic “green” badge. The selected direction is multiple separate indicators and no combined score.

### Experience principles

- **Explain before persuade:** show the indicator definition, unit, boundary, and evidence; do not imply a comparison group or score where none is approved.
- **Known versus estimated:** visually distinguish user-provided, extracted, reference-data, and unavailable information.
- **No false precision:** use sensible rounding and ranges where appropriate; make data limitations visible beside the result.
- **Support correction:** users can inspect and edit what text extraction found.
- **Accessible by default:** information is not conveyed by color alone; all actions work by keyboard and screen reader.

## 2. Information architecture

MVP navigation can remain intentionally small:

- **Assess a product** — primary entry point.
- **Compare** — available after at least two comparable assessments exist.
- **How it works** — why no combined score is provided by design, why indicator values are currently unavailable, method boundaries, open-data sources, and limitations.
- **Feedback** — report a data, extraction, methodology, or usability issue.

Do not require an account to assess a product. Saved history, accounts, barcode scanning, and a business dashboard are outside the first release.

## 3. Primary journey

1. **Landing / start:** one clear “Assess a product” action, brief category/scope note, and a prominent link to methodology.
2. **Choose item:** select apparel/footwear subtype; unsupported categories receive an honest out-of-scope message.
3. **Describe item:** enter product name and known facts, or paste a description. Mark optional information as “I don’t know.” Do not fetch a pasted URL automatically.
4. **Review extracted facts:** show each suggested attribute, the exact text span it came from, and actions to edit, confirm, reject, or mark unknown. A clear notice says extraction is not verification.
5. **Calculate:** show a short progress state with a way to return to the form. Avoid implying model certainty while processing.
6. **Read results:** display scope and evidence, supported method-specific indicators separately, the no-combined-score state, assumptions, and next steps. Explain any indicator that remains unavailable; never present an aggregate score.
7. **Compare or give feedback:** allow comparison only when products are compatible; provide a short, non-intrusive feedback action.

## 4. Key screens and content hierarchy

### Assessment form

- Heading: **“Understand an item’s estimated footprint”**.
- Category/subtype selector with supported choices and concise examples.
- Product name; description text area with character guidance; structured fields for material composition, mass, and product-origin claim.
- A collapsed optional section for component/material shares and supplier process notes (process technology, stage output/reference unit and geography/year, input/loss notes, waste-treatment notes, and a text-only evidence reference). Label these inputs unverified, stateless, and not enough to produce an environmental result; never fetch the reference automatically.
- A visible “Not sure” state for optional fields; do not imply that an empty field means the impact is zero.
- Text-extraction CTA that describes what it does: **“Suggest details from description”**.
- Inline validation for composition totals, units, unsupported subtypes, and maximum lengths.
- Submit CTA: **“Review assessment”** or **“Calculate estimate”** depending on whether the confirmation step is complete.

### Extraction review

Each candidate fact is a compact, editable row/card:

- Attribute and normalized value (for example, “Material: cotton — 100%”).
- Evidence quote/source text and a “Suggested from text” label.
- Edit, confirm, reject, and unknown actions.
- Never use a checkmark or green status alone to imply independent verification.

### Results

Recommended top-to-bottom order:

1. **Result header:** product, assessment date, functional unit, methodology version, boundary, and an “estimated screening assessment” label.
2. **No-combined-score state:** explain that the product does not produce an aggregate score. Show each separately supported indicator when available; currently, all indicator values are withheld until open-data rights, methods, coverage, validation, and communication reviews pass. Do not repurpose PEFCR v3.1 single scores or representative-product comparisons for B2C.
3. **Impact breakdown:** show climate and water-use indicators only with source-compatible, explicitly named units and boundaries. Do not label EF 3.1 WTU as litres of physical water. Show estimate/range, included life-cycle stages, evidence source/type, and uncertainty. Use a table or text summary in addition to any bar visualization.
4. **Process-mapping readiness:** distinguish fields the form captures from missing component BOM, process-route, stage geography, loss/waste, boundary, and end-of-life inputs. Use plain-language states such as “not collected” or “not in candidate”; do not convert this checklist into a score, confidence rating, or factor-match claim.
5. **What is known / assumed / missing:** group facts by provenance and explain how a missing or estimated input affects the result.
6. **Practical next steps:** a short list tied to evidence (for example, verify composition, compare similar items, repair/reuse). Mark general advice as general.
7. **Sources and method:** show publisher, dataset/version, date, and links. Use only version-pinned records with explicit, item-specific open terms. Expose the license, rights scope, attribution/ShareAlike conditions, and any non-open or unavailable background dependencies. Public access or an “open-source” label alone is not enough. Put required attribution on the same result screen if a source is later approved for product use. Candidates that have not passed license/method review must be explicitly labeled as inactive and must not appear as evidence behind a score. Do not offer a paid/commercial-license fallback; exclude sources that cannot be used under open terms.
8. **Feedback:** “Something look wrong?” with structured reason options and optional comment.

Do not render a combined-score card. When an individual indicator is unavailable, show the reason beside it and retain any other supported indicators separately. Never substitute a neutral-looking score, blank chart, or zero.

### Comparison view

- Require the same apparel/footwear subtype, indicator definition, functional unit, boundary, and methodology version for any indicator comparison.
- Present items in columns on wider screens and stacked cards on mobile.
- Align the same indicator rows and units; annotate which information differs or is estimated.
- If inputs are not comparable, explain the mismatch and show non-ranked facts only. Do not compare products against PEFCR representative products or combine separate indicators into an overall ranking.

## 5. Visual direction — flat vector landscapes

Use the user's reference images for broad visual cues: poster-like flat color fields, layered mountains and hills, simplified clouds and sun, a winding lake/river shape, and strong geometric silhouettes. The app's illustrations are original inline SVGs, not traced or composited from the references. Do not reproduce their exact compositions, distinctive details, or stock watermark. Keep the landscape generic rather than depicting a specific place, project, or environmental outcome. A visible caption identifies the hero image as illustration, not a footprint result.

### Original vector art

- Use hand-authored inline SVG with a logical `viewBox`, responsive proportions, clean shape layers, limited palette, and crisp silhouettes. Keep all interface copy as real text rather than embedding it in artwork.
- The hero is a wide, poster-like mountain valley with a sun, cloud forms, lake, layered foothills, and stylized trees. A small landscape glyph echoes those shapes in the empty state. Both are decorative only: they do not represent a product route, life-cycle boundary, impact values, certification, data coverage, or score.
- Purely decorative SVG uses `aria-hidden="true"` and `focusable="false"`. Any future informative SVG needs an accessible name and description (for example `role="img"`, `<title>`, and `<desc>`); charts also need a visible text/table equivalent.
- Prefer vectors so the art stays crisp across screen sizes and zoom levels. Keep illustration behind no important text and do not add animation to the decorative landscape.

### Palette and typography

Use deep ink and forest for readable interface text and controls. The art may use muted sky/teal, sage, warm cream, and terracotta/sun accents, inspired by the supplied palette references; those colors are decorative, never an environmental performance scale. Warm neutral surfaces protect form readability. Use a visible focus ring and state labels in words rather than color alone.

| Token | Value | Use |
|---|---|---|
| Ink | `#17231F` | Main text and headings. |
| Forest | `#1F5A46` | Primary actions and restrained interface accent. |
| Terracotta | `#B74732` | Headline accent and small editorial details; verify against its rendered background. |
| Landscape teal | `#286C70` | Illustration only; not a status or performance color. |
| Sand | `#F5F2EA` | Page background. |
| Surface | `#FFFEFA` | Cards and input surfaces. |
| Amber | `#8A5A00` | Caution or uncertainty, always paired with text. |
| Border | `#D7DED8` | Dividers and input outlines. |

The implemented Terracotta (`#B74732`) on Sand (`#F5F2EA`) measures 4.74:1. This reference pairing does not replace checking actual rendered surfaces—especially gradients, translucent cards, and focus states—when tokens or layouts change.

Use a readable system sans-serif, generous line height, clear heading hierarchy, and a consistent spacing scale. Avoid decorative leaf badges or icons that could be misread as certification or proof of environmental benefit.

### Accessibility guardrails for the visual system

- Target WCAG 2.2 AA. The W3C's contrast guidance sets 4.5:1 for normal text and 3:1 for large text; meaningful controls and graphical objects have a 3:1 non-text contrast threshold against adjacent colors. Recheck rendered text, control boundaries, and keyboard states after visual changes.
- Do not rely on hue alone for status or indicators; include labels and explicit states. The landscape illustrations are hidden from assistive technology because they are decorative; the nearby caption clarifies the hero is not data.
- Keep decorative vectors static. If motion is added later, respect `prefers-reduced-motion`; motion must never be the only way to communicate a state.
- Run browser accessibility checks at mobile and desktop sizes, then complete human screen-reader and usability review before any public pilot.

**Research references:** [MDN: SVG in HTML and accessible names/descriptions](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_in_HTML); [MDN: `aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden); [W3C: WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [W3C: non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html); [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

## 6. Interaction and content rules

- Put explanation next to the number it explains; do not hide critical caveats only in tooltips.
- Label every indicator with a unit and functional unit, such as **“kg CO₂e per item”**.
- Display “estimated,” “user-provided,” “suggested from text,” and “not available” in plain language.
- Explain that there is no combined score by design; explain separately why any individual indicator is unavailable.
- Round values for readability while preserving unrounded values for calculations and audit.
- Keep assumptions reversible: changing a confirmed input should make it clear that a recalculation is needed.
- Provide loading, retry, partial-result, unsupported-category, no-data, and service-error states.
- Use respectful, nonjudgmental copy. Avoid moralizing a consumer’s choice or presenting an uncertain recommendation as a fact.

## 7. Accessibility and responsive behavior

- Target WCAG 2.2 AA; verify contrast for normal text, large text, controls, and focus states.
- Use semantic headings, associated form labels, descriptive buttons, live status announcements for async work, and visible keyboard focus.
- Ensure the complete form and comparison can be used without a pointer.
- Never rely on green/red alone for lower/higher impact or status; pair color with text, labels, shapes, and values.
- Give charts an accessible summary/table and text alternative. Respect reduced-motion settings.
- Start with a single-column mobile layout. At larger widths, use a readable max-width content column and side-by-side comparison only when there is enough space.
- Do not require hover to reveal sources, explanations, or errors.

## 8. Design validation

Before release, test with consumers unfamiliar with LCA terminology, an environmental-assessment reviewer, and legal/claims counsel. Ask users to explain why no combined score is shown by design, how each separate indicator is interpreted, what is excluded, and which facts are uncertain. Do not test or propose an aggregate index unless the user explicitly changes scope.
