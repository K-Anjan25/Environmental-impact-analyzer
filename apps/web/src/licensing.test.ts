import { describe, expect, it } from 'vitest';
import type { CandidateDataSource } from './api';
import { buildLicensingInquiryHref } from './licensing';

const source = {
  name: 'Carbonfact Open Source LCA Database for Footwear & Apparel',
  version: '1.1.0',
  repository_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0',
  commercial_license_contact: 'science@carbonfact.com',
} satisfies Pick<
  CandidateDataSource,
  'name' | 'version' | 'repository_url' | 'commercial_license_contact'
>;

describe('licensing inquiry draft', () => {
  it('creates an editable email draft without sending a request', () => {
    const href = buildLicensingInquiryHref(source);
    const [recipient, query = ''] = href.split('?');
    const parameters = new URLSearchParams(query);

    expect(recipient).toBe('mailto:science@carbonfact.com');
    expect(parameters.get('subject')).toContain('v1.1.0');
    expect(parameters.get('body')).toContain('Does the current product/platform integration guidance apply');
    expect(parameters.get('body')).toContain('Must adapted or recalculated product-level values');
    expect(parameters.get('body')).toContain('We will keep the dataset inactive');
  });
});
