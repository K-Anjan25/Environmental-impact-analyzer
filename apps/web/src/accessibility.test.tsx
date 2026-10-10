// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type {
  ActiveDataSource,
  FactorCatalog,
  ProcessEstimateResponse,
  ProcessFactor,
} from './api';
import theme from './theme';

const factor: ProcessFactor = {
  id: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING#COTTON@WORLD',
  family_id: 'spinning',
  family_label: 'Yarn spinning',
  activity: 'Spinning cotton to yarn',
  source_descriptor: 'MATERIAL_PROCESS_STEP:YARN_FORMATION/SPINNING#COTTON@WORLD',
  geography_code: 'WORLD',
  geography_label: 'World',
  reference_unit: '1 kg yarn',
  indicator_factors: [{ code: 'GHG', name: 'Climate change', unit: 'kg CO₂ eq', source_factor_value: 2.5 }],
  data_quality: {
    precision: 2,
    technological_representativeness: 2,
    temporal_representativeness: 2,
    geographical_representativeness: 3,
  },
  input_required_kg_per_reference_unit: 1.1,
  source_file: 'datasets/spinning/impact-scores.csv',
};

const catalog: FactorCatalog = {
  source_id: 'carbonfact-apparel-footwear-v1.1.0',
  source_name: 'The Open Source LCA Database for Footwear & Apparel',
  source_version: '1.1.0',
  source_url: 'https://example.com/release',
  license_name: 'CC BY-SA 4.0',
  attribution_text: 'Data source: Carbonfact Open Source LCA Database v1.1.0, CC BY-SA 4.0.',
  total_records: 1,
  offset: 0,
  limit: 500,
  families: [{
    id: 'spinning',
    label: 'Yarn spinning',
    group: 'textile-manufacturing',
    record_count: 1,
    reference_unit_note: 'Per 1 kg yarn.',
  }],
  factors: [factor],
};

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
  method_basis: 'Published EF 3.1 process factors scaled by the entered reference-unit quantity.',
  use_terms_summary: 'Same-screen attribution and ShareAlike applied to derived results.',
  attribution_text: catalog.attribution_text,
  attribution_links: [{ label: 'Pinned source release', url: catalog.source_url }],
  share_alike_required: true,
  result_license: 'CC BY-SA 4.0',
  background_database_note: 'Full background inventories are not included or reconstructed.',
  scope_summary: 'Published process factors; each selected process is returned separately.',
  factor_count: 302,
  family_count: 11,
  impact_indicators: ['16 EF 3.1 indicators'],
  limitations: ['Outputs are not a whole-product footprint.'],
  active_for_process_estimates: true,
};

const indicatorDefinitions = [
  ['ACD', 'Acidification', 'mol H⁺ eq'],
  ['ETF', 'Ecotoxicity, freshwater', 'CTUe'],
  ['FRU', 'Fossil resource use', 'MJ'],
  ['FWE', 'Eutrophication, freshwater', 'kg P eq'],
  ['GHG', 'Climate change', 'kg CO₂ eq'],
  ['HTC', 'Human toxicity, cancer', 'CTUhtc'],
  ['HTN', 'Human toxicity, non-cancer', 'CTUhtn'],
  ['IOR', 'Ionising radiation', 'kBq U-235 eq'],
  ['LDU', 'Land use', 'Pt'],
  ['MRU', 'Mineral resource use', 'kg Sb eq'],
  ['OZD', 'Ozone depletion', 'kg CFC-11 eq'],
  ['PCO', 'Photochemical ozone formation', 'kg NMVOC eq'],
  ['PMA', 'Particulate matter', 'disease incidence'],
  ['SWE', 'Eutrophication, marine', 'kg N eq'],
  ['TRE', 'Eutrophication, terrestrial', 'mol N eq'],
  ['WTU', 'Water use', 'm³ world-eq'],
] as const;

const estimate: ProcessEstimateResponse = {
  status: 'calculated',
  methodology_version: 'published-process-factor-scaling-v1.0',
  scope: 'Each selected process factor is scaled by its entered quantity. No cross-stage total is calculated.',
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
  results: [{
    factor_id: factor.id,
    family_id: factor.family_id,
    family_label: factor.family_label,
    activity: factor.activity,
    geography_code: factor.geography_code,
    geography_label: factor.geography_label,
    quantity: 0.18,
    reference_unit: factor.reference_unit,
    input_required_kg_per_reference_unit: 1.1,
    data_quality: factor.data_quality,
    indicators: indicatorDefinitions.map(([code, name, unit]) => ({
      code,
      name,
      factor_value: code === 'GHG' ? 2.5 : 0.1,
      factor_unit: `${unit} per ${factor.reference_unit}`,
      result_value: code === 'GHG' ? 0.45 : 0.018,
      result_unit: unit,
    })),
    source_file: factor.source_file,
  }],
};

