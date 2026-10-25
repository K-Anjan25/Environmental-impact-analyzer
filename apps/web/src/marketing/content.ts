/*
 * Marketing copy and configuration for the public landing pages.
 *
 * Every factual claim here is traceable to the repository:
 *  - 302 factor rows, 11 source categories, 12 selectable groups: README.md, data-sources.md
 *  - 25 selections per estimate: services/api/app/factor_schemas.py (max_length=25)
 *  - USLCI mapping is climate change only; N2O uses GWP 273 (IPCC AR6 Table 7.15);
 *    textile fibre production (A1) is not in the bundled data: datasets/sources/SOURCE-RECORD.md
 *  - Privacy: no analytics, no third-party trackers, inputs stay in the browser: PRIVACY.md
 *
 * Items marked PLACEHOLDER need a business decision before launch.
 */

/** The public repository. Used for the source link, the issue tracker, and the GitHub social link. */
export const GITHUB_URL = 'https://github.com/K-Anjan25/Environmental-impact-analyzer';
export const ISSUES_URL = `${GITHUB_URL}/issues/new`;

/**
 * PLACEHOLDER: set this to a monitored mailbox before launch.
 * While empty, the contact form does not open a mail client. It shows the message text to copy
 * into a public GitHub issue instead. The form never sends data to this site's servers.
 */
export const CONTACT_EMAIL = '';

/**
 * PLACEHOLDER: pricing is not part of the current product. Set this to true only after the
 * plans, prices, and included features are confirmed. While false, the page shows a visible note.
 */
export const PRICING_IS_FINAL = false;

/** Fallbacks used until the live catalog responds. They match the bundled data (see CI smoke test). */
export const FALLBACK_FACTOR_COUNT = 302;
export const FALLBACK_GROUP_COUNT = 12;

export const SOURCE_RELEASE_URL = 'https://github.com/carbonfact/lca-database-footwear-apparel';
export const JRC_NORMALISATION_URL = 'https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx';
export const JRC_WEIGHTING_URL = 'https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf';
export const CC_BY_SA_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';

export const HERO = {
  eyebrow: 'Environmental Impact Analyzer',
  title: 'Measure the impact behind every process',
  lede:
    'EcoImpact Lab shows published apparel and footwear process factors with all 16 EF 3.1 indicators kept separate on each row. Each result carries its source unit, geography, and boundary. You choose the rows, and the subtotal covers only those rows.',
  trust: ['Published source data', 'Scope stated on every result', 'Your inputs stay in your browser'],
};

/** Feature rows alternate left and right on the home page. Image alt text describes what is shown. */
export const FEATURES = [
  {
    eyebrow: 'Every process, every indicator',
    title: 'Each process row keeps its 16 indicators',
    body:
      'Each published process row shows all 16 EF 3.1 indicator values in the source unit. Nothing is collapsed into a single number before you read the detail.',
    bullets: ['Indicator code, name, and unit', 'Reference unit as published', 'Geography label from the source'],
    visual: 'indicators' as const,
  },
  {
    eyebrow: 'Selected rows only',
    title: 'Total only the rows you choose',
    body:
      'Pick the rows that belong together. The subtotal adds them per indicator where units agree, and the EF 3.1 score is calculated for that selection only.',
    bullets: ['Per-indicator subtotal of selected rows', 'Normalised and weighted EF 3.1 score', 'Missing values stay missing, never zero'],
    visual: 'selection' as const,
  },
  {
    eyebrow: 'Private by design',
    title: 'Your product inputs stay in your browser',
    body:
      'Input names, quantities, and units are held in page memory. Mapped calculations run in the browser, and the calculation API never receives them.',
    bullets: ['No account and no saved history', 'No analytics or advertising trackers', 'Calculation requests carry factor IDs and quantities only'],
    visual: 'boundary' as const,
  },
];

export const METHOD_STEPS = [
  { title: 'Choose a published process', body: 'Search the apparel and footwear factors by process family and source geography.' },
  { title: 'Confirm geography and unit', body: 'Each factor shows its source geography and reference unit before you enter a quantity.' },
  { title: 'Enter a quantity in that unit', body: 'Quantities are entered in the factor’s own reference unit. Unit conversion is explicit and rejected when dimensions differ.' },
  { title: 'Read all 16 indicators per row', body: 'Every selected process shows its full indicator set with source values and units.' },
  { title: 'Total only the selected rows', body: 'The subtotal and EF 3.1 score cover only the rows you selected, and the result says so.' },
];

export type ScopeRow = { item: string; covered: string; notCovered: string };

