import { describe, expect, it } from 'vitest';
import { assessGhgSupplement, DEFRA_2026_SOURCE, END_OF_LIFE_FACTORS, FREIGHT_FACTORS } from './ghg-supplement';

describe('DEFRA 2026 GHG supplement', () => {
  it('records the source, licence, and retrieval date', () => {
    expect(DEFRA_2026_SOURCE.licence).toBe('Open Government Licence v3.0');
    expect(DEFRA_2026_SOURCE.retrieved).toBe('2026-10-22');
    expect(DEFRA_2026_SOURCE.scope).toContain('not one of the 16 EF 3.1 indicators');
  });

  it('computes freight as mass in tonnes × km × kg CO2e per t-km', () => {
    const result = assessGhgSupplement({
      declaredComponentMassKg: 600,
      finishedProductMassKg: 600,
      declarations: { inbound: { mode: 'container-ship', distanceKm: '10000' } },
    });
    const expected = 0.6 * 10000 * FREIGHT_FACTORS['container-ship'].kgCo2ePerTonneKm;
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].stage).toBe('A2');
    expect(result.lines[0].kgCo2e).toBeCloseTo(expected, 9);
    expect(result.totalKgCo2e).toBeCloseTo(expected, 9);
  });

  it('uses the finished product mass for distribution and waste transport, and the component mass for inbound', () => {
    const result = assessGhgSupplement({
      declaredComponentMassKg: 500,
      finishedProductMassKg: 1000,
      declarations: {
        distribution: { mode: 'hgv-articulated', distanceKm: '100' },
        toWasteKm: '50',
      },
    });
    expect(result.lines.find((line) => line.stage === 'A4')?.kgCo2e).toBeCloseTo(1 * 100 * FREIGHT_FACTORS['hgv-articulated'].kgCo2ePerTonneKm, 9);
    expect(result.lines.find((line) => line.stage === 'C2')?.kgCo2e).toBeCloseTo(1 * 50 * FREIGHT_FACTORS['hgv-articulated'].kgCo2ePerTonneKm, 9);
  });

  it('computes end-of-life per tonne of finished product, keeping the transport-only basis labelled', () => {
    const result = assessGhgSupplement({
      declaredComponentMassKg: 0.6,
      finishedProductMassKg: 0.6,
      declarations: { endOfLife: 'landfill-mixed-ci' },
    });
    expect(result.lines[0].stage).toBe('C3');
    expect(result.lines[0].kgCo2e).toBeCloseTo(0.0006 * END_OF_LIFE_FACTORS['landfill-mixed-ci'].kgCo2ePerTonne, 9);
    expect(result.lines[0].detail).toContain('gate-to-grave');
  });

  it('reports invalid distances and missing mass instead of computing a value', () => {
    const invalid = assessGhgSupplement({
      declaredComponentMassKg: 1,
      finishedProductMassKg: 1,
      declarations: { inbound: { mode: 'freight-rail', distanceKm: 'abc' } },
    });
    expect(invalid.lines).toEqual([]);
    expect(invalid.issues[0]).toContain('A2');

    const noMass = assessGhgSupplement({
      declaredComponentMassKg: null,
      finishedProductMassKg: null,
      declarations: { inbound: { mode: 'freight-rail', distanceKm: '100' } },
    });
    expect(noMass.totalKgCo2e).toBeNull();
    expect(noMass.issues[0]).toContain('mass check balances');
  });

  it('returns no total when nothing is declared', () => {
    const result = assessGhgSupplement({ declaredComponentMassKg: 1, finishedProductMassKg: 1, declarations: {} });
    expect(result.totalKgCo2e).toBeNull();
    expect(result.declaredStages).toEqual([]);
  });
});
