import { unitToKilograms } from './product-quantity';
import { assessFlatBomMass, type BomMassAssessment, type ProductBomInput } from './product-bom';

/*
 * Product boundary, functional unit, component hierarchy, and stage-coverage rules.
 *
 * The app can only report what the bundled, openly licensed factor rows cover. These rules make
 * that explicit: every declared component must be identifiable and placed in a hierarchy whose
 * masses close; every linked process row is mapped to one life-cycle stage; and a stage subtotal
 * is labelled as partial unless every stage in the declared boundary is covered.
 */

export type ProductCategory = 'footwear' | 'apparel';

export type FunctionalUnitBasis = 'pair' | 'piece';

export interface FunctionalUnitDefinition {
  category: ProductCategory;
  basis: FunctionalUnitBasis;
  description: string;
}

export const FUNCTIONAL_UNIT_BASIS: Record<ProductCategory, FunctionalUnitBasis> = {
  footwear: 'pair',
  apparel: 'piece',
};

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  footwear: 'Footwear',
  apparel: 'Apparel',
};

export type LifeCycleStage = 'A1' | 'A2' | 'A3' | 'A4' | 'B' | 'C1' | 'C2' | 'C3' | 'C4';

export const STAGE_LABEL: Record<LifeCycleStage, string> = {
  A1: 'Raw materials',
  A2: 'Transport to factory',
  A3: 'Manufacturing',
  A4: 'Distribution to customer',
  B: 'Use',
  C1: 'Deconstruction',
  C2: 'Transport to waste treatment',
  C3: 'Waste treatment',
  C4: 'Disposal',
};

/**
 * Process families from the bundled Carbonfact v1.1.0 catalog mapped to the one stage each row
 * describes. Fibre production is not in the bundled rows, so textile families are manufacturing.
 */
export const FAMILY_STAGE: Readonly<Record<string, LifeCycleStage>> = {
  'synthetic-pu-leather': 'A1',
  'natural-rubber': 'A1',
  spinning: 'A3',
  knitting: 'A3',
  weaving: 'A3',
  dyeing: 'A3',
  finishing: 'A3',
  printing: 'A3',
  'textile-assembly': 'A3',
  'shoe-assembly-sneaker': 'A3',
  'shoe-assembly-womens-boots': 'A3',
  'use-phase': 'B',
};

/** Stages with no factor rows in the bundled open data, so they cannot be calculated here. */
export const STAGES_WITHOUT_OPEN_FACTORS: readonly LifeCycleStage[] = ['A2', 'A4', 'C1', 'C2', 'C3', 'C4'];

/**
 * The declared boundary is the cradle-to-gate manufacturing subtotal, A1 + A3. Stages outside it
 * are excluded on purpose, and the report says so; they are never filled in silently.
 */
export const DECLARED_BOUNDARY_STAGES: readonly LifeCycleStage[] = ['A1', 'A3'];
export const EXCLUDED_BOUNDARY_STAGES: readonly LifeCycleStage[] = ['A2', 'A4', 'B', 'C1', 'C2', 'C3', 'C4'];

/** Product-specific coverage rules: which stages must be covered, and by which process families. */
export interface CoverageRule {
  stage: LifeCycleStage;
  acceptedFamilies: readonly string[];
  reason: string;
}

export const CATEGORY_COVERAGE_RULES: Record<ProductCategory, readonly CoverageRule[]> = {
  footwear: [
    {
      stage: 'A1',
      acceptedFamilies: ['synthetic-pu-leather', 'natural-rubber'],
      reason: 'Footwear raw materials must be covered by a PU leather or natural rubber row; textile fibre production is not in the bundled data.',
    },
    {
      stage: 'A3',
      acceptedFamilies: ['shoe-assembly-sneaker', 'shoe-assembly-womens-boots'],
      reason: 'Footwear manufacturing must be covered by a shoe-assembly row for the same product type.',
    },
  ],
  apparel: [
    {
      stage: 'A1',
      acceptedFamilies: [],
      reason: 'Apparel raw materials (fibre production) have no rows in the bundled open data.',
    },
    {
      stage: 'A3',
      acceptedFamilies: ['textile-assembly', 'spinning', 'knitting', 'weaving', 'dyeing', 'finishing', 'printing'],
      reason: 'Apparel manufacturing must be covered by a textile manufacturing or garment assembly row.',
    },
  ],
};

