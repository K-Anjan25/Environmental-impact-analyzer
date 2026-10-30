// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import LandingPage from './LandingPage';
import type {
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
  source_id: catalog.source_id,
  source_name: catalog.source_name,
  source_version: catalog.source_version,
  source_url: catalog.source_url,
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
    const landing = render(<LandingPage />);
    expect(landing.container.querySelector('.nb-spec')?.getAttribute('aria-hidden')).toBe('true');
    expect(landing.container.querySelector('img[src*="/images/"]')).toBeNull();
    expect(landing.container.querySelector('.site-brand img')?.getAttribute('alt')).toBe('');
    landing.unmount();

    const { container } = render(<App />);
    const dashboardText = container.textContent ?? '';
    expect(dashboardText).not.toContain('Source factors, not a product score');
    expect(dashboardText).not.toContain('Separate indicators. No combined score.');
    expect(dashboardText).not.toContain('Each selected process is reported on its own; this is not a whole-product footprint.');
    expect(dashboardText).not.toContain('Illustration only · values come from cited process data');
    expect(dashboardText).not.toContain('Open-data process estimates');
    expect(dashboardText).not.toContain('Open process data');
    expect(dashboardText).not.toContain('Open process library');
    expect(dashboardText).not.toContain('OPEN FACTORS');
    expect(screen.getAllByText('EcoImpact Lab')).toHaveLength(2);
    const legalNavigation = screen.getByRole('navigation', { name: 'Legal' });
    expect(legalNavigation).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy policy' }).getAttribute('href')).toBe('#/legal/privacy');
    expect(screen.getByRole('link', { name: 'Terms of use' }).getAttribute('href')).toBe('#/legal/terms');
    expect(screen.queryByRole('link', { name: 'Website license' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Data sources' })).toBeNull();
  });


async function fillCalculator(options: { productName?: string; finishedKg?: string; materialKg?: string; scope?: boolean } = {}): Promise<void> {
  await screen.findByRole('heading', { name: 'Calculator' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Product name' }), { target: { value: options.productName ?? 'Cotton tote' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Finished weight (kg)' }), { target: { value: options.finishedKg ?? '0.18' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Material name' }), { target: { value: 'Cotton yarn' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Weight (kg)' }), { target: { value: options.materialKg ?? '0.18' } });
  const processBox = screen.getByRole('combobox', { name: 'Process' });
  fireEvent.change(processBox, { target: { value: 'Spinning cotton to yarn' } });
  fireEvent.click(await screen.findByRole('option', { name: /Spinning cotton to yarn/ }));
  if (options.scope !== false) {
    fireEvent.click(screen.getByRole('checkbox', { name: 'These materials make up the whole product' }));
  }
}

  it('shows errors only after Calculate and names each field plainly', async () => {
    stubApi();
    render(<App />);
    await screen.findByRole('heading', { name: 'Calculator' });
    expect(screen.queryByText('Enter the product name.')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Enter the product name.')).toBeTruthy();
    expect(screen.getByText('Enter the finished weight in kg.')).toBeTruthy();
    expect(screen.getByText('Enter a name.')).toBeTruthy();
    expect(screen.getByText('Choose a process.')).toBeTruthy();
    expect(screen.getByText('Tick this box to confirm.')).toBeTruthy();
    expect(screen.queryByText(/Pick a process|Name \(for example/)).toBeNull();
  });

  it('calculates locally, without sending anything to the calculation API', async () => {
    const fetchMock = stubApi();
    render(<App />);
    await fillCalculator();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(await screen.findByRole('heading', { name: 'Results' })).toBeTruthy();
    expect(await screen.findByText('Spinning cotton to yarn')).toBeTruthy();
    const apiCalls = fetchMock.mock.calls.filter(([path]) => String(path) === '/api/v1/process-estimates');
    expect(apiCalls.length).toBe(0);
  });

  it('reports a mass mismatch as an inline error and keeps downloads locked', async () => {
    stubApi();
    render(<App />);
    await fillCalculator({ finishedKg: '0.35', materialKg: '0.18' });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(await screen.findByText(/Declared input mass is below finished-product mass/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Download Excel' })).toBeNull();
  });

  it('unlocks downloads once the mass balances, and has no axe violations', async () => {
    stubApi();
    render(<App />);
    await fillCalculator();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    await screen.findByRole('heading', { name: 'Results' });
    const excel = await screen.findByRole('button', { name: 'Download Excel' });
    expect(excel.hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Download CSV' }).hasAttribute('disabled')).toBe(false);
    await expectNoAxeViolations();
  });
});
