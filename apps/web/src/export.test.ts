import { describe, expect, it } from 'vitest';
import type { ProcessEstimateResponse } from './api';
import { EF31_SINGLE_SCORE_FACTORS } from './ef31-score';
import { formatProcessEstimatesCsv } from './export';
import { summarizeSelectedProcesses } from './product-summary';

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
  it('preserves each process-indicator row with its source and method notes', () => {
    const csv = formatProcessEstimatesCsv(estimate);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('indicator_code');
    expect(lines[0]).toContain('published_factor_value');
    expect(lines[0]).toContain('normalised_value');
    expect(lines[1]).toContain('"Print, ""reactive"", cotton"');
    expect(lines[1]).toContain('1.1');
    expect(lines[1]).toContain('separate process row; included in selected-row subtotal when available');
    expect(lines[2]).toContain('WTU');
    expect(lines[2]).toContain('m³ world-eq');
  });

  it('exports a manual input association as context and leaves unassociated input results blank', () => {
    const csv = formatProcessEstimatesCsv(estimate, {
      productInputs: [
        { id: 'input-1', name: 'Upper fabric', quantity: '0.35', unit: 'kg', parentId: null },
        { id: 'input-2', name: 'Rubber outsole', quantity: '0.18', unit: 'kg', parentId: null },
      ],
      processLinks: [{ factorId: 'factor-1', familyId: 'spinning', productInputId: 'input-1' }],
    });
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(6);
    expect(lines[0]).toContain('declared_input_name');
    expect(lines[0]).toContain('input_association_status');
    expect(lines[0]).toContain('bom_mass_status');
    expect(lines[0]).toContain('bom_scope_confirmed');
    const processRow = lines.find((line) => line.startsWith('process_indicator,')) ?? '';
    expect(processRow).toContain('Upper fabric');
    expect(processRow).toContain('user-selected context only; input quantity is not used for this process calculation');
    const bomRow = lines.find((line) => line.startsWith('bom_mass_check,')) ?? '';
    expect(bomRow).toContain('missing-product-mass');
    expect(bomRow).toContain('false');
    const unassociatedRow = lines.find((line) => line.startsWith('declared_input_not_calculated,')) ?? '';
    expect(unassociatedRow).toContain('Rubber outsole');
    expect(unassociatedRow).toContain('not calculated and not zero');

    const columns = lines[0].split(',');
    const unassociatedFields = unassociatedRow.split(',');
    expect(unassociatedFields[columns.indexOf('scaled_result_value')]).toBe('');
    expect(unassociatedFields[columns.indexOf('scaled_result_unit')]).toBe('');
  });

  it('exports selected-row totals and the EF 3.1 score with method provenance', () => {
    const completeLine = {
      ...estimate.results[0],
      indicators: Object.entries(EF31_SINGLE_SCORE_FACTORS).map(([code, factor]) => ({
        code,
        name: code,
        factor_value: factor.normalisationFactor,
        factor_unit: `${factor.expectedUnit} per reference unit`,
        result_value: factor.normalisationFactor,
        result_unit: factor.expectedUnit,
      })),
    };
    const completeEstimate: ProcessEstimateResponse = { ...estimate, results: [completeLine] };
    const summary = summarizeSelectedProcesses(completeEstimate.results);
    const csv = formatProcessEstimatesCsv(completeEstimate, {
      productInputs: [],
      processLinks: [],
      summary,
    });
    const lines = csv.split('\r\n');
    const header = lines[0].split(',');
    const recordType = header.indexOf('record_type');
    const types = lines.slice(1).map((line) => line.split(',')[recordType]);
    expect(types.filter((type) => type === 'selected_process_indicator_total')).toHaveLength(16);
    expect(types.filter((type) => type === 'ef31_single_score')).toHaveLength(1);
    expect(header).toContain('normalisation_unit');
    const climateTotal = lines.find((line) => {
      const fields = line.split(',');
      return fields[recordType] === 'selected_process_indicator_total'
        && fields[header.indexOf('indicator_code')] === 'GHG';
    }) ?? '';
    expect(climateTotal.split(',')[header.indexOf('normalisation_unit')]).toBe('kg CO2 eq/person');
    const scoreRow = lines.find((line) => line.includes('ef31_single_score')) ?? '';
    expect(scoreRow).toContain('https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx');
    expect(scoreRow).toContain('https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf');
    expect(scoreRow).toContain('EF 3.1 points');
  });

  it('exports a flat BOM mass diagnostic separately from environmental results', () => {
    const context = {
      productInputs: [{ id: 'fabric', name: 'Fabric', quantity: '0.25', unit: 'kg', parentId: null }],
      processLinks: [],
      finishedProductMassKg: '0.3',
    };
    const unconfirmedCsv = formatProcessEstimatesCsv(estimate, context);
    const unconfirmedRow = unconfirmedCsv.split('\r\n').find((line) => line.startsWith('bom_mass_check,')) ?? '';
    expect(unconfirmedRow).toContain('scope-not-confirmed');
    expect(unconfirmedRow).toContain('false');

    const csv = formatProcessEstimatesCsv(estimate, { ...context, flatBomScopeConfirmed: true });
    const bomRow = csv.split('\r\n').find((line) => line.startsWith('bom_mass_check,')) ?? '';
    expect(bomRow).toContain('true');
    expect(bomRow).toContain('inputs-below-product-mass');
    expect(bomRow).toContain('0.25');
    expect(bomRow).toContain('0.3');
    expect(bomRow).toContain('validates mass closure only');
    expect(bomRow).toContain('mass diagnostic only; not an environmental impact');
  });

  it('exports DEFRA 2026 climate-change rows with source and retrieval date, separate from EF 3.1', () => {
    const csv = formatProcessEstimatesCsv(estimate, {
      productInputs: [{ id: 'fabric', name: 'Fabric', quantity: '0.25', unit: 'kg', parentId: null }],
      processLinks: [],
      finishedProductMassKg: '0.3',
      flatBomScopeConfirmed: true,
      ghg: { endOfLife: 'landfill-mixed-ci' },
    });
    const ghgRow = csv.split('\r\n').find((line) => line.startsWith('ghg_supplement,')) ?? '';
    expect(ghgRow).toContain('C3');
    expect(ghgRow).toContain('2026-10-22');
    expect(ghgRow).toContain('not one of the 16 EF 3.1 indicators');
    const boundaryRow = csv.split('\r\n').find((line) => line.startsWith('product_boundary,')) ?? '';
    expect(boundaryRow).toContain('separate climate-change layer');
    expect(boundaryRow).not.toMatch(/\bcomplete product footprint\b(?<!not a complete product footprint)/);
  });

  it('distinguishes a locally mapped input from a manual context association', () => {
    const csv = formatProcessEstimatesCsv(estimate, {
      productInputs: [{ id: 'input-1', name: 'Cotton feed', quantity: '550', unit: 'g', parentId: null }],
      processLinks: [{ factorId: 'factor-1', familyId: 'spinning', productInputId: 'input-1', quantityBasis: 'declared-input' }],
    });
    expect(csv).toContain('declared input mass used locally as process feed');
    expect(csv).toContain('declared input mass converted using source input-required value');
    expect(csv).not.toContain('declared_input_not_calculated');
  });
});
