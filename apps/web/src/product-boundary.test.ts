import { describe, expect, it } from 'vitest';
import {
  assessProductBoundary,
  leafInputs,
  validateFunctionalUnit,
  type ProcessLinkForBoundary,
  type ProductBoundaryInput,
} from './product-boundary';
import type { ProductBomInput } from './product-bom';

const footwearUnit = { category: 'footwear' as const, basis: 'pair' as const, description: 'One pair of sneakers' };
const apparelUnit = { category: 'apparel' as const, basis: 'piece' as const, description: 'One knitted t-shirt' };

const sneakerBom: ProductBomInput[] = [
  { id: 'upper', name: 'Upper', quantity: '0.2', unit: 'kg' },
  { id: 'sole', name: 'Sole', quantity: '0.3', unit: 'kg' },
  { id: 'lining', name: 'Lining', quantity: '0.1', unit: 'kg' },
];

function input(overrides: Partial<ProductBoundaryInput>): ProductBoundaryInput {
  return {
    functionalUnit: footwearUnit,
    inputs: sneakerBom,
    parentIdByInput: new Map(),
    processLinks: [],
    finishedProductMass: '0.6',
    scopeConfirmed: true,
    ...overrides,
  };
}

const link = (productInputId: string, familyId: string, factorId = `${familyId}-1`): ProcessLinkForBoundary => ({
  productInputId,
  quantityBasis: 'reference',
  factorId,
  familyId,
});

describe('functional unit', () => {
  it('requires a description and the basis that matches the product category', () => {
    expect(validateFunctionalUnit({ ...footwearUnit, description: '  ' }).map((issue) => issue.code)).toContain('functional-unit-undefined');
    expect(validateFunctionalUnit({ ...footwearUnit, basis: 'piece' }).map((issue) => issue.code)).toContain('functional-unit-basis');
    expect(validateFunctionalUnit(footwearUnit)).toEqual([]);
    expect(validateFunctionalUnit(apparelUnit)).toEqual([]);
  });
});

describe('component hierarchy and identity', () => {
  it('counts only leaf components toward the mass closure', () => {
    const parents = new Map<string, string | null>([['upper', 'assembly'], ['sole', 'assembly'], ['lining', 'assembly']]);
    const bom: ProductBomInput[] = [
      { id: 'assembly', name: 'Shoe body', quantity: '0.6', unit: 'kg' },
      ...sneakerBom,
    ];
    const result = assessProductBoundary(input({ inputs: bom, parentIdByInput: parents, finishedProductMass: '0.6' }));
    expect(result.leafInputIds.sort()).toEqual(['lining', 'sole', 'upper']);
    expect(result.massAssessment.status).toBe('balanced');
    expect(result.structureIssues.some((issue) => issue.code === 'hierarchy-mass-mismatch')).toBe(false);
  });

  it('flags a sub-assembly whose declared mass does not equal its components', () => {
    const parents = new Map<string, string | null>([['upper', 'assembly'], ['sole', 'assembly'], ['lining', 'assembly']]);
    const bom: ProductBomInput[] = [{ id: 'assembly', name: 'Shoe body', quantity: '1', unit: 'kg' }, ...sneakerBom];
    const result = assessProductBoundary(input({ inputs: bom, parentIdByInput: parents }));
    expect(result.structureIssues.map((issue) => issue.code)).toContain('hierarchy-mass-mismatch');
    expect(result.verdict).toBe('blocked');
  });

  it('detects duplicate sibling names, orphan parents, and loops', () => {
    const duplicate: ProductBomInput[] = [
      { id: 'a', name: 'Foam', quantity: '0.1', unit: 'kg' },
      { id: 'b', name: ' foam ', quantity: '0.1', unit: 'kg' },
    ];
    expect(assessProductBoundary(input({ inputs: duplicate, finishedProductMass: '0.2' })).structureIssues.map((i) => i.code)).toContain('duplicate-identity');

    const orphan = assessProductBoundary(input({ parentIdByInput: new Map([['upper', 'missing']]) }));
    expect(orphan.structureIssues.map((i) => i.code)).toContain('orphan-parent');

    const loop = assessProductBoundary(input({ parentIdByInput: new Map([['upper', 'sole'], ['sole', 'upper']]) }));
    expect(loop.structureIssues.map((i) => i.code)).toContain('parent-cycle');
  });

  it('blocks double counting when a parent with components is also linked to a process', () => {
    const parents = new Map<string, string | null>([['upper', 'assembly'], ['sole', 'assembly'], ['lining', 'assembly']]);
    const bom: ProductBomInput[] = [{ id: 'assembly', name: 'Shoe body', quantity: '0.6', unit: 'kg' }, ...sneakerBom];
    const result = assessProductBoundary(input({
      inputs: bom,
      parentIdByInput: parents,
      processLinks: [link('assembly', 'shoe-assembly-sneaker')],
    }));
    expect(result.structureIssues.map((i) => i.code)).toContain('double-count-risk');
  });

  it('flags the same component linked twice to the same factor', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('upper', 'synthetic-pu-leather', 'pu-1'), link('upper', 'synthetic-pu-leather', 'pu-1')],
    }));
    expect(result.structureIssues.map((i) => i.code)).toContain('overlapping-process-link');
  });

  it('returns leaves in declaration order', () => {
    const parents = new Map<string, string | null>([['upper', 'assembly']]);
    expect(leafInputs([{ id: 'assembly', name: 'A', quantity: '1', unit: 'kg' }, ...sneakerBom], parents).map((i) => i.id)).toEqual(['upper', 'sole', 'lining']);
  });
});

