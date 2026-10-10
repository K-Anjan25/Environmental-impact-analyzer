import type { IndicatorCalculation } from './api';

export const EF31_NORMALISATION_SOURCE =
  'https://eplca.jrc.ec.europa.eu/permalink/EF3_1/Normalisation_Weighting_Factors_EF_3.1.xlsx';
export const EF31_WEIGHTING_SOURCE =
  'https://eplca.jrc.ec.europa.eu/permalink/2018_JRC_Weighting_EF.pdf';
export const EF31_SINGLE_SCORE_SOURCE = EF31_NORMALISATION_SOURCE;

interface Ef31CategoryFactors {
  normalisationFactor: number;
  normalisationUnit: string;
  weightPercent: number;
  expectedUnit: string;
  compatibleResultUnits: readonly string[];
}

function categoryFactors(
  normalisationFactor: number,
  normalisationUnit: string,
  weightPercent: number,
  expectedUnit: string,
  compatibleResultUnits: readonly string[] = [expectedUnit],
): Ef31CategoryFactors {
  return { normalisationFactor, normalisationUnit, weightPercent, expectedUnit, compatibleResultUnits };
}

/**
 * EF 3.1 global normalisation factors (per person) transcribed from the JRC
 * EF 3.1 workbook, and final weighting factors including robustness, scaled to
 * 100%, from the JRC EF weighting report. Normalisation factors are reported to
 * three significant figures. The explicit result-unit aliases below cover the
 * source's toxicity and water-use labels.
 */
export const EF31_SINGLE_SCORE_FACTORS = {
  ACD: categoryFactors(55.6, 'mol H+ eq/person', 6.20, 'mol H⁺ eq'),
  ETF: categoryFactors(56_700, 'CTUe/person', 1.92, 'CTUe'),
  FRU: categoryFactors(65_000, 'MJ/person', 8.32, 'MJ'),
  FWE: categoryFactors(1.61, 'kg P eq/person', 2.80, 'kg P eq'),
  GHG: categoryFactors(7_550, 'kg CO2 eq/person', 21.06, 'kg CO₂ eq'),
  HTC: categoryFactors(0.0000173, 'CTUh/person', 2.13, 'CTUhtc', ['CTUhtc', 'CTUh']),
  HTN: categoryFactors(0.000129, 'CTUh/person', 1.84, 'CTUhtn', ['CTUhtn', 'CTUh']),
  IOR: categoryFactors(4_220, 'kBq U-235 eq/person', 5.01, 'kBq U-235 eq'),
  LDU: categoryFactors(819_000, 'Pt/person', 7.94, 'Pt'),
  MRU: categoryFactors(0.0636, 'kg Sb eq/person', 7.55, 'kg Sb eq'),
  OZD: categoryFactors(0.0523, 'kg CFC-11 eq/person', 6.31, 'kg CFC-11 eq'),
  PCO: categoryFactors(40.9, 'kg NMVOC eq/person', 4.78, 'kg NMVOC eq'),
  PMA: categoryFactors(0.000595, 'disease incidences/person', 8.96, 'disease incidence'),
  SWE: categoryFactors(19.5, 'kg N eq/person', 2.96, 'kg N eq'),
  TRE: categoryFactors(177, 'mol N eq/person', 3.71, 'mol N eq'),
  WTU: categoryFactors(
    11_500,
    'm3 water eq of deprived water/person',
    8.51,
    'm³ world-eq',
    ['m³ world-eq', 'm³ water eq of deprived water'],
  ),
} as const satisfies Record<string, Ef31CategoryFactors>;

export type Ef31IndicatorCode = keyof typeof EF31_SINGLE_SCORE_FACTORS;

function unitSignature(unit: string): string {
  return unit
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export interface Ef31ScoreComponent {
  code: Ef31IndicatorCode;
  name: string;
  resultValue: number;
  resultUnit: string;
  normalisationFactor: number;
  normalisationUnit: string;
  normalisedValue: number;
  weightPercent: number;
  weightedContribution: number;
}

export interface Ef31SingleScore {
  value: number;
  unit: 'EF 3.1 points';
  components: Ef31ScoreComponent[];
  sourceUrl: string;
  normalisationSourceUrl: string;
  weightingSourceUrl: string;
}

export function calculateEf31SingleScore(
  indicators: readonly Pick<IndicatorCalculation, 'code' | 'name' | 'result_value' | 'result_unit'>[],
): Ef31SingleScore | null {
  const byCode = new Map<string, (typeof indicators)[number]>();
  for (const indicator of indicators) {
    if (byCode.has(indicator.code)) return null;
    byCode.set(indicator.code, indicator);
  }

  const expectedCodes = Object.keys(EF31_SINGLE_SCORE_FACTORS) as Ef31IndicatorCode[];
  if (byCode.size !== expectedCodes.length || expectedCodes.some((code) => !byCode.has(code))) {
    return null;
  }

  const components: Ef31ScoreComponent[] = [];
  for (const code of expectedCodes) {
    const indicator = byCode.get(code);
    const factor = EF31_SINGLE_SCORE_FACTORS[code];
    const acceptedUnits = factor.compatibleResultUnits.map(unitSignature);
    if (
      !indicator
      || !Number.isFinite(indicator.result_value)
      || !factor.normalisationFactor
      || !acceptedUnits.includes(unitSignature(indicator.result_unit))
    ) {
      return null;
    }
    const normalisedValue = indicator.result_value / factor.normalisationFactor;
    const weightedContribution = normalisedValue * factor.weightPercent / 100;
    if (!Number.isFinite(normalisedValue) || !Number.isFinite(weightedContribution)) return null;
    components.push({
      code,
      name: indicator.name,
      resultValue: indicator.result_value,
      resultUnit: indicator.result_unit,
      normalisationFactor: factor.normalisationFactor,
      normalisationUnit: factor.normalisationUnit,
      normalisedValue,
      weightPercent: factor.weightPercent,
      weightedContribution,
    });
  }

  return {
    value: components.reduce((sum, component) => sum + component.weightedContribution, 0),
    unit: 'EF 3.1 points',
    components,
    sourceUrl: EF31_SINGLE_SCORE_SOURCE,
    normalisationSourceUrl: EF31_NORMALISATION_SOURCE,
    weightingSourceUrl: EF31_WEIGHTING_SOURCE,
  };
}
