import type { ProcessFactor } from './api';

export type ProcessQuantityBasis = 'manual' | 'declared-output' | 'declared-input';

export interface DeclaredMaterialInput {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface DerivedProcessQuantity {
  quantity: number | null;
  error: string | null;
  basisLabel: string;
}

export interface MaterialFlowEstimate {
  inputRequiredKg: number | null;
  outputMassKg: number | null;
  estimatedLossKg: number | null;
  note: string | null;
}

interface ParsedUnit {
  dimension: string;
  toBase: number;
  label: string;
}

const UNIT_PREFIXES: Array<{ dimension: string; factor: number; pattern: RegExp; label: string }> = [
  { dimension: 'mass', factor: 1, pattern: /^(?:kg|kilograms?)(?:\b|$)/, label: 'kg' },
  { dimension: 'mass', factor: 0.001, pattern: /^(?:g|grams?)(?:\b|$)/, label: 'g' },
  { dimension: 'mass', factor: 0.000001, pattern: /^(?:mg|milligrams?)(?:\b|$)/, label: 'mg' },
  { dimension: 'mass', factor: 1000, pattern: /^(?:t|tonnes?|metric\s+tons?)(?:\b|$)/, label: 't' },
  { dimension: 'mass', factor: 0.45359237, pattern: /^(?:lbs?|pounds?)(?:\b|$)/, label: 'lb' },
  { dimension: 'mass', factor: 0.028349523125, pattern: /^(?:oz|ounces?)(?:\b|$)/, label: 'oz' },
  { dimension: 'area', factor: 1, pattern: /^(?:m2|sqm|square\s+(?:metres?|meters?))(?:\b|$)/, label: 'm2' },
  { dimension: 'area', factor: 0.0001, pattern: /^(?:cm2|square\s+(?:centimetres?|centimeters?))(?:\b|$)/, label: 'cm2' },
  { dimension: 'area', factor: 10_000, pattern: /^(?:ha|hectares?)(?:\b|$)/, label: 'ha' },
  { dimension: 'time', factor: 1, pattern: /^(?:min|minutes?)(?:\b|$)/, label: 'min' },
  { dimension: 'time', factor: 60, pattern: /^(?:s|sec|seconds?)(?:\b|$)/, label: 's' },
  { dimension: 'time', factor: 60, pattern: /^(?:h|hr|hours?)(?:\b|$)/, label: 'h' },
  { dimension: 'pair', factor: 1, pattern: /^(?:pair|pairs)(?:\b|$)/, label: 'pair' },
  { dimension: 'count', factor: 1, pattern: /^(?:item|items|piece|pieces|pc|pcs|unit|units|each)(?:\b|$)/, label: 'item' },
];

function normalizeUnitText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[²]/g, '2')
    .replace(/[³]/g, '3')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseUnit(value: string): ParsedUnit | null {
  const unitText = normalizeUnitText(value);
  if (unitText.includes('/') || /\bper\b/.test(unitText) || /[×*]/.test(unitText)) return null;
  const normalized = unitText.replace(/^\d+(?:\.\d+)?\s*/, '');
  for (const item of UNIT_PREFIXES) {
    if (item.pattern.test(normalized)) {
      return { dimension: item.dimension, toBase: item.factor, label: item.label };
    }
  }
  return null;
}

function parseReferenceUnit(value: string): { amount: number; unit: ParsedUnit } | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s+(.+?)\s*$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = parseUnit(match[2]);
  if (!Number.isFinite(amount) || amount <= 0 || !unit) return null;
  return { amount, unit };
}