describe('stage coverage and verdict', () => {
  it('never reports a complete product: the best verdict is a partial boundary', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('upper', 'synthetic-pu-leather'), link('sole', 'shoe-assembly-sneaker')],
    }));
    expect(result.verdict).toBe('partial-boundary');
    expect(result.verdictText).toContain('not a complete product footprint');
    expect(result.verdictText).not.toMatch(/\bcomplete\b(?! product footprint)/i);
    const excluded = result.stageCoverage.filter((item) => !item.inBoundary).map((item) => item.stage);
    expect(excluded).toEqual(['B', 'C1']);
  });

  it('marks undeclared transport and end-of-life stages as not declared, not missing', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('upper', 'synthetic-pu-leather'), link('sole', 'shoe-assembly-sneaker')],
    }));
    const statuses = Object.fromEntries(result.stageCoverage.map((item) => [item.stage, item.status]));
    expect(statuses).toMatchObject({ A1: 'covered', A3: 'covered', A2: 'not-declared', A4: 'not-declared', C2: 'not-declared', C3: 'not-declared', C4: 'not-declared', B: 'excluded', C1: 'excluded' });
    expect(result.missingRequiredStages).toEqual([]);
  });

  it('shows a GHG-only layer for declared transport and end-of-life without touching the EF stages', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('upper', 'synthetic-pu-leather'), link('sole', 'shoe-assembly-sneaker')],
      ghg: {
        distribution: { mode: 'hgv-articulated', distanceKm: '500' },
        endOfLife: 'landfill-mixed-ci',
      },
    }));
    const statuses = Object.fromEntries(result.stageCoverage.map((item) => [item.stage, item.status]));
    expect(statuses.A4).toBe('ghg-only');
    expect(statuses.C3).toBe('ghg-only');
    expect(statuses.C4).toBe('ghg-only');
    expect(statuses.A1).toBe('covered');
    expect(result.ghg.lines.map((line) => line.stage)).toEqual(['A4', 'C3']);
    expect(result.verdict).toBe('partial-boundary');
  });

  it('blocks the verdict when a GHG scenario is invalid', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('upper', 'synthetic-pu-leather'), link('sole', 'shoe-assembly-sneaker')],
      ghg: { toWasteKm: '-5' },
    }));
    expect(result.verdict).toBe('blocked');
  });

  it('requires a PU leather or rubber row for footwear raw materials', () => {
    const result = assessProductBoundary(input({
      processLinks: [link('sole', 'shoe-assembly-sneaker')],
    }));
    expect(result.missingRequiredStages).toEqual(['A1']);
    expect(result.verdict).toBe('stages-missing');
  });

  it('cannot cover apparel raw materials from the bundled data', () => {
    const result = assessProductBoundary(input({
      functionalUnit: apparelUnit,
      processLinks: [link('upper', 'textile-assembly'), link('sole', 'synthetic-pu-leather')],
    }));
    const a1 = result.stageCoverage.find((item) => item.stage === 'A1');
    expect(a1?.status).toBe('no-open-factor');
    expect(result.verdict).toBe('stages-missing');
  });

  it('does not count manual context-only links as stage coverage', () => {
    const result = assessProductBoundary(input({
      processLinks: [{ productInputId: 'upper', quantityBasis: 'manual', factorId: 'pu-1', familyId: 'synthetic-pu-leather' }],
    }));
    expect(result.stageCoverage.find((item) => item.stage === 'A1')?.covered).toBe(false);
  });

  it('is blocked while the mass check is not balanced', () => {
    const result = assessProductBoundary(input({ finishedProductMass: '1.0', processLinks: [link('upper', 'synthetic-pu-leather'), link('sole', 'shoe-assembly-sneaker')] }));
    expect(result.verdict).toBe('blocked');
  });
});
