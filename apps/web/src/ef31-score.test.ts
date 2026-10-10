import { describe, expect, it } from 'vitest';
import {
  calculateEf31SingleScore,
  EF31_SINGLE_SCORE_FACTORS,
  EF31_SINGLE_SCORE_SOURCE,
  EF31_WEIGHTING_SOURCE,
} from './ef31-score';

const categories = Object.entries(EF31_SINGLE_SCORE_FACTORS).map(([code, factor]) => ({
  code,
  name: code,
  result_value: factor.normalisationFactor,
  result_unit: factor.expectedUnit,
}));

describe('EF 3.1 single-score calculation', () => {
  it('normalises and weights all 16 indicators using the JRC factors', () => {
    const score = calculateEf31SingleScore(categories);
    expect(score).not.toBeNull();
    expect(score?.value).toBeCloseTo(1, 12);
    expect(score?.components).toHaveLength(16);
    expect(score?.sourceUrl).toBe(EF31_SINGLE_SCORE_SOURCE);
    expect(score?.normalisationSourceUrl).toBe(EF31_SINGLE_SCORE_SOURCE);
    expect(score?.weightingSourceUrl).toBe(EF31_WEIGHTING_SOURCE);
    expect(Object.values(EF31_SINGLE_SCORE_FACTORS)
      .reduce((sum, factor) => sum + factor.weightPercent, 0)).toBeCloseTo(100, 10);
    const climate = score?.components.find((component) => component.code === 'GHG');
    expect(climate?.normalisedValue).toBe(1);
    expect(climate?.weightPercent).toBe(21.06);
    expect(climate?.weightedContribution).toBeCloseTo(0.2106, 12);
    expect(climate?.normalisationFactor).toBe(7_550);
    expect(climate?.normalisationUnit).toBe('kg CO2 eq/person');
  });

  it('matches all JRC EF 3.1 normalisation factors and final weighting percentages', () => {
    const factors = Object.entries(EF31_SINGLE_SCORE_FACTORS).map(([code, factor]) => [
      code,
      factor.normalisationFactor,
      factor.weightPercent,
    ]);
    expect(factors).toEqual([
      ['ACD', 55.6, 6.20],
      ['ETF', 56_700, 1.92],
      ['FRU', 65_000, 8.32],
      ['FWE', 1.61, 2.80],
      ['GHG', 7_550, 21.06],
      ['HTC', 0.0000173, 2.13],
      ['HTN', 0.000129, 1.84],
      ['IOR', 4_220, 5.01],
      ['LDU', 819_000, 7.94],
      ['MRU', 0.0636, 7.55],
      ['OZD', 0.0523, 6.31],
      ['PCO', 40.9, 4.78],
      ['PMA', 0.000595, 8.96],
      ['SWE', 19.5, 2.96],
      ['TRE', 177, 3.71],
      ['WTU', 11_500, 8.51],
    ]);
  });

  it('accepts explicit JRC/source label variants for toxicity and water units', () => {
    const aliases = categories.map((item) => ['HTC', 'HTN'].includes(item.code)
      ? { ...item, result_unit: 'CTUh' }
      : item.code === 'WTU' ? { ...item, result_unit: 'm³ water eq of deprived water' } : item);
    expect(calculateEf31SingleScore(aliases)).not.toBeNull();

    const crossCategory = categories.map((item) => item.code === 'HTC'
      ? { ...item, result_unit: 'CTUhtn' }
      : item);
    expect(calculateEf31SingleScore(crossCategory)).toBeNull();
  });

  it('does not produce a score from an incomplete or unit-incompatible set', () => {
    expect(calculateEf31SingleScore(categories.slice(0, 15))).toBeNull();
    expect(calculateEf31SingleScore(categories.map((item) => item.code === 'GHG'
      ? { ...item, result_unit: 'kg methane' }
      : item))).toBeNull();
  });
});
