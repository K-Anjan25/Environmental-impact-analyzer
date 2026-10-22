import { unitToKilograms } from './product-quantity';
import { assessFlatBomMass, type BomMassAssessment, type ProductBomInput } from './product-bom';
import { assessGhgSupplement, type GhgDeclarations, type GhgSupplementResult } from './ghg-supplement';

/*
 * Product boundary, functional unit, component hierarchy, and stage-coverage rules.
 *
 * Two layers are reported separately and never added together:
 * - EF 3.1 (16 indicators): only A1 and A3, from the bundled, openly licensed Carbonfact rows.
 * - Climate change (GHG) only: A2, A4, C2, C3 and C4, from DEFRA 2026 factors (OGL v3.0).
 * Use phase (B) and deconstruction (C1) are excluded on purpose and listed in every report.
 * A stage subtotal is never labelled complete; the best verdict is "partial-boundary".
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

/** Stages whose values come from the EF 3.1 16-indicator rows. */
export const EF_BOUNDARY_STAGES: readonly LifeCycleStage[] = ['A1', 'A3'];
/** Stages whose values are climate change (GHG) only, from the DEFRA 2026 supplement. */
export const GHG_BOUNDARY_STAGES: readonly LifeCycleStage[] = ['A2', 'A4', 'C2', 'C3', 'C4'];
/** Declared boundary: cradle-to-grave without the consumer use phase. */
export const DECLARED_BOUNDARY_STAGES: readonly LifeCycleStage[] = [...EF_BOUNDARY_STAGES, ...GHG_BOUNDARY_STAGES];
export const EXCLUDED_BOUNDARY_STAGES: readonly LifeCycleStage[] = ['B', 'C1'];

export const EXCLUDED_STAGE_REASON: Readonly<Record<'B' | 'C1', string>> = {
  B: 'Use phase depends on consumer washing, drying, and wear. It is excluded from this boundary.',
  C1: 'No separate deconstruction step is modelled. Disposal is covered by C3 and C4.',
};

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
      reason: 'Footwear raw materials must be covered by a PU leather or natural rubber row. Textile fibre production is not in the bundled data.',
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
      reason: 'Apparel raw materials (fibre production) have no rows in the bundled open data, so A1 cannot be covered yet.',
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
    | 'overlapping-process-link'
    | 'scenario-input';
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
  /**
   * covered: EF 3.1 row linked and accepted by the category rule.
   * ghg-only: climate change only, from the DEFRA supplement.
   * not-declared: in the boundary but no transport or end-of-life input given.
   * required-missing: EF stage with no accepted row.
   * no-open-factor: EF stage with no rows in the bundled data for this category.
   * excluded: B or C1, excluded on purpose.
   */
  status: 'covered' | 'ghg-only' | 'not-declared' | 'required-missing' | 'no-open-factor' | 'excluded';
  note: string;
}

export type BoundaryVerdict = 'blocked' | 'stages-missing' | 'partial-boundary';

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
          message: `"${input.name}" is part of a parent loop. A component cannot contain itself.`,
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
  const linkedInputIds = new Set(
    processLinks
      .filter((link) => link.productInputId !== null && link.quantityBasis !== 'manual')
      .map((link) => link.productInputId as string),
  );
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

/**
 * Stage coverage. EF stages (A1, A3) come from linked process rows and the category rule.
 * GHG stages (A2, A4, C2, C3, C4) are covered only by the DEFRA supplement, which is passed in as
 * the set of stages that have a computed value. C4 is reported together with C3 (one waste line).
 */
