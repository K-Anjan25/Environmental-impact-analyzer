export interface IndicatorFactor {
  code: string;
  name: string;
  unit: string;
  source_factor_value: number;
}

export interface DataQualityScores {
  precision: number | null;
  technological_representativeness: number | null;
  temporal_representativeness: number | null;
  geographical_representativeness: number | null;
}

export interface ProcessFamilySummary {
  id: string;
  label: string;
  group:
    | 'material-production'
    | 'textile-manufacturing'
    | 'garment-assembly'
    | 'footwear-assembly'
    | 'use-phase';
  record_count: number;
  reference_unit_note: string;
}

export interface ProcessFactor {
  id: string;
  family_id: string;
  family_label: string;
  activity: string;
  source_descriptor: string;
  geography_code: string | null;
  geography_label: string | null;
  reference_unit: string;
  indicator_factors: IndicatorFactor[];
  data_quality: DataQualityScores | null;
  input_required_kg_per_reference_unit: number | null;
  source_file: string;
}

export interface FactorCatalog {
  source_id: string;
  source_name: string;
  source_version: string;
  source_url: string;
  total_records: number;
  offset: number;
  limit: number;
  families: ProcessFamilySummary[];
  factors: ProcessFactor[];
}

export interface ProcessSelection {
  factor_id: string;
  quantity: number;
}

export interface IndicatorCalculation {
  code: string;
  name: string;
  factor_value: number;
  factor_unit: string;
  result_value: number;
  result_unit: string;
}

export interface ProcessEstimateLine {
  factor_id: string;
  family_id: string;
  family_label: string;
  activity: string;
  geography_code: string | null;
  geography_label: string | null;
  quantity: number;
  reference_unit: string;
  input_required_kg_per_reference_unit: number | null;
  data_quality: DataQualityScores | null;
  indicators: IndicatorCalculation[];
  source_file: string;
}

export interface ProcessEstimateResponse {
  status: 'calculated';
  methodology_version: string;
  scope: string;
  aggregation: 'none';
  source_id: string;
  source_name: string;
  source_version: string;
  source_url: string;
  results: ProcessEstimateLine[];
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string | Array<{ msg?: string }> }
      | null;
    const detail = payload?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).filter(Boolean).join(' ')
      : detail;
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return (await response.json()) as T;
}

export async function getFactorCatalog(): Promise<FactorCatalog> {
  const response = await fetch('/api/v1/factors?limit=500');
  if (!response.ok) throw new Error(`Could not load process factors (${response.status}).`);
  return (await response.json()) as FactorCatalog;
}

export function calculateProcessEstimates(processes: ProcessSelection[]) {
  return postJson<ProcessEstimateResponse>('/api/v1/process-estimates', { processes });
}
