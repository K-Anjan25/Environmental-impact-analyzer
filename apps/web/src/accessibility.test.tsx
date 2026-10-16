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
  license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  result_license: 'CC BY-SA 4.0',
  background_database_note: 'Full background inventories are not included or reconstructed.',
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
  use_terms_summary: 'Attribution is provided in the Method/source dialog and CSV; ShareAlike applies to derived results.',
  attribution_text: catalog.attribution_text,
  attribution_links: [
    { label: 'Pinned source release', url: catalog.source_url },
    { label: 'CC BY-SA 4.0 license', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ],
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
  scope: 'The API scales each selected factor independently and returns separate process rows. The browser may summarize selected rows, but no complete product boundary is established.',
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
  fireEvent.click(screen.getByRole('button', { name: 'Calculate selected rows' }));
  await screen.findByRole('table', { name: /Separate environmental indicators for Spinning cotton to yarn/ });
}

describe('process estimator accessibility', () => {
  it('uses accessible theme colors and names imagery while keeping the brand mark decorative', () => {
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

    expect(container.querySelector('.hero-scene')).not.toBeNull();
    expect(container.querySelector('.hero-scene')?.getAttribute('aria-hidden')).toBe('true');
    const brandMark = container.querySelector('.brand-mark-image');
    expect(brandMark?.getAttribute('alt')).toBe('');
    const dashboardText = container.textContent ?? '';
    expect(dashboardText).not.toContain('Source factors, not a product score');
    expect(dashboardText).not.toContain('Separate indicators. No combined score.');
    expect(dashboardText).not.toContain('Each selected process is reported on its own; this is not a whole-product footprint.');
    expect(dashboardText).not.toContain('Illustration only · values come from cited process data');
    expect(dashboardText).not.toContain('Open-data process estimates');
    expect(dashboardText).not.toContain('Open process data');
    expect(dashboardText).not.toContain('Open process library');
    expect(dashboardText).not.toContain('OPEN FACTORS');
    expect(screen.getAllByText('Environmental Impact Analyzer')).toHaveLength(2);
    const legalNavigation = screen.getByRole('navigation', { name: 'Legal and source links' });
    expect(legalNavigation).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/legal/privacy.html');
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/legal/terms.html');
    expect(screen.getByRole('link', { name: 'Software license' }).getAttribute('href')).toBe('/legal/license.html');
    expect(screen.getByRole('link', { name: 'Data sources' }).getAttribute('href')).toBe('/legal/data-sources.html');
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

  it('keeps the input area concise and declared product inputs local', async () => {
    const fetchMock = stubApi();
    const { container } = render(<App />);
    await screen.findByText('Build a process estimate.');

    const inputWorkspace = container.querySelector('.product-input-workspace');
    expect(inputWorkspace?.textContent).not.toMatch(/context only|not sent to the API|manual association|not calculated, not zero/i);
    expect(screen.getByRole('heading', { name: 'Product inputs' })).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox', { name: 'Input or component name' }), {
      target: { value: 'Upper cotton fabric' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Declared quantity' }), {
      target: { value: '0.35' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit label' }), {
      target: { value: 'kg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add input' }));
    expect(screen.getByText('Upper cotton fabric')).toBeTruthy();

    const factorInput = screen.getByRole('combobox', { name: 'Process activity' });
    fireEvent.change(factorInput, { target: { value: 'Spinning cotton to yarn' } });
    fireEvent.click(await screen.findByRole('option', { name: /Spinning cotton to yarn/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity in source reference units' }), {
      target: { value: '0.18' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add process' }));

    const inputContext = screen.getByRole('combobox', { name: 'Link input' });
    fireEvent.mouseDown(inputContext);
    fireEvent.click(await screen.findByRole('option', { name: 'Upper cotton fabric — 0.35 kg' }));

    fireEvent.click(screen.getByRole('button', { name: 'Calculate selected rows' }));
    await screen.findByRole('table', { name: /Separate environmental indicators for Spinning cotton to yarn/ });
    const inputContextText = screen.getByText('Input mapping:').closest('p')?.textContent ?? '';
    expect(inputContextText).toContain('0.35 kg');
    expect(inputContextText).toMatch(/Manual process quantity/);
    expect(screen.getByText(/0\.18 × 1 kg yarn/)).toBeTruthy();

    const calculationCall = fetchMock.mock.calls.find(([path]) => String(path) === '/api/v1/process-estimates');
    const request = calculationCall?.[1] as RequestInit | undefined;
    expect(JSON.parse(String(request?.body))).toEqual({
      processes: [{ factor_id: factor.id, quantity: 0.18 }],
    });
    await expectNoAxeViolations();
  });

  it('shows user-confirmed text matches for product-input factor mapping', async () => {
    stubApi();
    render(<App />);
    await screen.findByText('Build a process estimate.');
    await screen.findByRole('combobox', { name: 'Process activity' });

    fireEvent.change(screen.getByRole('textbox', { name: 'Input or component name' }), {
      target: { value: 'Cotton yarn' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Declared quantity' }), {
      target: { value: '0.35' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit label' }), { target: { value: 'kg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add input' }));
    expect(await screen.findByText('Cotton yarn')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Find factor' }));

    expect(await screen.findByRole('heading', { name: 'Match a process factor' })).toBeTruthy();
    expect(screen.getByText(/Text matches only/)).toBeTruthy();
    expect(screen.getByText('Spinning cotton to yarn')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Use as output' }));
    const mappedQuantity = await screen.findByRole('spinbutton', { name: 'Mapped quantity' });
    expect((mappedQuantity as HTMLInputElement).value).toBe('0.35');
    expect(await screen.findByText('Input is process output')).toBeTruthy();
  });

  it('maps a declared mass input locally and never sends it to the calculation API', async () => {
    const fetchMock = stubApi();
    render(<App />);
    await screen.findByText('Build a process estimate.');

    fireEvent.change(screen.getByRole('textbox', { name: 'Input or component name' }), {
      target: { value: 'Cotton feed' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Declared quantity' }), {
      target: { value: '0.55' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit label' }), { target: { value: 'kg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add input' }));

    const factorInput = screen.getByRole('combobox', { name: 'Process activity' });
    fireEvent.change(factorInput, { target: { value: 'Spinning cotton to yarn' } });
    fireEvent.click(await screen.findByRole('option', { name: /Spinning cotton to yarn/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Quantity in source reference units' }), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add process' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Link input' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Cotton feed — 0.55 kg' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Quantity basis' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Input is process feed' }));
    expect((screen.getByRole('spinbutton', { name: 'Mapped quantity' }) as HTMLInputElement).value).toBe('0.5');

    fireEvent.click(screen.getByRole('button', { name: 'Calculate selected rows' }));
    await screen.findByRole('table', { name: /Separate environmental indicators for Spinning cotton to yarn/ });
    expect(screen.getByText(/0\.5 × 1 kg yarn/)).toBeTruthy();
    expect(fetchMock.mock.calls.some(([path]) => String(path) === '/api/v1/process-estimates')).toBe(false);
  });

  it('checks flat BOM mass locally and keeps unmapped inputs explicitly uncalculated', async () => {
    const fetchMock = stubApi();
    render(<App />);
    await screen.findByRole('combobox', { name: 'Process activity' });

    for (const [name, quantity, unit] of [
      ['Upper fabric', '250', 'g'],
      ['Rubber sole', '0.1', 'kg'],
    ]) {
      fireEvent.change(screen.getByRole('textbox', { name: 'Input or component name' }), { target: { value: name } });
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Declared quantity' }), { target: { value: quantity } });
      fireEvent.change(screen.getByRole('textbox', { name: 'Unit label' }), { target: { value: unit } });
      fireEvent.click(screen.getByRole('button', { name: 'Add input' }));
    }

    fireEvent.click(screen.getByText('Product mass check'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'All declared lines are product components for one functional unit' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Finished product mass per functional unit (kg)' }), {
      target: { value: '0.35' },
    });
    expect(await screen.findByText('Declared input mass matches finished-product mass within calculator precision.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit product input Upper fabric' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save input' }));
    expect((screen.getByRole('checkbox', { name: 'All declared lines are product components for one functional unit' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText('Confirm that every declared line is a product component for one functional unit.')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'All declared lines are product components for one functional unit' }));
    expect(await screen.findByText('Declared input mass matches finished-product mass within calculator precision.')).toBeTruthy();

    await calculateExample();
    expect(screen.getByText('Flat BOM mass diagnostic')).toBeTruthy();
    expect(screen.getByText('Declared-input use')).toBeTruthy();
    expect(screen.getByText(/Not calculated \(not zero\): Upper fabric, Rubber sole/)).toBeTruthy();
    const estimateCall = fetchMock.mock.calls.find(([path]) => String(path) === '/api/v1/process-estimates');
    expect(estimateCall).toBeTruthy();
    expect(JSON.stringify(estimateCall?.[1])).not.toContain('0.35');
    expect(JSON.stringify(estimateCall?.[1])).not.toContain('Upper fabric');
    await expectNoAxeViolations();
  });

  it('has no axe violations in the calculator and populated indicator results', async () => {
    stubApi();
    const { container } = render(<App />);
    await expectNoAxeViolations();
    await calculateExample();
    const processTable = screen.getByRole('table', { name: /Separate environmental indicators for Spinning cotton to yarn/ });
    expect(processTable.querySelectorAll('tbody tr')).toHaveLength(16);
    expect(screen.getByText('Selected rows only')).toBeTruthy();
    expect(screen.queryByText('Source attribution · CC BY-SA 4.0')).toBeNull();
    expect(screen.queryByRole('link', { name: /Open pinned source release/ })).toBeNull();
    expect(container.querySelector('.result-source-card')).toBeNull();
    expect(container.querySelector('.process-result-details')).toBeNull();
    expect(container.querySelector('.summary-method-link')).toBeNull();
    expect(container.querySelector('.result-attribution')).toBeNull();
    expect(screen.getByText('Selected-process total')).toBeTruthy();
    expect(screen.getByText('EF 3.1 single score')).toBeTruthy();
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
    expect(screen.getByRole('link', { name: 'Pinned source release' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0 license' })).toBeTruthy();
    expect(screen.getByText(/CC BY-SA 4.0\. Attribution and ShareAlike apply/)).toBeTruthy();
    expect(screen.getByText(/Full background inventories are not included or reconstructed/)).toBeTruthy();
    expect(screen.getByText(/Each published process factor is scaled by its own reference-unit quantity/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeTruthy();
    await expectNoAxeViolations();
  });
});
