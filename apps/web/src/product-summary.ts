import type { ProcessEstimateLine } from './api';
import { calculateEf31SingleScore, EF31_SINGLE_SCORE_FACTORS, type Ef31SingleScore } from './ef31-score';

export interface ProductIndicatorTotal {
  code: string;
  name: string;
  unit: string;
  value: number | null;
  compatible: boolean;
  normalisationFactor: number | null;
  normalisationUnit: string | null;
  normalisedValue: number | null;
  weightPercent: number | null;
  weightedContribution: number | null;
}

export interface SelectedProcessSummary {
  processCount: number;
  indicators: ProductIndicatorTotal[];
  singleScore: Ef31SingleScore | null;
  errors: string[];
}

export function summarizeSelectedProcesses(lines: readonly ProcessEstimateLine[]): SelectedProcessSummary {
  const totals = new Map<string, { name: string; unit: string; value: number | null; compatible: boolean }>();
  const errors: string[] = [];

  for (const line of lines) {
    const seenInLine = new Set<string>();
    for (const indicator of line.indicators) {
      if (seenInLine.has(indicator.code)) {
        errors.push(`Process ${line.activity} contains a duplicate ${indicator.code} indicator.`);
        const duplicate = totals.get(indicator.code);
        if (duplicate) {
          duplicate.compatible = false;
          duplicate.value = null;
        }
        continue;
      }
      seenInLine.add(indicator.code);
      const current = totals.get(indicator.code);
      if (!current) {
        totals.set(indicator.code, {
          name: indicator.name,
          unit: indicator.result_unit,
          value: Number.isFinite(indicator.result_value) ? indicator.result_value : null,
          compatible: Number.isFinite(indicator.result_value),
        });
        if (!Number.isFinite(indicator.result_value)) {
          errors.push(`${indicator.code} cannot be summed because a selected row has a non-finite result.`);
        }
        continue;
      }
      if (current.unit !== indicator.result_unit) {
        current.compatible = false;
        current.value = null;
        errors.push(`${indicator.code} cannot be summed because selected rows use different units.`);
      } else if (!Number.isFinite(indicator.result_value)) {
        current.compatible = false;
        current.value = null;
        errors.push(`${indicator.code} cannot be summed because a selected row has a non-finite result.`);
      } else if (current.compatible && current.value !== null) {
        current.value += indicator.result_value;
      }
    }
  }

  const expectedCodes = Object.keys(EF31_SINGLE_SCORE_FACTORS);
  const missingCodes = expectedCodes.filter((code) => !totals.has(code));
  for (const code of missingCodes) errors.push(`The selected rows do not contain the ${code} indicator.`);
  for (const code of totals.keys()) {
    if (!(code in EF31_SINGLE_SCORE_FACTORS)) errors.push(`${code} is not an EF 3.1 single-score category.`);
  }

  const scoreInput = [...totals.entries()]
    .filter(([, total]) => total.compatible && total.value !== null)
    .map(([code, total]) => ({
      code,
      name: total.name,
      result_value: total.value as number,
      result_unit: total.unit,
    }));
  const singleScore = missingCodes.length === 0 && errors.length === 0
    ? calculateEf31SingleScore(scoreInput)
    : null;

  if (!singleScore && lines.length > 0 && errors.length === 0) {
    errors.push('The EF 3.1 single score requires all 16 indicators with compatible EF 3.1 units.');
  }

  const scoreByCode = new Map<string, Ef31SingleScore['components'][number]>(
    singleScore?.components.map((component) => [component.code, component]) ?? [],
  );
  const indicators = [...totals.entries()].map(([code, total]) => {
    const scoreComponent = scoreByCode.get(code);
    return {
      code,
      name: total.name,
      unit: total.unit,
      value: total.compatible ? total.value : null,
      compatible: total.compatible,
      normalisationFactor: scoreComponent?.normalisationFactor ?? null,
      normalisationUnit: scoreComponent?.normalisationUnit ?? null,
      normalisedValue: scoreComponent?.normalisedValue ?? null,
      weightPercent: scoreComponent?.weightPercent ?? null,
      weightedContribution: scoreComponent?.weightedContribution ?? null,
    };
  });

  return { processCount: lines.length, indicators, singleScore, errors: [...new Set(errors)] };
}
