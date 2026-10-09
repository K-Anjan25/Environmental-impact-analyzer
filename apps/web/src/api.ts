export type Category = 'apparel' | 'footwear';
export type Provenance = 'user_provided' | 'user_confirmed_extraction';
export type CandidateField =
  | 'material_composition'
  | 'mass_g'
  | 'manufacturing_country'
  | 'certification_claim';

export interface ExtractionCandidate {
  field: CandidateField;
  value: Record<string, string | number>;
  evidence_span: string;
  match_quality: 'clear' | 'possible';
  note: string;
}

export interface ExtractionPreview {
  extractor_version: string;
  candidates: ExtractionCandidate[];
  message: string;
}

export interface MaterialShare {
  material: string;
  share_percent: number;
  provenance: Provenance;
}

export type ProcessStage =
  | 'material_production'
  | 'spinning'
  | 'knitting'
  | 'weaving'
  | 'dyeing'
  | 'printing'
  | 'finishing'
  | 'textile_assembly'
  | 'shoe_assembly'
  | 'other';

export interface ComponentBOMEntry {
  component: string;
  material: string;
  share_percent_of_item: number;
  source_reference: string | null;
  provenance: Provenance;
}

export interface ProcessStageEvidence {
  stage: ProcessStage;
  process_description: string | null;
  reference_unit: string | null;
  country: string | null;
  year: number | null;
  source_reference: string | null;
  loss_waste_notes: string | null;
  waste_treatment: string | null;
  provenance: Provenance;
}

export interface ProductPayload {
  category: Category;
  subtype: string;
  name: string;
  attributes: {
    material_composition: MaterialShare[];
    mass_g: number | null;
    mass_provenance: Provenance;
    manufacturing_country: string | null;
    manufacturing_country_provenance: Provenance;
    certification_claims: string[];
    certification_claims_provenance: Provenance;
    component_bom: ComponentBOMEntry[];
    process_evidence: ProcessStageEvidence[];
  };
}

export interface DataSourceLink {
  label: string;
  url: string;
}

export interface SourceReviewGate {
  id: string;
  title: string;
  details: string;
  status: 'pending';
}

export interface CandidateDataSource {
  id: string;
  name: string;
  version: string;
  release_date: string;
  publisher: string;
  source_url: string;
  repository_url: string;
  changelog_url: string;
  license_name: string;
  license_url: string;
  license_terms_url: string;
  license_review_status: 'pending';
  method_review_status: 'pending';
  review_gates: SourceReviewGate[];
  use_terms_summary: string;
  attribution_text: string;
  attribution_links: DataSourceLink[];
  share_alike_required: true;
  background_database_note: string;
  commercial_license_contact: string;
  scope_summary: string;
  impact_indicators: string[];
  limitations: string[];
  active_for_scoring: false;
}

export interface ProcessMappingRequirement {
  id: string;
  label: string;
  status: 'provided' | 'partial' | 'missing' | 'not_collected' | 'not_selected' | 'not_in_candidate';
  details: string;
  next_step: string;
}

export interface ProcessMappingReadiness {
  source_id: string;
  source_version: string;
  source_url: string;
  status: 'not_ready';
  scoring_enabled: false;
  note: string;
  requirements: ProcessMappingRequirement[];
}

export interface AssessmentResult {
  assessment_id: string;
  product_name: string;
  category: Category;
  subtype: string;
  status: 'not_scored';
  methodology_version: string;
  score: null;
  score_explanation: string;
  functional_unit: string;
  boundary: string;
  confidence: {
    level: 'not_assessed';
    drivers: string[];
  };
  indicators: Array<{
    name: 'climate' | 'water';
    label: string;
    unit: string;
    status: 'unavailable';
    value: null;
    reason: string;
  }>;
  process_mapping_readiness: ProcessMappingReadiness;
  known_facts: Array<{
    label: string;
    value: string;
    provenance: Provenance;
  }>;
  data_gaps: string[];
  limitations: string[];
  next_steps: string[];
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

export async function getCandidateSources(): Promise<CandidateDataSource[]> {
  const response = await fetch('/api/v1/sources');
  if (!response.ok) throw new Error(`Could not load source registry (${response.status}).`);
  return (await response.json()) as CandidateDataSource[];
}

export function previewDescription(category: Category, description: string) {
  return postJson<ExtractionPreview>('/api/v1/extractions/preview', {
    category,
    description,
  });
}

export function assessProduct(product: ProductPayload) {
  return postJson<AssessmentResult>('/api/v1/assessments', product);
}
