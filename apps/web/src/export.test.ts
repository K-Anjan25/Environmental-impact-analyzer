import { describe, expect, it } from 'vitest';
import type { ProcessEstimateResponse } from './api';
import { formatProcessEstimatesCsv } from './export';

const estimate: ProcessEstimateResponse = {
  status: 'calculated',
  methodology_version: 'published-process-factor-scaling-v1.0',
  scope: 'Separate process rows.',
  aggregation: 'none',
  source_id: 'carbonfact-apparel-footwear-v1.1.0',
  source_name: 'Open apparel process factors',
  source_version: '1.1.0',
  source_url: 'https://example.com/release',
  license_name: 'CC BY-SA 4.0',
  attribution_text: 'Data source: Sample, v1.1.0, CC BY-SA 4.0.',
  license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  background_database_note: 'Scores may include licensed background process contributions.',
  result_license: 'CC BY-SA 4.0',
  results: [{
    factor_id: 'factor-1',
    family_id: 'printing',
    family_label: 'Printing',
    activity: 'Print, "reactive", cotton',
    geography_code: 'WORLD',
    geography_label: 'World',
    quantity: 0.5,
    reference_unit: '1 kg printed fabric',
    input_required_kg_per_reference_unit: 1.0125,
    data_quality: {
      precision: 2,
      technological_representativeness: 2.1,
      temporal_representativeness: 2.2,
      geographical_representativeness: 3,
    },
    indicators: [
      {
        code: 'GHG',
        name: 'Climate change',
        factor_value: 2.2,
        factor_unit: 'kg CO₂ eq per 1 kg printed fabric',
        result_value: 1.1,
        result_unit: 'kg CO₂ eq',
      },
      {
        code: 'WTU',
        name: 'Water use',
        factor_value: 0.15,
        factor_unit: 'm³ world-eq per 1 kg printed fabric',
        result_value: 0.075,
        result_unit: 'm³ world-eq',
      },
    ],
    source_file: 'datasets/printing/impact-scores.csv',
  }],
};

describe('CSV export', () => {
  it('exports individual indicator rows with source attribution, license, and no combined total', () => {
    const csv = formatProcessEstimatesCsv(estimate);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('indicator_code');
    expect(lines[0]).toContain('published_factor_value');
    expect(lines[0]).toContain('result_license');
    expect(lines[0]).toContain('license_url');
    expect(lines[0]).not.toContain('combined_score');
    expect(lines[1]).toContain('"Print, ""reactive"", cotton"');
    expect(lines[1]).toContain('Data source: Sample, v1.1.0, CC BY-SA 4.0.');
    expect(lines[1]).toContain('1.1');
    expect(lines[1]).toContain('CC BY-SA 4.0');
    expect(lines[1]).toContain('https://creativecommons.org/licenses/by-sa/4.0/');
    expect(lines[1]).toContain(',none');
    expect(lines[2]).toContain('WTU');
    expect(lines[2]).toContain('m³ world-eq');
  });

  it('exports a manual input association as context and leaves unassociated input results blank', () => {
    const csv = formatProcessEstimatesCsv(estimate, {
      productInputs: [
        { id: 'input-1', name: 'Upper fabric', quantity: '0.35', unit: 'kg' },
        { id: 'input-2', name: 'Rubber outsole', quantity: '0.18', unit: 'kg' },
      ],
      processLinks: [{ factorId: 'factor-1', productInputId: 'input-1' }],
    });
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('declared_input_name');
    expect(lines[0]).toContain('input_association_status');
    expect(lines[1]).toContain('Upper fabric');
    expect(lines[1]).toContain('user-selected context only; declared input quantity is not used in calculation');
    expect(lines[3]).toContain('declared_input_not_calculated');
    expect(lines[3]).toContain('Rubber outsole');
    expect(lines[3]).toContain('not calculated and not zero');

    const columns = lines[0].split(',');
    const unassociatedFields = lines[3].split(',');
    expect(unassociatedFields[columns.indexOf('scaled_result_value')]).toBe('');
    expect(unassociatedFields[columns.indexOf('scaled_result_unit')]).toBe('');
  });
});
