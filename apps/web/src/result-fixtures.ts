import type { ProcessEstimateLine } from './api';
import { EF31_SINGLE_SCORE_FACTORS, type Ef31IndicatorCode } from './ef31-score';

/** Test fixture: one process line with all 16 EF 3.1 indicators at the given scale. */
export function fixtureLine(activity: string, scale: number, options: { omit?: string } = {}): ProcessEstimateLine {
  const codes = Object.keys(EF31_SINGLE_SCORE_FACTORS) as Ef31IndicatorCode[];
  return {
    factor_id: `${activity}-id`,
    family_id: 'spinning',
    family_label: 'Yarn spinning',
    activity,
    geography_code: 'WORLD',
    geography_label: 'World average',
    quantity: 1,
    reference_unit: '1 kg yarn',
    input_required_kg_per_reference_unit: 1.1,
    data_quality: null,
    source_file: 'spinning.csv',
    indicators: codes
      .filter((code) => code !== options.omit)
      .map((code) => ({
        code,
        name: `${code} name`,
        factor_value: 1,
        factor_unit: EF31_SINGLE_SCORE_FACTORS[code].compatibleResultUnits[0],
        result_value: scale,
        result_unit: EF31_SINGLE_SCORE_FACTORS[code].compatibleResultUnits[0],
      })),
  };
}
