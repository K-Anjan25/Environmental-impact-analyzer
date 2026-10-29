import type { ProcessEstimateResponse } from './api';
import {
  EF31_SINGLE_SCORE_FACTORS,
  EF31_SINGLE_SCORE_SOURCE,
  EF31_WEIGHTING_SOURCE,
  type Ef31IndicatorCode,
} from './ef31-score';
import { describeBomMassStatus } from './product-bom';
import { assessProductBoundary, type FunctionalUnitDefinition } from './product-boundary';
import { DEFRA_2026_SOURCE, type GhgDeclarations } from './ghg-supplement';
import type { ProcessQuantityBasis } from './product-quantity';
import type { SelectedProcessSummary } from './product-summary';

export interface ProductInputExportRecord {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  parentId: string | null;
}

export interface ProcessInputExportLink {
  factorId: string;
  familyId: string;
  productInputId: string | null;
  quantityBasis?: ProcessQuantityBasis;
}

export interface ProcessEstimateExportContext {
  productInputs: ProductInputExportRecord[];
  processLinks: ProcessInputExportLink[];
  functionalUnit?: FunctionalUnitDefinition;
  finishedProductMassKg?: string;
  flatBomScopeConfirmed?: boolean;
  ghg?: GhgDeclarations;
  summary?: SelectedProcessSummary | null;
}

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

type CsvValue = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvValue>;

const columns = [
  'record_type',
  'process_number',
  'declared_input_line_number',
  'declared_input_name',
  'declared_input_quantity',
  'declared_input_unit',
  'input_association_status',
  'process_quantity_basis',
  'family',
  'activity',
  'source_geography',
  'source_factor_id',
  'source_file',
  'quantity',
  'reference_unit',
  'indicator_code',
  'indicator_name',
  'published_factor_value',
  'published_factor_unit',
  'scaled_result_value',
  'scaled_result_unit',
  'normalisation_factor',
  'normalisation_unit',
  'normalised_value',
  'weight_percent',
  'weighted_score_contribution',
  'method_source_url',
  'normalisation_source_url',
  'weighting_source_url',
  'input_required_kg_per_reference_unit',
  'dqr_precision',
  'dqr_time_representativeness',
  'dqr_technology_representativeness',
  'dqr_geographical_representativeness',
  'source_version',
  'source_url',
  'aggregation',
  'bom_scope_confirmed',
  'bom_mass_status',
  'bom_component_mass_kg',
  'finished_product_mass_kg',
  'bom_mass_difference_kg',
  'bom_mass_coverage_percent',
  'bom_unconvertible_input_names',
  'bom_method_note',
  'functional_unit',
  'functional_unit_category',
  'stage_coverage',
  'declared_boundary',
  'excluded_stages',
  'ghg_stage',
  'ghg_label',
  'ghg_kg_co2e_per_functional_unit',
  'ghg_calculation',
  'ghg_indicator_scope',
  'ghg_source',
  'ghg_source_url',
  'ghg_retrieved',
  'ghg_source_note',
];

function quantityBasisLabel(basis: ProcessQuantityBasis): string {
  if (basis === 'declared-output') return 'declared input converted as process output';
  if (basis === 'declared-input') return 'declared input mass converted using source input-required value';
  return 'manually entered process reference-unit quantity';
}

