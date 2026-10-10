import type { ProcessEstimateResponse } from './api';

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function formatProcessEstimatesCsv(result: ProcessEstimateResponse): string {
  const columns = [
    'process_number',
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
  const rows = result.results.flatMap((line, index) =>
    line.indicators.map((indicator) => [
      index + 1,
      line.family_label,
      line.activity,
      line.geography_label ?? line.geography_code ?? '',
      line.factor_id,
      line.source_file,
      line.quantity,
      line.reference_unit,
      indicator.code,
      indicator.name,
      indicator.factor_value,
      indicator.factor_unit,
      indicator.result_value,
      indicator.result_unit,
      line.input_required_kg_per_reference_unit,
      line.data_quality?.precision,
      line.data_quality?.temporal_representativeness,
      line.data_quality?.technological_representativeness,
      line.data_quality?.geographical_representativeness,
      result.source_version,
      result.source_url,
      result.background_database_note,
      result.attribution_text,
      result.result_license,
      result.license_url,
      'none',
    ]),
  );
  return [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
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