export function assessStageCoverage(
  category: ProductCategory,
  processLinks: readonly ProcessLinkForBoundary[],
  ghgStages: ReadonlySet<LifeCycleStage> = new Set(),
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
    const linkedProcessCount = countByStage.get(stage) ?? 0;

    if (EXCLUDED_BOUNDARY_STAGES.includes(stage)) {
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary: false,
        covered: false,
        linkedProcessCount,
        status: 'excluded',
        note: EXCLUDED_STAGE_REASON[stage as 'B' | 'C1'],
      };
    }

    if (GHG_BOUNDARY_STAGES.includes(stage)) {
      const declared = ghgStages.has(stage);
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary: true,
        covered: declared,
        linkedProcessCount,
        status: declared ? 'ghg-only' : 'not-declared',
        note: declared
          ? 'Climate change (GHG) only, from DEFRA 2026 factors. The other EF 3.1 indicators are not calculated for this stage.'
          : 'Not declared. Enter this transport or end-of-life scenario to add a climate-change value.',
      };
    }

    // A1 and A3: EF 3.1 rows, checked against the category rule.
    const rule = rules.get(stage);
    const acceptedFamilies = rule?.acceptedFamilies ?? [];
    if (acceptedFamilies.length === 0) {
      missingRequiredStages.push(stage);
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary: true,
        covered: false,
        linkedProcessCount,
        status: 'no-open-factor',
        note: rule?.reason ?? 'No licensed factor rows for this stage in the bundled data.',
      };
    }
    const acceptedHit = [...(familiesByStage.get(stage) ?? [])].some((family) => acceptedFamilies.includes(family));
    if (acceptedHit) {
      return {
        stage,
        label: STAGE_LABEL[stage],
        inBoundary: true,
        covered: true,
        linkedProcessCount,
        status: 'covered',
        note: 'Covered by a locally linked EF 3.1 process row.',
      };
    }
    missingRequiredStages.push(stage);
    return {
      stage,
      label: STAGE_LABEL[stage],
      inBoundary: true,
      covered: false,
      linkedProcessCount,
      status: 'required-missing',
      note: rule?.reason ?? 'No accepted process row is linked to this stage.',
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
  ghg?: GhgDeclarations;
}

export interface ProductBoundaryResult extends ProductBoundaryAssessment {
  massAssessment: BomMassAssessment;
  ghg: GhgSupplementResult;
}

/** Full product-boundary assessment: functional unit, structure, mass closure, stage coverage, GHG layer. */
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

  const ghg = assessGhgSupplement({
    declaredComponentMassKg: massAssessment.declaredInputMassKg,
    finishedProductMassKg: massAssessment.finishedProductMassKg,
    declarations: input.ghg ?? {},
  });
  for (const issue of ghg.issues) {
    structureIssues.push({ severity: 'error', code: 'scenario-input', message: issue, inputIds: [] });
  }

  const ghgStages = new Set<LifeCycleStage>(ghg.declaredStages);
  if (ghgStages.has('C3')) ghgStages.add('C4');

  const { stageCoverage, missingRequiredStages } = assessStageCoverage(
    input.functionalUnit.category,
    input.processLinks,
    ghgStages,
  );

  const hasErrors = [...functionalUnitIssues, ...structureIssues].some((issue) => issue.severity === 'error');
  const verdict: BoundaryVerdict = hasErrors || massAssessment.status !== 'balanced'
    ? 'blocked'
    : missingRequiredStages.length > 0 ? 'stages-missing' : 'partial-boundary';

  const undeclared = stageCoverage.filter((item) => item.status === 'not-declared').map((item) => item.stage);
  const verdictText = verdict === 'blocked'
    ? 'Fix the structure, mass, and scenario issues listed before any subtotal is shown.'
    : verdict === 'stages-missing'
      ? `Required EF stages are not covered: ${missingRequiredStages.map((stage) => `${stage} ${STAGE_LABEL[stage]}`).join('; ')}. The subtotal is not a product total.`
      : `Partial boundary. EF 3.1 covers A1 and A3 only. A2, A4, C2, C3 and C4 are climate change (GHG) only${undeclared.length ? `, and ${undeclared.join(', ')} are not declared` : ''}. B and C1 are excluded. This is not a complete product footprint.`;

  return {
    functionalUnit: input.functionalUnit,
    functionalUnitIssues,
    structureIssues,
    leafInputIds: leaves.map((leaf) => leaf.id),
    stageCoverage,
    missingRequiredStages,
    verdict,
    verdictText,
    subtotalLabel: 'EF 3.1 subtotal (A1 + A3, selected rows) and separate GHG-only layer (A2, A4, C2–C4)',
    massAssessment,
    ghg,
  };
}