function stubApi(catalogResponse: FactorCatalog = catalog): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const path = String(input);
    if (path === '/api/v1/factors?limit=500') return { ok: true, json: async () => catalogResponse };
    if (path === '/api/v1/sources') return { ok: true, json: async () => [source] };
    if (path === '/api/v1/process-estimates') return { ok: true, json: async () => estimate };
    return { ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function expectNoAxeViolations(): Promise<void> {
  const report = await axe.run(document.body, {
    rules: {
      // JSDOM cannot calculate rendered color contrast; theme colors are checked explicitly below.
      'color-contrast': { enabled: false },
    },
  });
  expect(report.violations).toEqual([]);
}

async function calculateExample(): Promise<void> {
  await screen.findByText('Build a process estimate.');
  const factorInput = screen.getByRole('combobox', { name: 'Process activity' });
  fireEvent.change(factorInput, { target: { value: 'Spinning cotton to yarn' } });
  fireEvent.click(await screen.findByRole('option', { name: /Spinning cotton to yarn/ }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity in source reference units' }), {
    target: { value: '0.18' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add process' }));
  fireEvent.click(screen.getByRole('button', { name: 'Calculate separate indicators' }));
  await screen.findByRole('table', { name: /Separate environmental indicators for Spinning cotton to yarn/ });
}

describe('process estimator accessibility', () => {
  it('uses accessible theme colors and keeps the illustration decorative', () => {
    const background = '#f4f1e9';
    const luminance = (hex: string) => {
      const channel = (offset: number) => {
        const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
    };
    const contrast = (foreground: string, surface: string) => {
      const [lighter, darker] = [luminance(foreground), luminance(surface)].sort((a, b) => b - a);
      return (lighter + 0.05) / (darker + 0.05);
    };

    expect(contrast(theme.palette.primary.main, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.palette.text.primary, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.palette.text.secondary, background)).toBeGreaterThanOrEqual(4.5);

    stubApi();
    const { container } = render(<App />);
    const illustration = container.querySelector('.landscape-scene');
    expect(illustration?.getAttribute('aria-hidden')).toBe('true');
    expect(illustration?.getAttribute('focusable')).toBe('false');
    const dashboardText = container.textContent ?? '';
    expect(dashboardText).not.toContain('Source factors, not a product score');
    expect(dashboardText).not.toContain('Separate indicators. No combined score.');
    expect(dashboardText).not.toContain('Each selected process is reported on its own; this is not a whole-product footprint.');
    expect(dashboardText).not.toContain('Illustration only · values come from cited process data');
    expect(dashboardText).not.toContain('Open-data process estimates');
    expect(dashboardText).not.toContain('Open process data');
    expect(dashboardText).not.toContain('OPEN FACTORS');
    expect(screen.getByText('Environmental Impact Analyzer')).toBeTruthy();
    const legalNavigation = screen.getByRole('navigation', { name: 'Legal and source links' });
    expect(legalNavigation).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/legal/privacy.html');
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/legal/terms.html');
    expect(screen.getByRole('link', { name: 'License' }).getAttribute('href')).toBe('/legal/license.html');
  });

  it('filters source factors by an exact source geography', async () => {
    const vietnamFactor: ProcessFactor = {
      ...factor,
      id: factor.id.replace('@WORLD', '@VN'),
      source_descriptor: factor.source_descriptor.replace('@WORLD', '@VN'),
      activity: 'Spinning cotton to yarn in Vietnam',
      geography_code: 'VN',
      geography_label: 'Vietnam',
    };
    const geographyCatalog: FactorCatalog = {
      ...catalog,
      total_records: 2,
      families: catalog.families.map((family) => ({ ...family, record_count: 2 })),
      factors: [factor, vietnamFactor],
    };
    stubApi(geographyCatalog);
    render(<App />);
    await screen.findByText('Build a process estimate.');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Source geography' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Vietnam (VN) (1)' }));

    const factorInput = screen.getByRole('combobox', { name: 'Process activity' });
    fireEvent.change(factorInput, { target: { value: 'Spinning cotton' } });
    expect(await screen.findByRole('option', { name: /Spinning cotton to yarn in Vietnam/ })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /Spinning cotton to yarn · World/ })).toBeNull();
  });

  it('has no axe violations in the calculator and populated indicator results', async () => {
    stubApi();
    render(<App />);
    await expectNoAxeViolations();
    await calculateExample();
    expect(screen.getAllByRole('row')).toHaveLength(17);
    expect(screen.getByText('Source attribution · CC BY-SA 4.0')).toBeTruthy();
    expect(screen.getByText(/Each selected process factor is scaled/)).toBeTruthy();
    await expectNoAxeViolations();
  });

  it('downloads the calculated CSV from the results panel', async () => {
    stubApi();
    render(<App />);
    await calculateExample();

    const createObjectURL = vi.fn().mockReturnValue('blob:csv-download');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const downloadClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('environmental-process-estimates.csv');
      expect(this.href).toBe('blob:csv-download');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('text/csv;charset=utf-8');
    expect(downloadClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv-download');
  });

  it('shows source and privacy details in an accessible methodology dialog', async () => {
    const fetchMock = stubApi();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Method & data' }));
    await screen.findByRole('heading', { name: 'Implemented calculation' });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/v1/sources'));
    await screen.findByText(/Data source: Carbonfact Open Source LCA Database/);
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeTruthy();
    await expectNoAxeViolations();
  });
});
