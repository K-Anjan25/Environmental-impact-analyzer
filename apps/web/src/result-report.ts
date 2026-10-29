import type { ProcessEstimateLine } from './api';
import { calculateEf31SingleScore } from './ef31-score';

/**
 * Plain-language result report. Pure functions only: they turn the API lines into
 * the headline numbers, per-process impact shares, and one short sentence.
 */

export interface ProcessImpactRow {
  key: string;
  activity: string;
  familyLabel: string;
  geography: string;
  quantity: number;
  referenceUnit: string;
  ghgValue: number | null;
  ghgUnit: string | null;
  efPoints: number | null;
  /** Share of the selected-row EF 3.1 total, 0–100. Null when no total is available. */
  sharePercent: number | null;
  /** The indicator that adds the most EF points to this process. */
  driver: { code: string; name: string; sharePercent: number } | null;
}

export interface ResultReport {
  processCount: number;
  efPointsTotal: number | null;
  ghgTotal: number | null;
  ghgUnit: string | null;
  processes: ProcessImpactRow[];
  biggestProcess: ProcessImpactRow | null;
  sentence: string;
}

function indicator(line: ProcessEstimateLine, code: string) {
  return line.indicators.find((item) => item.code === code) ?? null;
}

export function buildResultReport(lines: readonly ProcessEstimateLine[]): ResultReport {
  const rawRows = lines.map((line, index) => {
    const ghg = indicator(line, 'GHG');
    const score = calculateEf31SingleScore(line.indicators);
    const topComponent = score
      ? score.components.reduce((best, item) => (item.weightedContribution > best.weightedContribution ? item : best))
      : null;
    return {
      key: `${index}-${line.factor_id}`,
      activity: line.activity,
      familyLabel: line.family_label,
      geography: line.geography_label ?? line.geography_code ?? 'Not given',
      quantity: line.quantity,
      referenceUnit: line.reference_unit,
      ghgValue: ghg && Number.isFinite(ghg.result_value) ? ghg.result_value : null,
      ghgUnit: ghg ? ghg.result_unit : null,
      efPoints: score ? score.value : null,
      componentPoints: score ? score.components : null,
      topComponent,
    };
  });

  const scoredRows = rawRows.filter((row) => row.efPoints !== null);
  const allScored = scoredRows.length === rawRows.length && rawRows.length > 0;
  const efPointsTotal = allScored
    ? rawRows.reduce((sum, row) => sum + (row.efPoints ?? 0), 0)
    : null;

  const ghgRows = rawRows.filter((row) => row.ghgValue !== null);
  const ghgUnits = new Set(ghgRows.map((row) => row.ghgUnit));
  const ghgTotal = ghgRows.length === rawRows.length && ghgUnits.size === 1
    ? ghgRows.reduce((sum, row) => sum + (row.ghgValue ?? 0), 0)
    : null;
  const ghgUnit = ghgTotal !== null ? [...ghgUnits][0] ?? null : null;

  const processes: ProcessImpactRow[] = rawRows.map((row) => {
    const sharePercent = efPointsTotal && row.efPoints !== null && efPointsTotal > 0
      ? (row.efPoints / efPointsTotal) * 100
      : null;
    const driver = row.topComponent && row.efPoints && row.efPoints > 0
      ? {
          code: row.topComponent.code,
          name: row.topComponent.name,
          sharePercent: (row.topComponent.weightedContribution / row.efPoints) * 100,
        }
      : null;
    return {
      key: row.key,
      activity: row.activity,
      familyLabel: row.familyLabel,
      geography: row.geography,
      quantity: row.quantity,
      referenceUnit: row.referenceUnit,
      ghgValue: row.ghgValue,
      ghgUnit: row.ghgUnit,
      efPoints: row.efPoints,
      sharePercent,
      driver,
    };
  });

  const biggestProcess = processes.reduce<ProcessImpactRow | null>((best, row) => {
    if (row.efPoints === null) return best;
    if (!best || (best.efPoints ?? 0) < row.efPoints) return row;
    return best;
  }, null);

  return {
    processCount: rawRows.length,
    efPointsTotal,
    ghgTotal,
    ghgUnit,
    processes,
    biggestProcess,
    sentence: describeReport(rawRows.length, biggestProcess, allScored),
  };
}

function describeReport(count: number, biggest: ProcessImpactRow | null, allScored: boolean): string {
  const rows = count === 1 ? '1 process' : `${count} processes`;
  if (!allScored || !biggest || biggest.sharePercent === null) {
    return `${rows} calculated. The EF 3.1 total needs compatible units for all 16 indicators.`;
  }
  return `${rows} calculated. ${biggest.activity} adds the most impact: ${Math.round(biggest.sharePercent)}% of the total.`;
}

/** Formats a share as a whole percentage for display, with a dash when unavailable. */
export function formatShare(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

/** Short display number: 3 significant figures, scientific notation for very small or very large values. */
export function formatCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs < 0.001 || abs >= 100000) {
    const [mantissa, exponent] = value.toExponential(2).split('e');
    const sign = exponent.startsWith('-') ? '⁻' : '';
    const digits = exponent.replace('-', '').replace('+', '');
    const superscript = [...digits].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
    return `${mantissa} × 10${sign}${superscript}`;
  }
  return Number(value.toPrecision(3)).toLocaleString('en', { maximumFractionDigits: 3 });
}
