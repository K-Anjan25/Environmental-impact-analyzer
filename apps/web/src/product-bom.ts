import { unitToKilograms, type ProcessQuantityBasis } from './product-quantity';

export interface ProductBomInput {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface ProductInputProcessLink {
  productInputId: string | null;
  quantityBasis: ProcessQuantityBasis;
}

export type BomMassStatus =
  | 'scope-not-confirmed'
  | 'missing-product-mass'
  | 'invalid-product-mass'
  | 'no-declared-inputs'
  | 'incomplete-input-units'
  | 'balanced'
  | 'inputs-below-product-mass'
  | 'inputs-above-product-mass';

export interface BomMassAssessment {
  status: BomMassStatus;
  finishedProductMassKg: number | null;
  declaredInputMassKg: number | null;
  differenceKg: number | null;
  massCoveragePercent: number | null;
  unconvertibleInputNames: string[];
}

export type ProductInputCalculationStatus = 'calculated-locally' | 'context-only' | 'not-in-selected-rows';

export interface ProductInputUseRecord {
  inputId: string;
  name: string;
  quantity: string;
  unit: string;
  status: ProductInputCalculationStatus;
  localProcessCount: number;
  contextProcessCount: number;
}

export interface ProductInputUseReview {
  inputs: ProductInputUseRecord[];
  locallyCalculatedCount: number;
  contextOnlyCount: number;
  notInSelectedRowsCount: number;
  repeatedLocalMappings: string[];
}

export function assessFlatBomMass(
  inputs: readonly ProductBomInput[],
  finishedProductMass: string,
  allInputsConfirmedAsComponents: boolean,
): BomMassAssessment {
  const parsedFinishedMass = finishedProductMass.trim() === '' ? null : Number(finishedProductMass);
  const finishedProductMassKg = parsedFinishedMass !== null
    && Number.isFinite(parsedFinishedMass)
    && parsedFinishedMass > 0
    ? parsedFinishedMass
    : null;
  const base: BomMassAssessment = {
    status: finishedProductMass.trim() === '' ? 'missing-product-mass' : 'invalid-product-mass',
    finishedProductMassKg,
    declaredInputMassKg: null,
    differenceKg: null,
    massCoveragePercent: null,
    unconvertibleInputNames: [],
  };

  if (finishedProductMassKg === null) return base;
  if (!allInputsConfirmedAsComponents) return { ...base, status: 'scope-not-confirmed' };
  if (inputs.length === 0) return { ...base, status: 'no-declared-inputs' };

  let declaredInputMassKg = 0;
  const unconvertibleInputNames: string[] = [];
  for (const input of inputs) {
    const massKg = unitToKilograms(input.quantity, input.unit);
    if (massKg === null) {
      unconvertibleInputNames.push(input.name);
    } else {
      declaredInputMassKg += massKg;
    }
  }

  if (unconvertibleInputNames.length > 0) {
    return {
      ...base,
      status: 'incomplete-input-units',
      declaredInputMassKg,
      unconvertibleInputNames,
    };
  }

  const differenceKg = finishedProductMassKg - declaredInputMassKg;
  const arithmeticTolerance = Number.EPSILON * Math.max(1, finishedProductMassKg, declaredInputMassKg) * 32;
  const status = Math.abs(differenceKg) <= arithmeticTolerance
    ? 'balanced'
    : differenceKg > 0 ? 'inputs-below-product-mass' : 'inputs-above-product-mass';
  return {
    ...base,
    status,
    declaredInputMassKg,
    differenceKg,
    massCoveragePercent: (declaredInputMassKg / finishedProductMassKg) * 100,
  };
}

export function reviewProductInputUse(
  inputs: readonly ProductBomInput[],
  processLinks: readonly ProductInputProcessLink[],
): ProductInputUseReview {
  const countsByInputId = new Map<string, { localProcessCount: number; contextProcessCount: number }>();
  for (const link of processLinks) {
    if (!link.productInputId) continue;
    const counts = countsByInputId.get(link.productInputId) ?? { localProcessCount: 0, contextProcessCount: 0 };
    if (link.quantityBasis === 'manual') counts.contextProcessCount += 1;
    else counts.localProcessCount += 1;
    countsByInputId.set(link.productInputId, counts);
  }

  const records = inputs.map((input): ProductInputUseRecord => {
    const counts = countsByInputId.get(input.id) ?? { localProcessCount: 0, contextProcessCount: 0 };
    const status: ProductInputCalculationStatus = counts.localProcessCount > 0
      ? 'calculated-locally'
      : counts.contextProcessCount > 0 ? 'context-only' : 'not-in-selected-rows';
    return {
      inputId: input.id,
      name: input.name,
      quantity: input.quantity,
      unit: input.unit,
      status,
      ...counts,
    };
  });
  const locallyCalculatedCount = records.filter((input) => input.status === 'calculated-locally').length;
  const contextOnlyCount = records.filter((input) => input.status === 'context-only').length;
  const notInSelectedRowsCount = records.filter((input) => input.status === 'not-in-selected-rows').length;
  const repeatedLocalMappings = records
    .filter((input) => input.localProcessCount > 1)
    .map((input) => input.name);

  return {
    inputs: records,
    locallyCalculatedCount,
    contextOnlyCount,
    notInSelectedRowsCount,
    repeatedLocalMappings,
  };
}

export function describeBomMassStatus(assessment: BomMassAssessment): string {
  switch (assessment.status) {
    case 'scope-not-confirmed':
      return 'Confirm that every declared line is a product component for one functional unit.';
    case 'missing-product-mass':
      return 'Finished-product mass not set.';
    case 'invalid-product-mass':
      return 'Enter a finite finished-product mass greater than zero.';
    case 'no-declared-inputs':
      return 'No declared input lines are available for the mass check.';
    case 'incomplete-input-units':
      return `${assessment.unconvertibleInputNames.length} input line(s) cannot be converted to mass; full BOM mass closure is unavailable.`;
    case 'balanced':
      return 'Declared input mass matches finished-product mass within calculator precision.';
    case 'inputs-below-product-mass':
      return 'Declared input mass is below finished-product mass; the difference is unassigned.';
    case 'inputs-above-product-mass':
      return 'Declared input mass exceeds finished-product mass; review units, overlap, and BOM scope.';
  }
}
