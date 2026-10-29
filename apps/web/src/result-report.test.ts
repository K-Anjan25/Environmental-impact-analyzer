import { describe, expect, it } from 'vitest';
import { buildResultReport, formatShare } from './result-report';
import { fixtureLine } from './result-fixtures';

describe('buildResultReport', () => {
  it('gives each process an EF 3.1 share and the total of all rows', () => {
    const report = buildResultReport([fixtureLine('Dyeing', 3), fixtureLine('Spinning', 1)]);
    const [dyeing, spinning] = report.processes;

    expect(report.processCount).toBe(2);
    expect(report.efPointsTotal).not.toBeNull();
    expect((dyeing.sharePercent ?? 0) + (spinning.sharePercent ?? 0)).toBeCloseTo(100, 6);
    expect(dyeing.sharePercent).toBeCloseTo(75, 6);
    expect(report.biggestProcess?.activity).toBe('Dyeing');
    expect(report.sentence).toBe('2 processes calculated. Dyeing adds the most impact: 75% of the total.');
  });

  it('names the largest indicator driver for each process', () => {
    const report = buildResultReport([fixtureLine('Spinning', 1)]);
    expect(report.processes[0].driver).not.toBeNull();
    expect(report.processes[0].driver?.sharePercent).toBeGreaterThan(0);
  });

  it('reports the GHG total in its unit when the rows agree', () => {
    const report = buildResultReport([fixtureLine('A', 2), fixtureLine('B', 3)]);
    expect(report.ghgTotal).toBeCloseTo(5, 6);
    expect(report.ghgUnit).toBe('kg CO₂ eq');
  });

  it('withholds the EF total and shares when one indicator is missing', () => {
    const report = buildResultReport([fixtureLine('A', 1, { omit: 'WTU' }), fixtureLine('B', 1)]);
    expect(report.efPointsTotal).toBeNull();
    expect(report.processes.every((row) => row.sharePercent === null)).toBe(true);
    expect(report.sentence).toContain('needs compatible units');
  });
});

describe('formatShare', () => {
  it('rounds to whole percentages and shows a dash when unavailable', () => {
    expect(formatShare(41.6)).toBe('42%');
    expect(formatShare(null)).toBe('—');
  });
});
