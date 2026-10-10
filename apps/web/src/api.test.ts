import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateProcessEstimates,
  getActiveSources,
  getFactorCatalog,
  type ActiveDataSource,
  type FactorCatalog,
  type ProcessEstimateResponse,
} from './api';

const source: ActiveDataSource = {
  id: 'carbonfact-apparel-footwear-v1.1.0',
  name: 'The Open Source LCA Database for Footwear & Apparel',
  version: '1.1.0',
  release_date: '2026-07-01',
  publisher: 'Carbonfact',
  source_url: 'https://zenodo.org/records/21102756',
  repository_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/releases/tag/v.1.1.0',
  changelog_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/CHANGELOG.md',
  license_name: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
  license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  license_terms_url: 'https://github.com/carbonfact/lca-database-footwear-apparel/blob/v.1.1.0/README.md#license',
  license_status: 'applied',
  method_basis: 'Source factors are scaled independently by reference-unit quantities.',
  use_terms_summary: 'Attribution is available in the Method/source dialog and CSV; derived values use CC BY-SA 4.0.',
  attribution_text: 'Data source: Carbonfact Open Source LCA Database v1.1.0, CC BY-SA 4.0.',
  attribution_links: [{ label: 'Pinned source release', url: 'https://example.com/source' }],
  share_alike_required: true,
  result_license: 'CC BY-SA 4.0',
  background_database_note: 'Underlying inventories are not included or reconstructed.',
  scope_summary: 'Published process-level factors.',
  factor_count: 302,
  family_count: 11,
  impact_indicators: ['GHG — Climate change', 'WTU — Water use'],
  limitations: ['Not a complete product footprint.'],
  active_for_process_estimates: true,
};

const catalog: FactorCatalog = {
  source_id: source.id,
  source_name: source.name,
  source_version: source.version,
  source_url: source.repository_url,
  license_name: source.license_name,
  attribution_text: source.attribution_text,
  license_url: source.license_url,
  result_license: source.result_license,
  background_database_note: source.background_database_note,
  total_records: 1,
  offset: 0,
  limit: 500,
  families: [
    {
      id: 'spinning',
      label: 'Yarn spinning',
      group: 'textile-manufacturing',
      record_count: 1,
      reference_unit_note: 'Per 1 kg yarn.',
    },
  ],
  factors: [
    {
      id: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING#COTTON@WORLD',
      family_id: 'spinning',
      family_label: 'Yarn spinning',
      activity: 'Spinning cotton to yarn',
      source_descriptor: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING#COTTON@WORLD',
      geography_code: 'WORLD',
      geography_label: 'World',
      reference_unit: '1 kg yarn',
      indicator_factors: [
        { code: 'GHG', name: 'Climate change', unit: 'kg CO₂ eq', source_factor_value: 2.5 },
      ],
      data_quality: {
        precision: 2,
        technological_representativeness: 2,
        temporal_representativeness: 2,
        geographical_representativeness: 3,
      },
      input_required_kg_per_reference_unit: 1.1,
      source_file: 'datasets/spinning/impact-scores.csv',
    },
  ],
};

const estimate: ProcessEstimateResponse = {
  status: 'calculated',
  methodology_version: 'published-process-factor-scaling-v1.0',
  scope: 'The API returns independent process rows. The browser can display a selected-row subtotal but not a complete product footprint.',
  aggregation: 'none',
  source_id: source.id,
  source_name: source.name,
  source_version: source.version,
  source_url: source.repository_url,
  license_name: source.license_name,
  attribution_text: source.attribution_text,
  license_url: source.license_url,
  background_database_note: source.background_database_note,
  result_license: 'CC BY-SA 4.0',
  results: [
    {
      factor_id: catalog.factors[0].id,
      family_id: 'spinning',
      family_label: 'Yarn spinning',
      activity: 'Spinning cotton to yarn',
      geography_code: 'WORLD',
      geography_label: 'World',
      quantity: 0.18,
      reference_unit: '1 kg yarn',
      input_required_kg_per_reference_unit: 1.1,
      data_quality: catalog.factors[0].data_quality,
      indicators: [
        {
          code: 'GHG',
          name: 'Climate change',
          factor_value: 2.5,
          factor_unit: 'kg CO₂ eq per 1 kg yarn',
          result_value: 0.45,
          result_unit: 'kg CO₂ eq',
        },
      ],
      source_file: 'datasets/spinning/impact-scores.csv',
    },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe('process factor API', () => {
  it('loads the open factor catalog using a relative path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => catalog });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getFactorCatalog()).resolves.toEqual(catalog);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/factors?limit=500');
  });

  it('loads the active source registry and its attribution terms', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [source] });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getActiveSources()).resolves.toEqual([source]);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sources');
  });

  it('sends selected factors and quantities to the stateless estimate endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => estimate });
    vi.stubGlobal('fetch', fetchMock);

    await expect(calculateProcessEstimates([{ factor_id: catalog.factors[0].id, quantity: 0.18 }]))
      .resolves.toEqual(estimate);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/process-estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processes: [{ factor_id: catalog.factors[0].id, quantity: 0.18 }] }),
    });
  });

  it('surfaces server validation errors to the user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'One or more factor IDs are not in this catalog.' }),
    }));

    await expect(calculateProcessEstimates([{ factor_id: 'bad-id', quantity: 1 }]))
      .rejects.toThrow('One or more factor IDs are not in this catalog.');
  });

  it('reports catalog outages rather than returning an empty factor set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(getFactorCatalog()).rejects.toThrow('Could not load process factors (503).');
  });
});
