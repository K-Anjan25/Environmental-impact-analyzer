import type { CandidateDataSource } from './api';

type OpenLicenseContactSource = Pick<
  CandidateDataSource,
  'name' | 'version' | 'repository_url' | 'license_clarification_contact'
>;

export function buildOpenLicenseInquiryHref(source: OpenLicenseContactSource): string {
  const subject = `Open-license clarification for ${source.name} v${source.version}`;
  const body = [
    'Hello Carbonfact LCA team,',
    '',
    `We are evaluating only openly licensed data and the pinned ${source.version} release:`,
    source.repository_url,
    '',
    'Could you please clarify the following before any integration?',
    '1. Does the current product/platform integration guidance apply to this pinned release?',
    '2. Which published impact-score CSVs and foreground parameters are covered by CC BY-SA 4.0, separately from the full background inventories?',
    '3. What same-screen attribution, notice retention, user-reuse, and change-marking requirements apply?',
    '4. Must adapted or recalculated product-level values served by an application be shared under CC BY-SA 4.0 or compatible open terms?',
    '5. Does use of the published scores alone require access to or rights in ecoinvent 3.12? We will not access or reconstruct the undistributed inventories.',
    '',
    'If the intended use cannot be supported under verified open terms, we will exclude this release; we are not seeking a separate commercial license or non-open data access.',
    '',
    'Thank you,',
    'Environmental Impact Analyzer team',
  ].join('\n');

  return `mailto:${source.license_clarification_contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