export interface StructureIssue {
  severity: 'error' | 'warning';
  code:
    | 'functional-unit-undefined'
    | 'functional-unit-basis'
    | 'no-leaf-components'
    | 'duplicate-identity'
    | 'orphan-parent'
    | 'parent-cycle'
    | 'hierarchy-mass-mismatch'
    | 'assembly-mass-not-checked'
    | 'double-count-risk'
    | 'overlapping-process-link';
  message: string;
  inputIds: string[];
}

export interface ProcessLinkForBoundary {
  productInputId: string | null;
  quantityBasis: 'manual' | 'reference' | 'mass-feed' | string;
  factorId: string;
  familyId: string;
}

export interface StageCoverageItem {
  stage: LifeCycleStage;
  label: string;
  inBoundary: boolean;
  covered: boolean;
  linkedProcessCount: number;
  status: 'covered' | 'required-missing' | 'excluded' | 'no-open-factor';
  note: string;
}

export type BoundaryVerdict = 'blocked' | 'stages-missing' | 'selected-stages-only';

export interface ProductBoundaryAssessment {
  functionalUnit: FunctionalUnitDefinition;
  functionalUnitIssues: StructureIssue[];
  structureIssues: StructureIssue[];
  leafInputIds: string[];
  stageCoverage: StageCoverageItem[];
  missingRequiredStages: LifeCycleStage[];
  verdict: BoundaryVerdict;
  verdictText: string;
  subtotalLabel: string;
}

const MASS_TOLERANCE_RATIO = 0.005;

export function validateFunctionalUnit(definition: FunctionalUnitDefinition): StructureIssue[] {
  const issues: StructureIssue[] = [];
  if (definition.description.trim() === '') {
    issues.push({
      severity: 'error',
      code: 'functional-unit-undefined',
      message: 'Describe the functional unit, for example "one pair of women\'s boots" or "one knitted t-shirt".',
      inputIds: [],
    });
  }
  if (FUNCTIONAL_UNIT_BASIS[definition.category] !== definition.basis) {
    issues.push({
      severity: 'error',
      code: 'functional-unit-basis',
      message: `${PRODUCT_CATEGORY_LABEL[definition.category]} products use the "${FUNCTIONAL_UNIT_BASIS[definition.category]}" functional unit basis.`,
      inputIds: [],
    });
  }
  return issues;
}

