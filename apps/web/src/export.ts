import type { ProcessEstimateResponse } from './api';

export interface ProductInputExportRecord {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface ProcessInputExportLink {
  factorId: string;
  productInputId: string | null;
}

export interface ProcessEstimateExportContext {
  productInputs: ProductInputExportRecord[];
  processLinks: ProcessInputExportLink[];
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

type CsvValue = string | number | null | undefined;
type CsvRow = Record<string, CsvValue>;

const columns = [
  'record_type',
  'process_number',
  'declared_input_line_number',
  'declared_input_name',
  'declared_input_quantity',
  'declared_input_unit',
  'input_association_status',
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
];

export function formatProcessEstimatesCsv(
  result: ProcessEstimateResponse,
  context?: ProcessEstimateExportContext,
): string {
  const productInputs = context?.productInputs ?? [];
  const processLinks = context?.processLinks ?? [];
  const inputById = new Map(productInputs.map((input, index) => [input.id, { input, lineNumber: index + 1 }]));
  const rows: CsvRow[] = result.results.flatMap((line, index) => {
    const link = processLinks.find((item) => item.factorId === line.factor_id);
    const linkedInput = link?.productInputId ? inputById.get(link.productInputId) : undefined;
    return line.indicators.map((indicator) => ({
      record_type: 'process_indicator',
      process_number: index + 1,
      declared_input_line_number: linkedInput?.lineNumber ?? '',
      declared_input_name: linkedInput?.input.name ?? '',
      declared_input_quantity: linkedInput?.input.quantity ?? '',
      declared_input_unit: linkedInput?.input.unit ?? '',
      input_association_status: linkedInput
        ? 'user-selected context only; declared input quantity is not used in calculation'
        : 'no declared input association',
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
      aggregation: 'none',
    }));
  });

  const calculatedFactorIds = new Set(result.results.map((line) => line.factor_id));
  const associatedInputIds = new Set(
    processLinks
      .filter((link) => calculatedFactorIds.has(link.factorId) && link.productInputId)
      .map((link) => link.productInputId as string),
  );
  for (const [index, input] of productInputs.entries()) {
    if (associatedInputIds.has(input.id)) continue;
    rows.push({
      record_type: 'declared_input_not_calculated',
      declared_input_line_number: index + 1,
      declared_input_name: input.name,
      declared_input_quantity: input.quantity,
      declared_input_unit: input.unit,
      input_association_status: 'not associated with a calculated process; not calculated and not zero',
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