export function formatProcessEstimatesCsv(
  result: ProcessEstimateResponse,
  context?: ProcessEstimateExportContext,
): string {
  const productInputs = context?.productInputs ?? [];
  const processLinks = context?.processLinks ?? [];
  const inputById = new Map(productInputs.map((input, index) => [input.id, { input, lineNumber: index + 1 }]));
  const linkByFactorId = new Map(processLinks.map((link) => [link.factorId, link]));
  const rows: CsvRow[] = [];

  if (context?.summary) {
    for (const indicator of context.summary.indicators) {
      const factor = indicator.code in EF31_SINGLE_SCORE_FACTORS
        ? EF31_SINGLE_SCORE_FACTORS[indicator.code as Ef31IndicatorCode]
        : null;
      rows.push({
        record_type: 'selected_process_indicator_total',
        indicator_code: indicator.code,
        indicator_name: indicator.name,
        scaled_result_value: indicator.value,
        scaled_result_unit: indicator.unit,
        normalisation_factor: factor?.normalisationFactor,
        normalisation_unit: factor?.normalisationUnit,
        normalised_value: indicator.normalisedValue,
        weight_percent: indicator.weightPercent,
        weighted_score_contribution: indicator.weightedContribution,
        method_source_url: factor ? EF31_SINGLE_SCORE_SOURCE : '',
        normalisation_source_url: factor ? EF31_SINGLE_SCORE_SOURCE : '',
        weighting_source_url: factor ? EF31_WEIGHTING_SOURCE : '',
        source_version: result.source_version,
        source_url: result.source_url,
        aggregation: 'sum of selected process rows only; not a completeness claim',
      });
    }
    if (context.summary.singleScore) {
      rows.push({
        record_type: 'ef31_single_score',
        indicator_code: 'EF31_SS',
        indicator_name: 'Environmental Footprint 3.1 single score',
        scaled_result_value: context.summary.singleScore.value,
        scaled_result_unit: context.summary.singleScore.unit,
        method_source_url: context.summary.singleScore.sourceUrl,
        normalisation_source_url: context.summary.singleScore.normalisationSourceUrl,
        weighting_source_url: context.summary.singleScore.weightingSourceUrl,
        source_version: result.source_version,
        source_url: result.source_url,
        aggregation: 'sum of 16 normalised and weighted selected-row indicator totals',
      });
    }
  }

  const finishedProductMass = context?.finishedProductMassKg ?? '';
  if (productInputs.length > 0 || finishedProductMass.trim() !== '') {
    const flatBomScopeConfirmed = context?.flatBomScopeConfirmed === true;
    const boundary = assessProductBoundary({
      functionalUnit: context?.functionalUnit ?? { category: 'footwear', basis: 'pair', description: '' },
      inputs: productInputs,
      parentIdByInput: new Map(productInputs.map((input) => [input.id, input.parentId])),
      processLinks: (context?.processLinks ?? []).map((link) => ({
        productInputId: link.productInputId,
        quantityBasis: link.quantityBasis ?? 'manual',
        factorId: link.factorId,
        familyId: link.familyId,
      })),
      finishedProductMass,
      scopeConfirmed: flatBomScopeConfirmed,
      ghg: context?.ghg,
    });
    const bomMass = boundary.massAssessment;
    rows.push({
      record_type: 'product_boundary',
      input_association_status: boundary.verdictText,
      bom_scope_confirmed: flatBomScopeConfirmed,
      bom_mass_status: boundary.verdict,
      functional_unit: boundary.functionalUnit.description,
      functional_unit_category: boundary.functionalUnit.category,
      stage_coverage: boundary.stageCoverage.map((item) => `${item.stage}:${item.status}`).join(' | '),
      declared_boundary: 'EF 3.1: A1 raw materials + A3 manufacturing. GHG only: A2 transport to factory, A4 distribution, C2 transport to waste treatment, C3-C4 waste treatment and disposal.',
      excluded_stages: 'B use (excluded on purpose); C1 deconstruction (excluded on purpose)',
      aggregation: 'EF 3.1 subtotal (selected rows, A1 + A3) and a separate climate-change layer; never summed together; not a complete product footprint',
    });
    for (const line of boundary.ghg.lines) {
      rows.push({
        record_type: 'ghg_supplement',
        ghg_stage: line.stage,
        ghg_label: line.label,
        ghg_kg_co2e_per_functional_unit: line.kgCo2e,
        ghg_calculation: line.detail,
        ghg_indicator_scope: 'climate change (GHG), IPCC AR5 GWP-100 embedded; not one of the 16 EF 3.1 indicators',
        ghg_source: DEFRA_2026_SOURCE.name,
        ghg_source_url: DEFRA_2026_SOURCE.publisherUrl,
        ghg_retrieved: DEFRA_2026_SOURCE.retrieved,
        ghg_source_note: DEFRA_2026_SOURCE.transcriptionNote,
        aggregation: 'climate change only; separate from the EF 3.1 subtotal; not a complete product footprint',
      });
    }
    if (boundary.ghg.totalKgCo2e !== null) {
      rows.push({
        record_type: 'ghg_supplement_total',
        ghg_stage: boundary.ghg.declaredStages.join(' | '),
        ghg_kg_co2e_per_functional_unit: boundary.ghg.totalKgCo2e,
        ghg_indicator_scope: 'climate change (GHG) only',
        aggregation: 'sum of declared A2, A4, C2, C3-C4 climate-change lines; not added to the EF 3.1 subtotal',
      });
    }
    rows.push({
      record_type: 'bom_mass_check',
      input_association_status: describeBomMassStatus(bomMass),
      bom_scope_confirmed: flatBomScopeConfirmed,
      bom_mass_status: bomMass.status,
      bom_component_mass_kg: bomMass.declaredInputMassKg,
      finished_product_mass_kg: bomMass.finishedProductMassKg,
      bom_mass_difference_kg: bomMass.differenceKg,
      bom_mass_coverage_percent: bomMass.massCoveragePercent,
      bom_unconvertible_input_names: bomMass.unconvertibleInputNames.join(' | '),
      bom_method_note: 'Arithmetic check that the user-declared component masses close to the finished-product mass per functional unit. It validates mass closure only; it does not validate component identity, material composition, or environmental impact.',
      aggregation: 'mass diagnostic only; not an environmental impact',
    });
  }

  for (const [index, line] of result.results.entries()) {
    const link = linkByFactorId.get(line.factor_id);
    const linkedInput = link?.productInputId ? inputById.get(link.productInputId) : undefined;
    const basis = link?.quantityBasis ?? 'manual';
    const inputStatus = linkedInput
      ? basis === 'manual'
        ? 'user-selected context only; input quantity is not used for this process calculation'
        : basis === 'declared-output'
          ? 'declared input used locally as process output; unit conversion is browser-only'
          : 'declared input mass used locally as process feed; source input-required value sets output quantity'
      : 'no declared input association';

    for (const indicator of line.indicators) {
      rows.push({
        record_type: 'process_indicator',
        process_number: index + 1,
        declared_input_line_number: linkedInput?.lineNumber ?? '',
        declared_input_name: linkedInput?.input.name ?? '',
        declared_input_quantity: linkedInput?.input.quantity ?? '',
        declared_input_unit: linkedInput?.input.unit ?? '',
        input_association_status: inputStatus,
        process_quantity_basis: quantityBasisLabel(basis),
        family: line.family_label,
        activity: line.activity,
        source_geography: line.geography_label ?? line.geography_code ?? '',
        source_factor_id: line.factor_id,
        source_file: line.source_file,
        quantity: line.quantity,
        reference_unit: line.reference_unit,
        indicator_code: indicator.code,
        indicator_name: indicator.name,
        published_factor_value: indicator.factor_value,
        published_factor_unit: indicator.factor_unit,
        scaled_result_value: indicator.result_value,
        scaled_result_unit: indicator.result_unit,
        input_required_kg_per_reference_unit: line.input_required_kg_per_reference_unit,
        dqr_precision: line.data_quality?.precision,
        dqr_time_representativeness: line.data_quality?.temporal_representativeness,
        dqr_technology_representativeness: line.data_quality?.technological_representativeness,
        dqr_geographical_representativeness: line.data_quality?.geographical_representativeness,
        source_version: result.source_version,
        source_url: result.source_url,
        aggregation: 'separate process row; included in selected-row subtotal when available',
      });
    }
  }

  const calculatedFactorIds = new Set(result.results.map((line) => line.factor_id));
  const calculatedInputIds = new Set(
    processLinks
      .filter((link) => calculatedFactorIds.has(link.factorId) && link.productInputId && link.quantityBasis !== 'manual')
      .map((link) => link.productInputId as string),
  );
  const contextOnlyInputIds = new Set(
    processLinks
      .filter((link) => calculatedFactorIds.has(link.factorId) && link.productInputId && (link.quantityBasis ?? 'manual') === 'manual')
      .map((link) => link.productInputId as string),
  );
  for (const [index, input] of productInputs.entries()) {
    if (calculatedInputIds.has(input.id)) continue;
    rows.push({
      record_type: 'declared_input_not_calculated',
      declared_input_line_number: index + 1,
      declared_input_name: input.name,
      declared_input_quantity: input.quantity,
      declared_input_unit: input.unit,
      input_association_status: contextOnlyInputIds.has(input.id)
        ? 'linked to a manual process row as context; not calculated and not zero'
        : 'not linked to a mapped process; not calculated and not zero',
      aggregation: 'not applicable',
    });
  }

  return [columns, ...rows.map((row) => columns.map((column) => csvCell(row[column])))].map((row) => row.join(',')).join('\r\n');
}

export function downloadProcessEstimatesCsv(csv: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