/** Hierarchy, identity, and closure checks on the declared component tree. */
export function validateComponentStructure(
  inputs: readonly ProductBomInput[],
  parentIdByInput: ReadonlyMap<string, string | null>,
  processLinks: readonly ProcessLinkForBoundary[],
): StructureIssue[] {
  const issues: StructureIssue[] = [];
  const byId = new Map(inputs.map((input) => [input.id, input]));
  const childrenOf = new Map<string, string[]>();
  for (const input of inputs) {
    const parentId = parentIdByInput.get(input.id) ?? null;
    if (parentId === null) continue;
    if (!byId.has(parentId)) {
      issues.push({
        severity: 'error',
        code: 'orphan-parent',
        message: `"${input.name}" points to a parent line that no longer exists.`,
        inputIds: [input.id],
      });
      continue;
    }
    childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), input.id]);
  }

  // Cycle detection: walk each parent chain and stop if an id repeats.
  for (const input of inputs) {
    const seen = new Set<string>();
    let cursor: string | null = input.id;
    while (cursor !== null && byId.has(cursor)) {
      if (seen.has(cursor)) {
        issues.push({
          severity: 'error',
          code: 'parent-cycle',
          message: `"${input.name}" is part of a parent loop; a component cannot contain itself.`,
          inputIds: [input.id],
        });
        break;
      }
      seen.add(cursor);
      cursor = parentIdByInput.get(cursor) ?? null;
    }
  }

  // Identity: sibling names must be unique (case-insensitive) so each line is traceable.
  const siblingGroups = new Map<string, ProductBomInput[]>();
  for (const input of inputs) {
    const parentKey = parentIdByInput.get(input.id) ?? '__root__';
    siblingGroups.set(parentKey, [...(siblingGroups.get(parentKey) ?? []), input]);
  }
  for (const group of siblingGroups.values()) {
    const counts = new Map<string, ProductBomInput[]>();
    for (const input of group) {
      const key = input.name.trim().toLowerCase();
      counts.set(key, [...(counts.get(key) ?? []), input]);
    }
    for (const duplicates of counts.values()) {
      if (duplicates.length > 1) {
        issues.push({
          severity: 'error',
          code: 'duplicate-identity',
          message: `"${duplicates[0].name}" is declared ${duplicates.length} times under the same parent. Rename or merge them.`,
          inputIds: duplicates.map((input) => input.id),
        });
      }
    }
  }

  // Closure: each assembly's declared mass must equal the sum of its children (mass units only).
  const linkedInputIds = new Set(processLinks.filter((link) => link.productInputId !== null && link.quantityBasis !== 'manual').map((link) => link.productInputId as string));
  for (const [parentId, childIds] of childrenOf) {
    const parent = byId.get(parentId);
    if (!parent) continue;
    const parentMass = unitToKilograms(parent.quantity, parent.unit);
    if (parentMass === null) {
      issues.push({
        severity: 'warning',
        code: 'assembly-mass-not-checked',
        message: `"${parent.name}" is an assembly with a non-mass unit, so its children cannot be checked against its mass.`,
        inputIds: [parentId],
      });
    } else {
      let childSum = 0;
      let convertible = true;
      for (const childId of childIds) {
        const child = byId.get(childId);
        const childMass = child ? unitToKilograms(child.quantity, child.unit) : null;
        if (childMass === null) {
          convertible = false;
          break;
        }
        childSum += childMass;
      }
      if (convertible && Math.abs(childSum - parentMass) > Math.max(1e-9, parentMass * MASS_TOLERANCE_RATIO)) {
        issues.push({
          severity: 'error',
          code: 'hierarchy-mass-mismatch',
          message: `"${parent.name}" is ${parentMass} kg but its components add up to ${childSum.toFixed(4)} kg. Make them equal.`,
          inputIds: [parentId, ...childIds],
        });
      }
    }
    if (linkedInputIds.has(parentId)) {
      issues.push({
        severity: 'error',
        code: 'double-count-risk',
        message: `"${parent.name}" has components and is also linked to a process row. Link only its components so the mass is not counted twice.`,
        inputIds: [parentId],
      });
    }
  }

  // Non-overlap: the same component linked to the same factor twice would count one burden twice.
  const linkCountByInputAndFactor = new Map<string, number>();
  for (const link of processLinks) {
    if (link.productInputId === null || link.quantityBasis === 'manual') continue;
    const key = `${link.productInputId}|${link.factorId}`;
    linkCountByInputAndFactor.set(key, (linkCountByInputAndFactor.get(key) ?? 0) + 1);
  }
  for (const [key, count] of linkCountByInputAndFactor) {
    if (count > 1) {
      const [inputId] = key.split('|');
      issues.push({
        severity: 'error',
        code: 'overlapping-process-link',
        message: `"${byId.get(inputId)?.name ?? 'A component'}" is linked to the same process row ${count} times. Keep one link.`,
        inputIds: [inputId],
      });
    }
  }

  return issues;
}

export function leafInputs(
  inputs: readonly ProductBomInput[],
  parentIdByInput: ReadonlyMap<string, string | null>,
): ProductBomInput[] {
  const parentIds = new Set<string>();
  for (const input of inputs) {
    const parentId = parentIdByInput.get(input.id);
    if (parentId) parentIds.add(parentId);
  }
  return inputs.filter((input) => !parentIds.has(input.id));
}

