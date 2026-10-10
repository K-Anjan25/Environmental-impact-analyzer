import { describe, expect, it } from 'vitest';
import type { ProcessEstimateLine } from './api';
import { EF31_SINGLE_SCORE_FACTORS } from './ef31-score';
import { summarizeSelectedProcesses } from './product-summary';

function estimateLine(activity: string, multiplier = 1): ProcessEstimateLine {
  return {
    factor_id: activity,
    family_id: 'spinning',
    family_label: 'Yarn spinning',
    activity,
    geography_code: 'WORLD',
    geography_label: 'World',
    quantity: 1,
    reference_unit: '1 kg yarn',
    input_required_kg_per_reference_unit: null,
    data_quality: null,
    indicators: Object.entries(EF31_SINGLE_SCORE_FACTORS).map(([code, factor]) => ({
      code,
      name: code,
      factor_value: factor.normalisationFactor,
      factor_unit: `${factor.expectedUnit} per reference unit`,
      result_value: factor.normalisationFactor * multiplier,
      result_unit: factor.expectedUnit,
    })),
    source_file: 'fixture.csv',
  };
}

describe('selected-process indicator subtotal', () => {
  it('sums compatible indicator values and scores the selected rows only', () => {
    const summary = summarizeSelectedProcesses([estimateLine('one'), estimateLine('two')]);
    expect(summary.processCount).toBe(2);
    expect(summary.singleScore?.value).toBeCloseTo(2, 12);
    const climate = summary.indicators.find((item) => item.code === 'GHG');
    expect(climate).toMatchObject({
      value: 15_100,
      unit: 'kg CO₂ eq',
      normalisationFactor: 7_550,
      normalisationUnit: 'kg CO2 eq/person',
      normalisedValue: 2,
    });
    expect(climate?.weightedContribution).toBeCloseTo(0.4212, 12);
    expect(summary.errors).toEqual([]);
  });

  it('refuses to aggregate mixed units and withholds the score', () => {
    const second = estimateLine('two');
    second.indicators = second.indicators.map((indicator) => indicator.code === 'GHG'
      ? { ...indicator, result_unit: 'kg methane' }
      : indicator);
    const summary = summarizeSelectedProcesses([estimateLine('one'), second]);
    expect(summary.indicators.find((item) => item.code === 'GHG')).toMatchObject({
      value: null,
      compatible: false,
    });
    expect(summary.singleScore).toBeNull();
    expect(summary.errors.join(' ')).toMatch(/different units/);
  });
});
