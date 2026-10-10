import type { ProcessEstimateResponse } from './api';
import {
  EF31_SINGLE_SCORE_FACTORS,
  EF31_SINGLE_SCORE_SOURCE,
  EF31_WEIGHTING_SOURCE,
  type Ef31IndicatorCode,
} from './ef31-score';
import { assessFlatBomMass, describeBomMassStatus } from './product-bom';
import type { ProcessQuantityBasis } from './product-quantity';
import type { SelectedProcessSummary } from './product-summary';

export interface ProductInputExportRecord {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface ProcessInputExportLink {
  factorId: string;
  productInputId: string | null;
  quantityBasis?: ProcessQuantityBasis;
}

export interface ProcessEstimateExportContext {
  productInputs: ProductInputExportRecord[];
  processLinks: ProcessInputExportLink[];
  finishedProductMassKg?: string;
  flatBomScopeConfirmed?: boolean;
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
  'source_background_note',
  'attribution',
  'result_license',
  'license_url',
  'aggregation',
  'bom_scope_confirmed',
  'bom_mass_status',
  'bom_component_mass_kg',
  'finished_product_mass_kg',
  'bom_mass_difference_kg',
  'bom_mass_coverage_percent',
  'bom_unconvertible_input_names',
  'bom_method_note',
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
        source_background_note: result.background_database_note,
        attribution: result.attribution_text,
        result_license: result.result_license,
        license_url: result.license_url,
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
        source_background_note: result.background_database_note,
        attribution: result.attribution_text,
        result_license: result.result_license,
        license_url: result.license_url,
        aggregation: 'sum of 16 normalised and weighted selected-row indicator totals',
      });
    }
  }

  const finishedProductMass = context?.finishedProductMassKg ?? '';
  if (productInputs.length > 0 || finishedProductMass.trim() !== '') {
    const flatBomScopeConfirmed = context?.flatBomScopeConfirmed === true;
    const bomMass = assessFlatBomMass(productInputs, finishedProductMass, flatBomScopeConfirmed);
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
      bom_method_note: 'Arithmetic comparison of user-declared flat input mass with finished-product mass per functional unit; not a composition, completeness, or environmental-impact validation.',
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
        source_background_note: result.background_database_note,
        attribution: result.attribution_text,
        result_license: result.result_license,
        license_url: result.license_url,
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
