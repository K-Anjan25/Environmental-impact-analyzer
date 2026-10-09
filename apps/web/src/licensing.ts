import type { CandidateDataSource } from './api';

type LicensingContactSource = Pick<
  CandidateDataSource,
  'name' | 'version' | 'repository_url' | 'commercial_license_contact'
>;

export function buildLicensingInquiryHref(source: LicensingContactSource): string {
  const subject = `Licensing clarification for ${source.name} v${source.version}`;
  const body = [
    'Hello Carbonfact LCA team,',
    '',
    `We are evaluating the pinned ${source.version} release for a consumer-facing prototype:`,
    source.repository_url,
    '',
    'Could you please clarify the following before we integrate or distribute any data?',
    '1. Does the current product/platform integration guidance apply to this pinned release?',
    '2. What attribution, license-notice, downstream-user, and change-marking requirements apply when showing product-level results based on its pre-calculated impact scores?',
    '3. Must adapted or recalculated product-level values served by the application be released under CC BY-SA 4.0 (or a compatible license)?',
    '4. Does using only the publicly published impact-score CSVs require any ecoinvent rights beyond those needed for full underlying inventories?',
    '5. If the open-license conditions do not fit, how can we request a separate commercial license and its applicable terms?',
    '',
    'We will keep the dataset inactive until the applicable rights and methodology are reviewed.',
    '',
    'Thank you,',
    'Environmental Impact Analyzer team',
  ].join('\n');

  return `mailto:${source.commercial_license_contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