export function assessStageCoverage(
  category: ProductCategory,
  processLinks: readonly ProcessLinkForBoundary[],
): { stageCoverage: StageCoverageItem[]; missingRequiredStages: LifeCycleStage[] } {
  const locallyLinked = processLinks.filter((link) => link.productInputId !== null && link.quantityBasis !== 'manual');
  const countByStage = new Map<LifeCycleStage, number>();
  const familiesByStage = new Map<LifeCycleStage, Set<string>>();
  for (const link of locallyLinked) {
    const stage = FAMILY_STAGE[link.familyId];
    if (!stage) continue;
    countByStage.set(stage, (countByStage.get(stage) ?? 0) + 1);
    familiesByStage.set(stage, new Set([...(familiesByStage.get(stage) ?? []), link.familyId]));
  }

  const rules = new Map(CATEGORY_COVERAGE_RULES[category].map((rule) => [rule.stage, rule]));
  const allStages: LifeCycleStage[] = ['A1', 'A2', 'A3', 'A4', 'B', 'C1', 'C2', 'C3', 'C4'];
  const missingRequiredStages: LifeCycleStage[] = [];

  const stageCoverage = allStages.map((stage): StageCoverageItem => {
    const inBoundary = DECLARED_BOUNDARY_STAGES.includes(stage);
    const linkedProcessCount = countByStage.get(stage) ?? 0;
    const rule = rules.get(stage);
    const acceptedFamilies = rule?.acceptedFamilies ?? [];
    // An empty accepted list means the bundled data has no qualifying row, so the stage cannot be covered.
    const acceptedHit = acceptedFamilies.length > 0
      && [...(familiesByStage.get(stage) ?? [])].some((family) => acceptedFamilies.includes(family));

    if (!inBoundary) {
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary,
        covered: linkedProcessCount > 0,
        linkedProcessCount,
        status: 'excluded',
        note: STAGES_WITHOUT_OPEN_FACTORS.includes(stage)
          ? 'Outside the declared boundary. No licensed factor rows for this stage are in the bundled data.'
          : 'Outside the declared boundary (not calculated in this cradle-to-gate subtotal).',
      };
    }
    if (acceptedHit) {
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary,
        covered: true,
        linkedProcessCount,
        status: 'covered',
        note: 'Covered by a locally linked process row.',
      };
    }
    missingRequiredStages.push(stage);
    const noOpen = acceptedFamilies.length === 0;
    return {
      stage,
      label: STAGE_LABEL[stage],
      inBoundary,
      covered: false,
      linkedProcessCount,
      status: noOpen ? 'no-open-factor' : 'required-missing',
      note: rule?.reason ?? 'Required stage is not covered.',
    };
  });

  return { stageCoverage, missingRequiredStages };
}

export interface ProductBoundaryInput {
  functionalUnit: FunctionalUnitDefinition;
  inputs: readonly ProductBomInput[];
  parentIdByInput: ReadonlyMap<string, string | null>;
  processLinks: readonly ProcessLinkForBoundary[];
  finishedProductMass: string;
  scopeConfirmed: boolean;
}

export interface ProductBoundaryResult extends ProductBoundaryAssessment {
  massAssessment: BomMassAssessment;
}

/** Full product-boundary assessment: functional unit, structure, mass closure, and stage coverage. */
export function assessProductBoundary(input: ProductBoundaryInput): ProductBoundaryResult {
  const functionalUnitIssues = validateFunctionalUnit(input.functionalUnit);
  const structureIssues = validateComponentStructure(input.inputs, input.parentIdByInput, input.processLinks);
  const leaves = leafInputs(input.inputs, input.parentIdByInput);
  if (leaves.length === 0) {
    structureIssues.unshift({
      severity: 'error',
      code: 'no-leaf-components',
      message: 'Declare at least one component line that has no sub-components.',
      inputIds: [],
    });
  }
  const massAssessment = assessFlatBomMass(leaves, input.finishedProductMass, input.scopeConfirmed);
  const { stageCoverage, missingRequiredStages } = assessStageCoverage(input.functionalUnit.category, input.processLinks);

  const blockingMass = massAssessment.status !== 'balanced';
  const hasErrors = [...functionalUnitIssues, ...structureIssues].some((issue) => issue.severity === 'error');
  const verdict: BoundaryVerdict = hasErrors || blockingMass
    ? 'blocked'
    : missingRequiredStages.length > 0 ? 'stages-missing' : 'selected-stages-only';

  const verdictText = verdict === 'blocked'
    ? 'Fix the structure and mass issues listed before any stage subtotal is shown.'
    : verdict === 'stages-missing'
      ? `Required stages are not covered: ${missingRequiredStages.map((stage) => `${stage} ${STAGE_LABEL[stage]}`).join('; ')}. The subtotal is not a product total.`
      : 'Declared stages A1 and A3 are covered by linked process rows. Transport (A2), distribution (A4), use (B), and end of life (C) are outside this boundary, so this is a partial cradle-to-gate subtotal, not a complete product footprint.';

  return {
    functionalUnit: input.functionalUnit,
    functionalUnitIssues,
    structureIssues,
    leafInputIds: leaves.map((leaf) => leaf.id),
    stageCoverage,
    missingRequiredStages,
    verdict,
    verdictText,
    subtotalLabel: 'Cradle-to-gate subtotal (A1 + A3, selected rows only)',
    massAssessment,
  };
}
