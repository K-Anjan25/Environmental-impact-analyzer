import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCandidateSources, type CandidateDataSource } from './api';

const candidate: CandidateDataSource = {
  id: 'carbonfact-apparel-footwear-v1.1.0',
  name: 'Carbonfact Open Source LCA Database for Footwear & Apparel',
  version: '1.1.0',
  release_date: '2026-07-01',
  publisher: 'Carbonfact',
  source_url: 'https://zenodo.org/records/21102756',
  repository_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0',
  changelog_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/CHANGELOG.md',
  license_name: 'CC BY-SA 4.0 (as stated by the source repository)',
  license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  license_terms_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/blob/main/README.md#if-you-integrate-this-database-into-a-product-or-platform',
  license_review_status: 'pending',
  method_review_status: 'pending',
  review_gates: [
    {
      id: 'license-and-distribution',
      title: 'Confirm open-license scope and obligations',
      details: 'Confirm which terms apply to the pinned release.',
      status: 'pending',
    },
  ],
  use_terms_summary: 'Published scores and foreground parameters state CC BY-SA 4.0; product integration terms remain under review.',
  attribution_text: 'Data source: The Carbonfact Open Source LCA Database for Footwear & Apparel v1.1.0, CC BY-SA 4.0.',
  attribution_links: [
    { label: 'Carbonfact source repository', url: 'https://github.com/carbonfact/lca-database-footwear-apparel' },
    { label: 'Carbonfact database page', url: 'https://www.carbonfact.com/database' },
  ],
  share_alike_required: true,
  background_database_note: 'Full ecoinvent 3.12 inventories are not distributed and will not be accessed or reconstructed.',
  license_clarification_contact: 'science@carbonfact.com',
  scope_summary: 'Process-level factors; not a product footprint.',
  impact_indicators: ['GHG', 'WTU'],
  limitations: ['Not active for scoring.'],
  active_for_scoring: false,
};

afterEach(() => vi.unstubAllGlobals());

describe('candidate source API', () => {
  it('loads the informational registry using a relative API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [candidate],
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCandidateSources()).resolves.toEqual([candidate]);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sources');
  });

  it('surfaces a registry error instead of silently treating it as empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(getCandidateSources()).rejects.toThrow('Could not load source registry (503).');
  });
});
