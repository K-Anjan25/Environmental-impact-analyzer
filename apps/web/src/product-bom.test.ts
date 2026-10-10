import { describe, expect, it } from 'vitest';
import { assessFlatBomMass, describeBomMassStatus, reviewProductInputUse } from './product-bom';

describe('browser-local product-input validation', () => {
  it('does not assume a finished product mass or empty BOM is zero', () => {
    const input = { id: 'cotton', name: 'Cotton yarn', quantity: '350', unit: 'g' };
    expect(assessFlatBomMass([input], '0.35', false).status).toBe('scope-not-confirmed');
    expect(assessFlatBomMass([input], '', true).status).toBe('missing-product-mass');
    expect(assessFlatBomMass([], '0.35', true).status).toBe('no-declared-inputs');
    expect(assessFlatBomMass([input], '-1', true).status).toBe('invalid-product-mass');
  });

  it('converts supported mass units and detects arithmetic mass closure', () => {
    const inputs = [
      { id: 'fabric', name: 'Fabric', quantity: '250', unit: 'g' },
      { id: 'rubber', name: 'Rubber', quantity: '0.1', unit: 'kg' },
    ];
    const result = assessFlatBomMass(inputs, '0.35', true);
    expect(result.status).toBe('balanced');
    expect(result.declaredInputMassKg).toBeCloseTo(0.35, 12);
    expect(result.differenceKg).toBeCloseTo(0, 12);
    expect(result.massCoveragePercent).toBeCloseTo(100, 12);
  });

  it('reports an unassigned difference and an input mass above output without adding impacts', () => {
    const input = { id: 'fabric', name: 'Fabric', quantity: '0.32', unit: 'kg' };
    const under = assessFlatBomMass([input], '0.35', true);
    expect(under.status).toBe('inputs-below-product-mass');
    expect(under.differenceKg).toBeCloseTo(0.03, 12);
    expect(under.massCoveragePercent).toBeCloseTo((0.32 / 0.35) * 100, 12);
    expect(describeBomMassStatus(under)).toContain('unassigned');

    const over = assessFlatBomMass([{ ...input, quantity: '0.4' }], '0.35', true);
    expect(over.status).toBe('inputs-above-product-mass');
    expect(over.differenceKg).toBeCloseTo(-0.05, 12);
    expect(describeBomMassStatus(over)).toContain('overlap');
  });

  it('keeps non-mass input lines visible and withholds a full BOM mass closure', () => {
    const result = assessFlatBomMass([
      { id: 'fabric', name: 'Fabric', quantity: '0.32', unit: 'kg' },
      { id: 'buttons', name: 'Buttons', quantity: '4', unit: 'pieces' },
    ], '0.35', true);
    expect(result.status).toBe('incomplete-input-units');
    expect(result.declaredInputMassKg).toBeCloseTo(0.32, 12);
    expect(result.differenceKg).toBeNull();
    expect(result.massCoveragePercent).toBeNull();
    expect(result.unconvertibleInputNames).toEqual(['Buttons']);
    expect(describeBomMassStatus(result)).toContain('1 input line');
  });

  it('distinguishes local mappings, context-only associations, unlinked inputs, and repeated mappings', () => {
    const inputs = [
      { id: 'yarn', name: 'Yarn', quantity: '0.4', unit: 'kg' },
      { id: 'rubber', name: 'Rubber', quantity: '0.1', unit: 'kg' },
      { id: 'zipper', name: 'Zipper', quantity: '1', unit: 'piece' },
    ];
    const review = reviewProductInputUse(inputs, [
      { productInputId: 'yarn', quantityBasis: 'declared-output' },
      { productInputId: 'yarn', quantityBasis: 'declared-input' },
      { productInputId: 'rubber', quantityBasis: 'manual' },
      { productInputId: null, quantityBasis: 'manual' },
    ]);
    expect(review.locallyCalculatedCount).toBe(1);
    expect(review.contextOnlyCount).toBe(1);
    expect(review.notInSelectedRowsCount).toBe(1);
    expect(review.repeatedLocalMappings).toEqual(['Yarn']);
    expect(review.inputs.map(({ status }) => status)).toEqual([
      'calculated-locally',
      'context-only',
      'not-in-selected-rows',
    ]);
  });
});
