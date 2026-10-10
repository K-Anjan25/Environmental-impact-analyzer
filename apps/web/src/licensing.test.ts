import { describe, expect, it } from 'vitest';
import type { CandidateDataSource } from './api';
import { buildOpenLicenseInquiryHref } from './licensing';

const source = {
  name: 'Carbonfact Open Source LCA Database for Footwear & Apparel',
  version: '1.1.0',
  repository_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0',
  license_clarification_contact: 'science@carbonfact.com',
} satisfies Pick<
  CandidateDataSource,
  'name' | 'version' | 'repository_url' | 'license_clarification_contact'
>;

describe('open-license clarification draft', () => {
  it('creates an editable open-data inquiry without sending or seeking non-open terms', () => {
    const href = buildOpenLicenseInquiryHref(source);
    const [recipient, query = ''] = href.split('?');
    const parameters = new URLSearchParams(query);
    const body = parameters.get('body') ?? '';

    expect(recipient).toBe('mailto:science@carbonfact.com');
    expect(parameters.get('subject')).toContain('v1.1.0');
    expect(body).toContain('Does the current product/platform integration guidance apply');
    expect(body).toContain('CC BY-SA 4.0');
    expect(body).toContain('we will exclude this release');
    expect(body).toContain('not seeking a separate commercial license');
  });
});
