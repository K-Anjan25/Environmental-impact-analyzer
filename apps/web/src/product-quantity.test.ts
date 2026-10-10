import { describe, expect, it } from 'vitest';
import type { ProcessFactor } from './api';
import { deriveProcessQuantity, estimateMaterialFlow, unitToKilograms } from './product-quantity';

const factor: ProcessFactor = {
  id: 'spin-cotton',
  family_id: 'spinning',
  family_label: 'Yarn spinning',
  activity: 'Spinning cotton to yarn',
  source_descriptor: 'spin-cotton',
  geography_code: 'WORLD',
  geography_label: 'World',
  reference_unit: '1 kg yarn',
  indicator_factors: [],
  data_quality: null,
  input_required_kg_per_reference_unit: 1.1,
  source_file: 'datasets/spinning/impact-scores.csv',
};

const input = (quantity: string, unit: string) => ({
  id: 'input-1',
  name: 'Cotton fibre',
  quantity,
  unit,
});

describe('declared-input process quantity mapping', () => {
  it('converts compatible mass units into the factor reference unit', () => {
    const result = deriveProcessQuantity(factor, '', input('350', 'g'), 'declared-output');
    expect(result.quantity).toBeCloseTo(0.35, 12);
    expect(result.error).toBeNull();
    expect(result.basisLabel).toBe('Declared input mapped as process output');
  });

  it('converts process-feed mass with the source-reported input requirement', () => {
    expect(deriveProcessQuantity(factor, '', input('550', 'g'), 'declared-input')).toMatchObject({
      quantity: 0.5,
      error: null,
      basisLabel: 'Declared input mapped as source-reported process feed',
    });
  });

  it('accepts an equivalent pair unit but does not cross physical dimensions', () => {
    const pairFactor = { ...factor, reference_unit: '1 pair of footwear' };
    expect(deriveProcessQuantity(pairFactor, '', input('2', 'pairs'), 'declared-output').quantity).toBe(2);
    expect(deriveProcessQuantity(factor, '', input('1', 'pair'), 'declared-output').error)
      .toMatch(/must be convertible/);
  });

  it('rejects mass-feed mapping if the source has no input requirement', () => {
    const noYield = { ...factor, input_required_kg_per_reference_unit: null };
    expect(deriveProcessQuantity(noYield, '', input('1', 'kg'), 'declared-input').error)
      .toMatch(/no positive input-required value/);
  });

  it('keeps manual quantities explicit and validates them', () => {
    expect(deriveProcessQuantity(factor, '0.18', null, 'manual').quantity).toBe(0.18);
    expect(deriveProcessQuantity(factor, '0', null, 'manual').error)
      .toMatch(/greater than zero/);
  });

  it('rejects compound mass-per-unit labels rather than treating them as plain mass', () => {
    expect(unitToKilograms('1', 'kg per pair')).toBeNull();
    expect(unitToKilograms('1', 'kg/pair')).toBeNull();
    expect(deriveProcessQuantity(factor, '', input('1', 'kg per pair'), 'declared-output').error)
      .toMatch(/must be convertible/);
  });
});

describe('source-reported material-flow diagnostics', () => {
  it('estimates gross input and mass difference for a kilogram-output process', () => {
    const estimate = estimateMaterialFlow(factor, 0.18);
    expect(estimate.inputRequiredKg).toBeCloseTo(0.198, 12);
    expect(estimate.outputMassKg).toBeCloseTo(0.18, 12);
    expect(estimate.estimatedLossKg).toBeCloseTo(0.018, 12);
    expect(estimate.note).toBe('Mass difference only. No waste-treatment impact is included.');
  });

  it('does not infer lost mass when the factor output is not a mass unit', () => {
    const pairFactor = { ...factor, reference_unit: '1 pair of footwear' };
    expect(estimateMaterialFlow(pairFactor, 1)).toMatchObject({
      inputRequiredKg: 1.1,
      outputMassKg: null,
      estimatedLossKg: null,
    });
  });
});