function finitePositive(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function deriveProcessQuantity(
  factor: ProcessFactor,
  manualQuantity: string,
  input: DeclaredMaterialInput | null,
  basis: ProcessQuantityBasis,
): DerivedProcessQuantity {
  if (basis === 'manual') {
    const quantity = finitePositive(manualQuantity);
    return quantity === null
      ? { quantity: null, error: 'Enter a finite quantity greater than zero.', basisLabel: 'Manual process quantity' }
      : { quantity, error: null, basisLabel: 'Manual process quantity' };
  }

  if (!input) {
    return {
      quantity: null,
      error: 'Select a declared input before using it to set the process quantity.',
      basisLabel: basis === 'declared-output' ? 'Declared input as process output' : 'Declared input as process feed',
    };
  }
  const inputQuantity = finitePositive(input.quantity);
  if (inputQuantity === null) {
    return { quantity: null, error: 'The linked input needs a finite quantity greater than zero.', basisLabel: 'Declared input mapping' };
  }

  if (basis === 'declared-output') {
    const inputUnit = parseUnit(input.unit);
    const reference = parseReferenceUnit(factor.reference_unit);
    if (!inputUnit || !reference || inputUnit.dimension !== reference.unit.dimension) {
      return {
        quantity: null,
        error: `The input unit must be convertible to the factor reference unit (${factor.reference_unit}).`,
        basisLabel: 'Declared input as process output',
      };
    }
    const quantity = (inputQuantity * inputUnit.toBase) / (reference.amount * reference.unit.toBase);
    return Number.isFinite(quantity) && quantity > 0
      ? { quantity, error: null, basisLabel: 'Declared input mapped as process output' }
      : { quantity: null, error: 'The converted process quantity is not finite and positive.', basisLabel: 'Declared input as process output' };
  }

  const inputUnit = parseUnit(input.unit);
  const requiredKg = factor.input_required_kg_per_reference_unit;
  if (!inputUnit || inputUnit.dimension !== 'mass') {
    return {
      quantity: null,
      error: 'A process-feed mapping requires a supported mass unit (for example, kg or g).',
      basisLabel: 'Declared input as process feed',
    };
  }
  if (requiredKg === null || !Number.isFinite(requiredKg) || requiredKg <= 0) {
    return {
      quantity: null,
      error: 'This source factor has no positive input-required value for process-feed conversion.',
      basisLabel: 'Declared input as process feed',
    };
  }
  const inputMassKg = inputQuantity * inputUnit.toBase;
  const quantity = inputMassKg / requiredKg;
  return Number.isFinite(quantity) && quantity > 0
    ? { quantity, error: null, basisLabel: 'Declared input mapped as source-reported process feed' }
    : { quantity: null, error: 'The converted process quantity is not finite and positive.', basisLabel: 'Declared input as process feed' };
}

export function estimateMaterialFlow(
  factor: Pick<ProcessFactor, 'input_required_kg_per_reference_unit' | 'reference_unit'>,
  quantity: number,
): MaterialFlowEstimate {
  const inputRequired = factor.input_required_kg_per_reference_unit;
  if (inputRequired === null || !Number.isFinite(inputRequired) || inputRequired <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
    return { inputRequiredKg: null, outputMassKg: null, estimatedLossKg: null, note: null };
  }

  const inputRequiredKg = inputRequired * quantity;
  const reference = parseReferenceUnit(factor.reference_unit);
  if (!reference || reference.unit.dimension !== 'mass') {
    return {
      inputRequiredKg,
      outputMassKg: null,
      estimatedLossKg: null,
      note: 'Net output mass is not stated in this factor reference unit, so material loss cannot be derived.',
    };
  }

  const outputMassKg = quantity * reference.amount * reference.unit.toBase;
  if (inputRequiredKg < outputMassKg) {
    return {
      inputRequiredKg,
      outputMassKg,
      estimatedLossKg: null,
      note: 'The source-reported input mass is below the reference-unit output mass; no loss estimate is made.',
    };
  }

  return {
    inputRequiredKg,
    outputMassKg,
    estimatedLossKg: inputRequiredKg - outputMassKg,
    note: 'Mass difference only. No waste-treatment impact is included.',
  };
}

export function unitToKilograms(quantity: string, unit: string): number | null {
  const parsedQuantity = finitePositive(quantity);
  const parsedUnit = parseUnit(unit);
  if (parsedQuantity === null || !parsedUnit || parsedUnit.dimension !== 'mass') return null;
  return parsedQuantity * parsedUnit.toBase;
}