/** Scope table on the method page. It states what each part covers and what it leaves out. */
export const SCOPE_ROWS: ScopeRow[] = [
  {
    item: 'Process rows',
    covered: 'Each published row with its 16 EF 3.1 indicator values, kept separate.',
    notCovered: 'A whole-product footprint. Rows are not combined into a product by default.',
  },
  {
    item: 'Selected-row subtotal',
    covered: 'The sum of the rows you select, per indicator, where indicator codes and units agree.',
    notCovered: 'Completeness. Boundaries can overlap, and the app does not remove overlaps for you.',
  },
  {
    item: 'EF 3.1 single score',
    covered: 'The selected rows, normalised with JRC factors and weighted with the recommended final weights.',
    notCovered: 'A ranking or an environmental claim about a product.',
  },
  {
    item: 'USLCI climate-change mapping',
    covered: 'Climate change (GHG) only. N2O is converted with GWP 273 from IPCC AR6 Table 7.15, a documented assumption.',
    notCovered: 'The other 15 EF 3.1 categories. They are not mapped for these rows.',
  },
  {
    item: 'Textile fibre production (A1)',
    covered: 'Nothing. No openly licensed A1 textile-fibre dataset is bundled.',
    notCovered: 'Any A1 claim. Results do not include fibre production unless a row says so.',
  },
  {
    item: 'Your product inputs',
    covered: 'Names, quantities, and units held in your browser. Mapped calculations run locally.',
    notCovered: 'Any server-side storage. The calculation API does not receive these values.',
  },
];

export const METHOD_SOURCES = [
  { label: 'Carbonfact Open Source LCA Database, pinned release v1.1.0', href: SOURCE_RELEASE_URL },
  { label: 'JRC EF 3.1 normalisation and weighting workbook', href: JRC_NORMALISATION_URL },
  { label: 'JRC EF weighting report (2018)', href: JRC_WEIGHTING_URL },
  { label: 'Creative Commons Attribution-ShareAlike 4.0 licence', href: CC_BY_SA_URL },
];

/**
 * Use-case cards for the carousel. These describe how a team might use the tool.
 * They are not customer testimonials, so no names or quotes appear here.
 */
export const USE_CASES = [
  {
    title: 'Sourcing review',
    body: 'Compare published dyeing and finishing rows from one geography before you decide which process route to model.',
    icon: 'search' as const,
  },
  {
    title: 'Product engineering',
    body: 'Total the process rows for one component, then see which indicators carry most of the selected total.',
    icon: 'build' as const,
  },
  {
    title: 'Reporting preparation',
    body: 'Export the rows with source, licence, and method notes attached, so each number keeps its limits when it leaves the tool.',
    icon: 'description' as const,
  },
];

/**
 * PLACEHOLDER: plan names and prices come from the launch brief and are not decided yet.
 * Keep them hidden or relabelled until PRICING_IS_FINAL is true.
 */
export const PRICING_TIERS = [
  {
    name: 'Explorer',
    price: 'Free',
    cadence: '',
    audience: 'Trying the method or running one-off estimates',
    rows: ['Full calculator and 302-row catalog', 'Up to 25 process rows per estimate', 'CSV export with source and method notes'],
    cta: { label: 'Open the calculator', href: '#/calculator' },
  },
  {
    name: 'Team',
    price: '₹4,999',
    cadence: 'per month',
    audience: 'Sustainability and product teams that estimate regularly',
    rows: ['Everything in Explorer', 'Team onboarding and a named contact', 'Priority review of source updates'],
    cta: { label: 'Talk to the team', href: '#/contact' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    audience: 'Organisations with custom sources or reporting needs',
    rows: ['Everything in Team', 'Scoping support for your product boundaries', 'Terms agreed in writing'],
    cta: { label: 'Talk to the team', href: '#/contact' },
  },
];

export type Faq = { question: string; answer: string };

export const FAQS: Faq[] = [
  {
    question: 'Is this a complete product life-cycle assessment?',
    answer:
      'No. The selected-row subtotal and EF 3.1 score cover only the process rows you choose. They do not establish product composition, all life-cycle stages, transport, or end of life. Check each row’s boundary before you use a number.',
  },
  {
    question: 'Where does the data come from?',
    answer:
      'The factors come from the Carbonfact Open Source LCA Database for Footwear and Apparel, pinned to release v1.1.0 (tag v.1.1.0). The published scores are licensed under CC BY-SA 4.0. The bundled files and their licence are listed in the Method section and in every CSV export.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'The catalog changes only when a new source release is pinned. Each release is recorded with its tag and commit, so you can see which version produced a result. The current release is v1.1.0.',
  },
  {
    question: 'Why 302 rows and not the 304 the source mentions?',
    answer:
      'The source’s top-level documentation counts 304 datasets. The rows from its documented families total 302. The app adds no placeholder factors to match the headline count, and it leaves out the non-woven folder, which the source lists as forthcoming.',
  },
  {
    question: 'Is my input data stored or sent to a server?',
    answer:
      'Product-input names, quantities, and units stay in your browser’s page memory and are cleared when the page closes. The calculation API receives only the factor IDs and the quantities you enter as process quantities. It does not log request bodies.',
  },
  {
    question: 'What does the water-use indicator measure?',
    answer:
      'EF 3.1 water use (WTU) is measured in cubic metres of world-equivalent water. It is a water-use impact indicator. It is not a physical volume of water in litres.',
  },
  {
    question: 'Why does textile fibre production not appear?',
    answer:
      'The bundled data has no openly licensed textile-fibre (A1) dataset, so the app does not present A1 as covered. Rows show only the stages their source documents.',
  },
];

export const TOPICS = ['Data question', 'Bug report', 'Pilot or partnership', 'Something else'] as const;

export const SOCIAL_LINKS = [{ label: 'GitHub', href: GITHUB_URL }];
